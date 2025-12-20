"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Task, Subtask, Streaks, Project } from '@/lib/types';
import { startOfDay, isToday, isYesterday, differenceInCalendarDays, parseISO, format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

const TASKS_STORAGE_KEY = 'taskQuestTasks';
const PROJECTS_STORAGE_KEY = 'taskQuestProjects';
const SAVE_DEBOUNCE_MS = 500; // Debounce localStorage saves

export const useTasks = (user?: User | null, hasSyncedToSupabase?: boolean) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const tasksRef = useRef<Task[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Keep tasksRef in sync with tasks state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Load tasks from localStorage or Supabase
  useEffect(() => {
    // Reset hasLoaded if user changed (login/logout)
    const currentUserId = user?.id || null;
    if (lastUserIdRef.current !== currentUserId) {
      hasLoadedRef.current = false;
      lastUserIdRef.current = currentUserId;
    }
    
    // Only load once per user session
    if (hasLoadedRef.current) return;
    
    const loadTasks = async () => {
      try {
        if (user) {
          // Check if this is first login by looking at sync status
          const syncStatus = localStorage.getItem('task-quest-sync-status');
          const localTasks = localStorage.getItem(TASKS_STORAGE_KEY);
          
          console.log('Loading tasks - sync status:', syncStatus);
          console.log('Has local tasks:', !!localTasks);
          
          // If user just logged in and hasn't synced yet, keep local tasks
          if (syncStatus !== 'synced' && localTasks) {
            console.log('First login detected - loading from localStorage, will sync after');
            const parsedTasks = JSON.parse(localTasks);
            const localProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (localProjects) {
              setProjects(JSON.parse(localProjects));
            }
            console.log('Loaded', parsedTasks.length, 'tasks from localStorage');
            setTasks(parsedTasks);
            hasLoadedRef.current = true;
            setIsInitialLoad(false);
            return;
          }
          
          console.log('Loading tasks from Supabase...');
          // User has synced before or no local data - load from Supabase
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (tasksError) throw tasksError;

          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (projectsError) throw projectsError;

          const { data: subtasksData, error: subtasksError } = await supabase
            .from('subtasks')
            .select('*');

          if (subtasksError) throw subtasksError;

          console.log('Loaded', tasksData?.length || 0, 'tasks from Supabase');
          console.log('Loaded', projectsData?.length || 0, 'projects from Supabase');

          // Convert DB format to app format
          const loadedTasks: Task[] = (tasksData || []).map((dbTask) => ({
            id: dbTask.id,
            title: dbTask.title,
            dueDate: dbTask.due_date || null,
            isCompleted: dbTask.is_completed,
            completedAt: dbTask.completed_at || null,
            subtasks: (subtasksData || [])
              .filter((st) => st.task_id === dbTask.id)
              .map((st) => ({
                id: st.id,
                text: st.title,
                isCompleted: st.is_completed,
              })),
            createdAt: dbTask.created_at,
            isTemplate: dbTask.is_template,
            xp: dbTask.reward_xp || 10,
            projectId: dbTask.project_id,
          }));

          const loadedProjects: Project[] = (projectsData || []).map((dbProject) => ({
            id: dbProject.id,
            name: dbProject.name,
            description: dbProject.description,
            color: dbProject.color,
            icon: dbProject.icon,
            createdAt: dbProject.created_at,
          }));

          setTasks(loadedTasks);
          setProjects(loadedProjects);
          hasLoadedRef.current = true;
        } else {
          // No user - load from localStorage
          const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            console.log('Not logged in - loaded', parsedTasks.length, 'tasks from localStorage');
            setTasks(parsedTasks);
          }
          const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
          if (storedProjects) {
            setProjects(JSON.parse(storedProjects));
          }
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to load tasks", error);
        // Fallback to localStorage
        const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
        hasLoadedRef.current = true;
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadTasks();
  }, [user, supabase]);

  // Save tasks to localStorage or Supabase
  useEffect(() => {
    if (!isInitialLoad) {
      // Debounce saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Always save to localStorage as backup
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));

          // If user is logged in, also save to Supabase
          if (user) {
            // Note: Real-time sync is handled by individual operations
            // This is just a backup/safety mechanism
          }
        } catch (error) {
          console.error("Failed to save tasks", error);
        }
      }, SAVE_DEBOUNCE_MS);

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [tasks, isInitialLoad, user]);

  const stats = useMemo(() => {
    const totalTasks = tasks.filter(t => !t.isTemplate).length;
    const completedTasks = tasks.filter(task => task.isCompleted && !task.isTemplate).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      totalTasks,
      completedTasks,
      completionPercentage,
    };
  }, [tasks]);

  const streaks = useMemo<Streaks>(() => {
    const completedDates = tasks
      .filter(task => task.completedAt && !task.isTemplate)
      .map(task => startOfDay(parseISO(task.completedAt!)))
      .sort((a, b) => a.getTime() - b.getTime());

    if (completedDates.length === 0) return { current: 0, longest: 0 };
    
    // Use a Set for unique dates (more efficient than array operations)
    const uniqueDates = Array.from(
      new Set(completedDates.map(d => d.getTime()))
    ).map(time => new Date(time));

    if (uniqueDates.length === 0) return { current: 0, longest: 0 };

    let longest = 1;
    let current = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const daysDiff = differenceInCalendarDays(uniqueDates[i], uniqueDates[i-1]);
      if (daysDiff === 1) {
        current++;
      } else if (daysDiff > 1) {
        longest = Math.max(longest, current);
        current = 1;
      }
    }
    longest = Math.max(longest, current);
    
    // Calculate current streak
    let currentStreak = 0;
    const lastCompletion = uniqueDates[uniqueDates.length - 1];

    if (isToday(lastCompletion) || isYesterday(lastCompletion)) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const daysDiff = differenceInCalendarDays(uniqueDates[i+1], uniqueDates[i]);
        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          break;
        }
      }
    }

    return { current: currentStreak, longest };
  }, [tasks]);

  // Sync streaks to Supabase whenever they change
  useEffect(() => {
    if (!isInitialLoad && user && streaks) {
      const syncStreaks = async () => {
        try {
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              current_streak: streaks.current,
              longest_streak: streaks.longest,
              tasks_completed: stats.completedTasks,
              total_xp: 0, // Can be implemented later
              level: 1, // Can be implemented later
            }, {
              onConflict: 'user_id'
            });

          if (error) throw error;
        } catch (error) {
          console.error('Error syncing streaks to Supabase:', error);
        }
      };

      syncStreaks();
    }
  }, [streaks, user, isInitialLoad, supabase, stats.completedTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      completedAt: null,
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString(),
      projectId: taskData.projectId,
    };
    
    setTasks(prev => [newTask, ...prev]);

    // Sync to Supabase if user is logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('tasks')
          .insert({
            id: newTask.id,
            user_id: user.id,
            title: newTask.title,
            due_date: newTask.dueDate,
            is_completed: newTask.isCompleted,
            is_template: newTask.isTemplate || false,
            completed_at: newTask.completedAt,
            created_at: newTask.createdAt,
            project_id: newTask.projectId,
          });

        if (error) throw error;

        // Insert subtasks if any
        if (newTask.subtasks.length > 0) {
          const { error: subtasksError } = await supabase
            .from('subtasks')
            .insert(
              newTask.subtasks.map((st) => ({
                id: st.id,
                task_id: newTask.id,
                title: st.text,
                is_completed: st.isCompleted,
              }))
            );

          if (subtasksError) throw subtasksError;
        }
      } catch (error) {
        console.error('Error syncing task to Supabase:', error);
      }
    }
  }, [user, supabase]);

  const addTemplatesToToday = useCallback(async (taskIds: string[]) => {
    setTasks(prev => {
        const tasksToAdd = prev.filter(task => taskIds.includes(task.id));
        const newTasks = tasksToAdd.map(task => ({
            ...task,
            id: crypto.randomUUID(),
            dueDate: new Date().toISOString(),
            isTemplate: false, // Make it a regular task for today
            isCompleted: false,
            completedAt: null,
            subtasks: task.subtasks.map(st => ({...st, isCompleted: false, id: crypto.randomUUID()}))
        }));
        
        // Sync to Supabase if user is logged in
        if (user) {
          newTasks.forEach(async (newTask) => {
            try {
              await supabase.from('tasks').insert({
                id: newTask.id,
                user_id: user.id,
                title: newTask.title,
                due_date: newTask.dueDate,
                is_completed: newTask.isCompleted,
                is_template: newTask.isTemplate,
                completed_at: newTask.completedAt,
                created_at: newTask.createdAt,
                project_id: newTask.projectId,
              });

              if (newTask.subtasks.length > 0) {
                await supabase.from('subtasks').insert(
                  newTask.subtasks.map((st) => ({
                    id: st.id,
                    task_id: newTask.id,
                    title: st.text,
                    is_completed: st.isCompleted,
                  }))
                );
              }
            } catch (error) {
              console.error('Error syncing template task:', error);
            }
          });
        }
        
        return [...prev, ...newTasks];
    });
  }, [user, supabase]);

  const updateTask = useCallback(async (taskId: string, updatedData: Partial<Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updatedData } : task));
    
    // Sync to Supabase
    if (user) {
      try {
        const updatePayload: any = {};
        if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
        if (updatedData.dueDate !== undefined) updatePayload.due_date = updatedData.dueDate;
        if (updatedData.projectId !== undefined) updatePayload.project_id = updatedData.projectId;
        
        const { error } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', taskId);

        if (error) throw error;

        // Sync subtasks if they were updated
        if (updatedData.subtasks !== undefined) {
          // Delete existing subtasks first
          const { error: deleteError } = await supabase
            .from('subtasks')
            .delete()
            .eq('task_id', taskId);

          if (deleteError) throw deleteError;

          // Insert new subtasks
          if (updatedData.subtasks.length > 0) {
            const { error: insertError } = await supabase
              .from('subtasks')
              .insert(
                updatedData.subtasks.map((st) => ({
                  id: st.id,
                  task_id: taskId,
                  title: st.text,
                  is_completed: st.isCompleted,
                }))
              );

            if (insertError) throw insertError;
          }
        }
      } catch (error) {
        console.error('Error updating task in Supabase:', error);
      }
    }
  }, [user, supabase]);
  
  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    
    // Delete from Supabase
    if (user) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
      } catch (error) {
        console.error('Error deleting task from Supabase:', error);
      }
    }
  }, [user, supabase, tasks]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    // First, get the current task to determine new state
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;
    
    const isCompleted = !currentTask.isCompleted;
    const completedAt = isCompleted ? new Date().toISOString() : null;
    
    // Calculate XP with streak bonus
    let newXP = currentTask.xp || 10;
    if (isCompleted) {
      // Check if any other task was completed today to determine if streak increments
      const hasCompletedTaskToday = tasks.some(t => 
        t.id !== taskId && 
        t.isCompleted && 
        t.completedAt && 
        isToday(parseISO(t.completedAt))
      );
      
      const effectiveStreak = hasCompletedTaskToday ? streaks.current : streaks.current + 1;
      const multiplier = Math.min(1 + (effectiveStreak * 0.1), 5);
      newXP = Math.round(10 * multiplier);
    } else {
      // Reset to base XP if uncompleted
      newXP = 10;
    }
    
    // Update local state
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          isCompleted,
          completedAt,
          xp: newXP,
          subtasks: task.subtasks.map(sub => ({ ...sub, isCompleted })),
        };
      }
      return task;
    }));

    // Sync to Supabase
    if (user) {
      try {
        await supabase
          .from('tasks')
          .update({
            is_completed: isCompleted,
            completed_at: completedAt,
            reward_xp: newXP
          })
          .eq('id', taskId);

        // Update all subtasks
        if (currentTask.subtasks.length > 0) {
          for (const subtask of currentTask.subtasks) {
            await supabase
              .from('subtasks')
              .update({ is_completed: isCompleted })
              .eq('id', subtask.id);
          }
        }
      } catch (error) {
        console.error('Error toggling task completion in Supabase:', error);
      }
    }
  }, [user, supabase, tasks, streaks.current]);
  
  const addSubtask = useCallback(async (taskId: string, text: string) => {
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
    };
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const wasCompleted = task.isCompleted;
        return { 
          ...task,
          subtasks: [...task.subtasks, newSubtask],
          isCompleted: wasCompleted ? false : task.isCompleted,
          completedAt: wasCompleted ? null : task.completedAt
        };
      }
      return task;
    }));

    // Sync to Supabase
    if (user) {
      try {
        await supabase.from('subtasks').insert({
          id: newSubtask.id,
          task_id: taskId,
          title: newSubtask.text,
          is_completed: newSubtask.isCompleted,
        });

        // Update task if it was completed
        const task = tasks.find(t => t.id === taskId);
        if (task?.isCompleted) {
          await supabase
            .from('tasks')
            .update({ is_completed: false, completed_at: null })
            .eq('id', taskId);
        }
      } catch (error) {
        console.error('Error adding subtask to Supabase:', error);
      }
    }
  }, [user, supabase, tasks]);

  const toggleSubtaskCompletion = useCallback(async (taskId: string, subtaskId: string): Promise<'subtask' | 'main' | 'none'> => {
    // Get current task to determine changes
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return 'none';
    
    const subtask = currentTask.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return 'none';

    const subtaskNowCompleted = !subtask.isCompleted;
    let changeType: 'subtask' | 'main' | 'none' = subtaskNowCompleted ? 'subtask' : 'none';
    
    const newSubtasks = currentTask.subtasks.map(sub => 
      sub.id === subtaskId ? { ...sub, isCompleted: subtaskNowCompleted } : sub
    );
    const allSubtasksCompleted = newSubtasks.every(sub => sub.isCompleted);
    
    // Determine if main task completion changes
    let newTaskCompleted = currentTask.isCompleted;
    let newTaskCompletedAt = currentTask.completedAt;
    
    if (allSubtasksCompleted && !currentTask.isCompleted) {
      changeType = 'main';
      newTaskCompleted = true;
      newTaskCompletedAt = new Date().toISOString();
    } else if (!allSubtasksCompleted && currentTask.isCompleted) {
      newTaskCompleted = false;
      newTaskCompletedAt = null;
    }
    
    // Update local state
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: newSubtasks,
          isCompleted: newTaskCompleted,
          completedAt: newTaskCompletedAt,
        };
      }
      return task;
    }));

    // Sync to Supabase
    if (user) {
      try {
        // Update the subtask
        await supabase
          .from('subtasks')
          .update({ is_completed: subtaskNowCompleted })
          .eq('id', subtaskId);

        // Update task completion if needed
        await supabase
          .from('tasks')
          .update({
            is_completed: newTaskCompleted,
            completed_at: newTaskCompletedAt,
          })
          .eq('id', taskId);
      } catch (error) {
        console.error('Error toggling subtask in Supabase:', error);
      }
    }

    return changeType;
  }, [user, supabase, tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
        if (a.isTemplate && !b.isTemplate) return 1;
        if (!a.isTemplate && b.isTemplate) return -1;

        if (a.isTemplate && b.isTemplate) {
          return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
        }

        // Incompleted tasks come first
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
      
        // If both are incomplete, sort by due date (earliest first), then creation
        if (!a.isCompleted && !b.isCompleted) {
          if (a.dueDate && b.dueDate) return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
        }

        // If both are complete, sort by completion date (most recent first)
        if (a.completedAt && b.completedAt) {
            return parseISO(b.completedAt).getTime() - parseISO(a.completedAt).getTime();
        }

        return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
    });
  }, [tasks]);

  // Function to reload tasks from Supabase after sync
  const reloadFromSupabase = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: subtasksData, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*');

      if (subtasksError) throw subtasksError;

      const loadedTasks: Task[] = (tasksData || []).map((dbTask) => ({
        id: dbTask.id,
        title: dbTask.title,
        dueDate: dbTask.due_date || null,
        isCompleted: dbTask.is_completed,
        completedAt: dbTask.completed_at || null,
        subtasks: (subtasksData || [])
          .filter((st) => st.task_id === dbTask.id)
          .map((st) => ({
            id: st.id,
            text: st.title,
            isCompleted: st.is_completed,
          })),
        createdAt: dbTask.created_at,
        isTemplate: dbTask.is_template,
        xp: dbTask.reward_xp || 10,
        projectId: dbTask.project_id,
      }));

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        const loadedProjects: Project[] = projectsData.map((dbProject) => ({
          id: dbProject.id,
          name: dbProject.name,
          description: dbProject.description,
          color: dbProject.color,
          icon: dbProject.icon,
          createdAt: dbProject.created_at,
        }));
        setProjects(loadedProjects);
      }

      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error reloading from Supabase:', error);
    }
  }, [user, supabase]);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    setProjects(prev => [newProject, ...prev]);

    if (user) {
      try {
        const { error } = await supabase
          .from('projects')
          .insert({
            id: newProject.id,
            user_id: user.id,
            name: newProject.name,
            description: newProject.description,
            color: newProject.color,
            icon: newProject.icon,
            created_at: newProject.createdAt,
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error syncing project to Supabase:', error);
      }
    }
  }, [user, supabase]);

  const updateProject = useCallback(async (projectId: string, updatedData: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setProjects(prev => prev.map(project => project.id === projectId ? { ...project, ...updatedData } : project));
    
    if (user) {
      try {
        const updatePayload: any = {};
        if (updatedData.name !== undefined) updatePayload.name = updatedData.name;
        if (updatedData.description !== undefined) updatePayload.description = updatedData.description;
        if (updatedData.color !== undefined) updatePayload.color = updatedData.color;
        if (updatedData.icon !== undefined) updatePayload.icon = updatedData.icon;
        
        await supabase
          .from('projects')
          .update(updatePayload)
          .eq('id', projectId);
      } catch (error) {
        console.error('Error updating project in Supabase:', error);
      }
    }
  }, [user, supabase, projects]);

  const deleteProject = useCallback(async (projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
    // Also clear project_id from tasks
    setTasks(prev => prev.map(task => task.projectId === projectId ? { ...task, projectId: null } : task));
    
    if (user) {
      try {
        await supabase.from('projects').delete().eq('id', projectId);
        // Tasks will have project_id set to NULL due to ON DELETE SET NULL in DB
      } catch (error) {
        console.error('Error deleting project from Supabase:', error);
      }
    }
  }, [user, supabase, projects]);

  return {
    tasks: sortedTasks,
    projects,
    stats,
    streaks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    addSubtask,
    toggleSubtaskCompletion,
    addProject,
    updateProject,
    deleteProject,
    isInitialLoad,
    addTemplatesToToday,
    reloadFromSupabase,
  };
};
