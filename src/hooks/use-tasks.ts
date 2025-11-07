"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Subtask, Streaks } from '@/lib/types';
import { startOfDay, isToday, isYesterday, differenceInCalendarDays, parseISO } from 'date-fns';

const TASKS_STORAGE_KEY = 'taskQuestTasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
      }
    }
  }, [tasks, isInitialLoad]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      completedAt: null,
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((taskId: string, updatedData: Partial<Task>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updatedData } : task));
  }, []);
  
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const isCompleted = !task.isCompleted;
        return {
          ...task,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null,
          subtasks: task.subtasks.map(sub => ({ ...sub, isCompleted })),
        };
      }
      return task;
    }));
  }, []);
  
  const addSubtask = useCallback((taskId: string, text: string) => {
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
    };
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        // When adding a subtask, if the parent was complete, un-complete it
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
  }, []);

  const toggleSubtaskCompletion = useCallback((taskId: string, subtaskId: string): 'subtask' | 'main' | 'none' => {
    let changeType: 'subtask' | 'main' | 'none' = 'none';
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (!subtask) return task;

        const subtaskNowCompleted = !subtask.isCompleted;

        if (subtaskNowCompleted) {
          changeType = 'subtask';
        }

        const newSubtasks = task.subtasks.map(sub => sub.id === subtaskId ? { ...sub, isCompleted: subtaskNowCompleted } : sub);
        const allSubtasksCompleted = newSubtasks.every(sub => sub.isCompleted);
        
        if (allSubtasksCompleted && !task.isCompleted) {
          // If all subtasks are now complete, complete the parent task
          changeType = 'main';
          return {
            ...task,
            subtasks: newSubtasks,
            isCompleted: true,
            completedAt: new Date().toISOString(),
          };
        } else if (!allSubtasksCompleted && task.isCompleted) {
          // If a subtask is unchecked, un-complete the parent task
           return {
             ...task,
            subtasks: newSubtasks,
            isCompleted: false,
            completedAt: null,
          }
        }
        return { ...task, subtasks: newSubtasks };
      }
      return task;
    }));
    return changeType;
  }, []);

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
    
    const uniqueDates = [...new Set(completedDates.map(d => d.toISOString()))].map(ds => parseISO(ds));

    let longest = 0;
    let current = 0;
    if(uniqueDates.length > 0) {
      longest = 1;
      current = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        if (differenceInCalendarDays(uniqueDates[i], uniqueDates[i-1]) === 1) {
          current++;
        } else if (differenceInCalendarDays(uniqueDates[i], uniqueDates[i-1]) > 1) {
          longest = Math.max(longest, current);
          current = 1;
        }
      }
      longest = Math.max(longest, current);
    }
    
    let currentStreak = 0;
    const today = startOfDay(new Date());
    const lastCompletion = uniqueDates[uniqueDates.length - 1];

    if (lastCompletion && (isToday(lastCompletion) || isYesterday(lastCompletion))) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        if (differenceInCalendarDays(uniqueDates[i+1], uniqueDates[i]) === 1) {
          currentStreak++;
        } else if (differenceInCalendarDays(uniqueDates[i+1], uniqueDates[i]) > 1) {
          break;
        }
      }
    }
    if(lastCompletion && !isToday(lastCompletion) && !isYesterday(lastCompletion)){
      currentStreak = 0;
    }


    return { current: currentStreak, longest };
  }, [tasks]);

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

  return {
    tasks: sortedTasks,
    stats,
    streaks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    addSubtask,
    toggleSubtaskCompletion,
    isInitialLoad,
  };
};
