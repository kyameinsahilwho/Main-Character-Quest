import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Task, DbTask, DbSubtask, dbTaskToTask, Streaks, DbUserSettings } from '@/lib/types';
import { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'taskQuestTasks'; // Match the key used in use-tasks.ts
const SYNC_STATUS_KEY = 'task-quest-sync-status';

interface LocalStorageData {
  tasks: Task[];
  stats: {
    totalXP: number;
    level: number;
    tasksCompleted: number;
    completionPercentage: number;
  };
  streaks: Streaks;
  lastSyncedAt?: string;
}

export function useSupabaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Sync local storage to Supabase when user logs in
  const syncLocalToSupabase = useCallback(async (userId: string) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Get local storage data
      const localData = localStorage.getItem(STORAGE_KEY);
      if (!localData) {
        console.log('No local data to sync');
        setIsSyncing(false);
        return;
      }

      // Parse tasks array directly
      const localTasks: Task[] = JSON.parse(localData);
      
      // Check if already synced
      const syncStatus = localStorage.getItem(SYNC_STATUS_KEY);
      if (syncStatus === 'synced') {
        console.log('Data already synced, skipping...');
        setIsSyncing(false);
        return;
      }

      console.log(`Syncing ${localTasks.length} local tasks to Supabase...`);

      // Sync tasks and subtasks
      for (const task of localTasks) {
        // Insert task
        const { data: insertedTask, error: taskError } = await supabase
          .from('tasks')
          .upsert({
            id: task.id,
            user_id: userId,
            title: task.title,
            due_date: task.dueDate,
            is_completed: task.isCompleted,
            is_automated: task.isAutomated || false,
            completed_at: task.completedAt,
            created_at: task.createdAt,
          })
          .select()
          .single();

        if (taskError) {
          console.error('Error syncing task:', taskError);
          continue;
        }

        // Insert subtasks
        if (task.subtasks && task.subtasks.length > 0) {
          const subtasksToInsert = task.subtasks.map(subtask => ({
            id: subtask.id,
            task_id: task.id,
            title: subtask.text,
            is_completed: subtask.isCompleted,
          }));

          const { error: subtasksError } = await supabase
            .from('subtasks')
            .upsert(subtasksToInsert);

          if (subtasksError) {
            console.error('Error syncing subtasks:', subtasksError);
          }
        }
      }

      // Mark as synced
      localStorage.setItem(SYNC_STATUS_KEY, 'synced');
      console.log('Local data synced successfully!');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [supabase, isSyncing]);

  // Fetch all data from Supabase
  const fetchFromSupabase = useCallback(async (userId: string): Promise<LocalStorageData | null> => {
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch all subtasks
      const { data: subtasksData, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*');

      if (subtasksError) throw subtasksError;

      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw settingsError;
      }

      // Convert to app format
      const tasks: Task[] = (tasksData || []).map((dbTask: DbTask) => {
        const taskSubtasks = (subtasksData || []).filter(
          (st: DbSubtask) => st.task_id === dbTask.id
        );
        return dbTaskToTask(dbTask, taskSubtasks);
      });

      const settings: DbUserSettings = settingsData || {
        user_id: userId,
        total_xp: 0,
        level: 1,
        tasks_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const completedTasks = tasks.filter(t => t.isCompleted).length;
      const totalTasks = tasks.length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        tasks,
        stats: {
          totalXP: settings.total_xp,
          level: settings.level,
          tasksCompleted: settings.tasks_completed,
          completionPercentage,
        },
        streaks: {
          current: settings.current_streak,
          longest: settings.longest_streak,
        },
        lastSyncedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      return null;
    }
  }, [supabase]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Clear sync status so data can be synced again on next login
      localStorage.removeItem(SYNC_STATUS_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase]);

  return {
    user,
    isLoading,
    isSyncing,
    syncLocalToSupabase,
    fetchFromSupabase,
    signOut,
    supabase,
  };
}
