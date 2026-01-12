"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Task, Subtask, Streaks, Project } from '@/lib/types';
import { getDefaultTasks } from '@/lib/defaults';
import { startOfDay, isToday, isYesterday, differenceInCalendarDays, parseISO, format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import useSWR from 'swr';

const TASKS_STORAGE_KEY = 'taskQuestTasks';
const PROJECTS_STORAGE_KEY = 'taskQuestProjects';
const SAVE_DEBOUNCE_MS = 500; // Debounce localStorage saves

interface FetcherData {
  tasks: Task[];
  projects: Project[];
}

export const useTasks = (user?: User | null, hasSyncedToSupabase: boolean = true) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const tasksRef = useRef<Task[]>([]);
  const projectsRef = useRef<Project[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Keep refs in sync with state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Fetcher for SWR
  const fetcher = useCallback(async (): Promise<FetcherData> => {
    if (!user) {
      return { tasks: [], projects: [] };
    }

    // Check if this is first login by looking at sync status
    const syncStatus = localStorage.getItem('task-quest-sync-status');
    const localTasks = localStorage.getItem(TASKS_STORAGE_KEY);

    // If user just logged in and hasn't synced yet, we shouldn't overwrite local tasks with empty server tasks
    if (syncStatus !== 'synced' && localTasks) {
      console.log('First login detected inside fetcher - aborting server fetch to allow sync');
      // Return null to indicate "do not use this data"
      // However, fetcher returns Promise<FetcherData>.
      // We should probably throw an error or return empty, BUT we need the SWR consumer to know not to use this.
      // Or better, we should have prevented the fetch in useSWR key.
      return { tasks: [], projects: [] };
    }

    console.log('Loading tasks from Supabase...');
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

    // Convert DB format to app format
    const loadedTasks: Task[] = (tasksData || [])
      .filter((dbTask: any) => !dbTask.is_template)
      .map((dbTask: any) => ({
      id: dbTask.id,
      title: dbTask.title,
      dueDate: dbTask.due_date || null,
      isCompleted: dbTask.is_completed,
      completedAt: dbTask.completed_at || null,
      subtasks: (subtasksData || [])
        .filter((st: any) => st.task_id === dbTask.id)
        .map((st: any) => ({
          id: st.id,
          text: st.title,
          isCompleted: st.is_completed,
        })),
      createdAt: dbTask.created_at,
      xp: dbTask.reward_xp || 10,
      projectId: dbTask.project_id,
      reminderAt: dbTask.reminder_at,
      reminderEnabled: dbTask.reminder_enabled,
    }));

    const loadedProjects: Project[] = (projectsData || []).map((dbProject: any) => ({
      id: dbProject.id,
      name: dbProject.name,
      description: dbProject.description,
      color: dbProject.color,
      icon: dbProject.icon,
      createdAt: dbProject.created_at,
    }));

    return { tasks: loadedTasks, projects: loadedProjects };
  }, [user, supabase]);

  const shouldFetch = useMemo(() => {
    if (!user) return false;
    // Don't fetch if we have local data pending sync
    // We rely on the hasSyncedToSupabase prop which should be passed from the parent
    // managing the sync process.
    return hasSyncedToSupabase;
  }, [user, hasSyncedToSupabase]);

  const { data: swrData, mutate } = useSWR(
    shouldFetch ? ['tasks-data', user!.id] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        // Only update state if we have data.
        // This handles the case where we want to prioritize Supabase data.
        if (data) {
          // Double check sync status to be safe (in case it changed during fetch)
          const syncStatus = localStorage.getItem('task-quest-sync-status');
          const localTasks = localStorage.getItem(TASKS_STORAGE_KEY);
          if (syncStatus !== 'synced' && localTasks) {
             console.log('Skipping SWR state update due to pending sync');
             return;
          }

          setTasks(data.tasks);
          setProjects(data.projects);
          setIsInitialLoad(false);
          hasLoadedRef.current = true;
        }
      }
    }
  );

  // Load from localStorage initially (and handle no-user case)
  useEffect(() => {
    // Reset hasLoaded if user changed (login/logout)
    const currentUserId = user?.id || null;
    if (lastUserIdRef.current !== currentUserId) {
      hasLoadedRef.current = false;
      lastUserIdRef.current = currentUserId;
      // If user logs out, we might want to clear tasks or load from LS again?
      // For now, existing logic keeps current state or reloads.
    }
    
    // Only load once per user session
    if (hasLoadedRef.current && !user) return;
    if (hasLoadedRef.current && user && swrData) return; // Already loaded from SWR

    const loadLocalTasks = () => {
      // Always load from local storage first for immediate UI
      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks(getDefaultTasks());
      }

      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }
      
      setIsInitialLoad(false); // UI is ready
    };

    if (!hasLoadedRef.current) {
      loadLocalTasks();
      // If no user, mark as loaded. If user, SWR will handle the rest.
      if (!user) {
        hasLoadedRef.current = true;
      }
    }
  }, [user, swrData]);

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
  }, [tasks, projects, isInitialLoad]);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      totalTasks,
      completedTasks,
      completionPercentage,
    };
  }, [tasks]);

  const streaks = useMemo<Streaks>(() => {
    const completedDates = tasks
      .filter(task => task.completedAt)
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

  const streaksRef = useRef<Streaks>({ current: 0, longest: 0 });
  useEffect(() => {
    streaksRef.current = streaks;
  }, [streaks]);

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
            completed_at: newTask.completedAt,
            created_at: newTask.createdAt,
            project_id: newTask.projectId,
            reminder_at: newTask.reminderAt,
            reminder_enabled: newTask.reminderEnabled,
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
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error syncing task to Supabase:', error);
      }
    }
  }, [user, supabase, mutate]);



  const updateTask = useCallback(async (taskId: string, updatedData: Partial<Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updatedData } : task));
    
    // Sync to Supabase
    if (user) {
      try {
        const updatePayload: any = {};
        if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
        if (updatedData.dueDate !== undefined) updatePayload.due_date = updatedData.dueDate;
        if (updatedData.projectId !== undefined) updatePayload.project_id = updatedData.projectId;
        if (updatedData.reminderAt !== undefined) updatePayload.reminder_at = updatedData.reminderAt;
        if (updatedData.reminderEnabled !== undefined) updatePayload.reminder_enabled = updatedData.reminderEnabled;
        
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
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error updating task in Supabase:', error);
      }
    }
  }, [user, supabase, mutate]);

  const restoreTask = useCallback(async (task: Task) => {
    setTasks(prev => [task, ...prev]);

    if (user) {
        try {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    id: task.id,
                    user_id: user.id,
                    title: task.title,
                    due_date: task.dueDate,
                    is_completed: task.isCompleted,
                    completed_at: task.completedAt,
                    created_at: task.createdAt,
                    project_id: task.projectId,
                    reminder_at: task.reminderAt,
                    reminder_enabled: task.reminderEnabled,
                    reward_xp: task.xp
                });

            if (error) throw error;

            if (task.subtasks.length > 0) {
                const { error: subtasksError } = await supabase
                    .from('subtasks')
                    .insert(
                        task.subtasks.map((st) => ({
                            id: st.id,
                            task_id: task.id,
                            title: st.text,
                            is_completed: st.isCompleted,
                        }))
                    );

                if (subtasksError) throw subtasksError;
            }
            mutate(); // Revalidate
        } catch (error) {
            console.error('Error restoring task to Supabase:', error);
        }
    }
  }, [user, supabase, mutate]);

  const deleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasksRef.current.find(t => t.id === taskId);
    if (!taskToDelete) return;

    setTasks(prev => prev.filter(task => task.id !== taskId));
    
    // Delete from Supabase
    if (user) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error deleting task from Supabase:', error);
      }
    }

    toast({
        title: "Quest Deleted",
        description: `"${taskToDelete.title}" has been removed.`,
        action: (
            <ToastAction altText="Undo" onClick={() => restoreTask(taskToDelete)}>
                Undo
            </ToastAction>
        ),
    });
  }, [user, supabase, restoreTask, mutate]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    // First, get the current task to determine new state
    const currentTask = tasksRef.current.find(t => t.id === taskId);
    if (!currentTask) return;
    
    const isCompleted = !currentTask.isCompleted;
    const completedAt = isCompleted ? new Date().toISOString() : null;
    
    // Calculate XP with streak bonus
    let newXP = currentTask.xp || 10;
    if (isCompleted) {
      // Check if any other task was completed today to determine if streak increments
      const hasCompletedTaskToday = tasksRef.current.some(t =>
        t.id !== taskId && 
        t.isCompleted && 
        t.completedAt && 
        isToday(parseISO(t.completedAt))
      );
      
      const effectiveStreak = hasCompletedTaskToday ? streaksRef.current.current : streaksRef.current.current + 1;
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
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error toggling task completion in Supabase:', error);
      }
    }
  }, [user, supabase, mutate]);
  
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
        const task = tasksRef.current.find(t => t.id === taskId);
        if (task?.isCompleted) {
          await supabase
            .from('tasks')
            .update({ is_completed: false, completed_at: null })
            .eq('id', taskId);
        }
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error adding subtask to Supabase:', error);
      }
    }
  }, [user, supabase, mutate]);

  const toggleSubtaskCompletion = useCallback(async (taskId: string, subtaskId: string): Promise<'subtask' | 'main' | 'none'> => {
    // Get current task to determine changes
    const currentTask = tasksRef.current.find(t => t.id === taskId);
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

        mutate(); // Revalidate
      } catch (error) {
        console.error('Error toggling subtask in Supabase:', error);
      }
    }

    return changeType;
  }, [user, supabase, mutate]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
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
    await mutate();
  }, [mutate]);

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
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error syncing project to Supabase:', error);
      }
    }
  }, [user, supabase, mutate]);

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
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error updating project in Supabase:', error);
      }
    }
  }, [user, supabase, mutate]);

  const restoreProject = useCallback(async (project: Project, affectedTaskIds: string[]) => {
    setProjects(prev => [project, ...prev]);
    // Restore projectId on tasks
    setTasks(prev => prev.map(task => affectedTaskIds.includes(task.id) ? { ...task, projectId: project.id } : task));

    if (user) {
        try {
            const { error } = await supabase
                .from('projects')
                .insert({
                    id: project.id,
                    user_id: user.id,
                    name: project.name,
                    description: project.description,
                    color: project.color,
                    icon: project.icon,
                    created_at: project.createdAt,
                });

            if (error) throw error;

            // Restore projectId on tasks in DB
            // Note: Tasks in DB should currently have NULL projectId due to ON DELETE SET NULL
            if (affectedTaskIds.length > 0) {
                 await supabase
                    .from('tasks')
                    .update({ project_id: project.id })
                    .in('id', affectedTaskIds);
            }
            mutate(); // Revalidate
        } catch (error) {
            console.error('Error restoring project to Supabase:', error);
        }
    }
  }, [user, supabase, mutate]);

  const deleteProject = useCallback(async (projectId: string) => {
    const projectToDelete = projectsRef.current.find(p => p.id === projectId);
    const affectedTaskIds = tasksRef.current.filter(t => t.projectId === projectId).map(t => t.id);

    if (!projectToDelete) return;

    setProjects(prev => prev.filter(project => project.id !== projectId));
    // Also clear project_id from tasks
    setTasks(prev => prev.map(task => task.projectId === projectId ? { ...task, projectId: null } : task));
    
    if (user) {
      try {
        await supabase.from('projects').delete().eq('id', projectId);
        // Tasks will have project_id set to NULL due to ON DELETE SET NULL in DB
        mutate(); // Revalidate
      } catch (error) {
        console.error('Error deleting project from Supabase:', error);
      }
    }

    toast({
        title: "Project Deleted",
        description: `"${projectToDelete.name}" has been removed.`,
        action: (
            <ToastAction altText="Undo" onClick={() => restoreProject(projectToDelete, affectedTaskIds)}>
                Undo
            </ToastAction>
        ),
    });
  }, [user, supabase, restoreProject, mutate]);

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
    reloadFromSupabase,
  };
};
