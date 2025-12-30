"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Reminder, DbReminder, dbReminderToReminder } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { addHours, addDays, addWeeks, addMonths, parseISO } from 'date-fns';
import { useToast } from './use-toast';

const REMINDERS_STORAGE_KEY = 'taskQuestReminders';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useReminders = (user?: User | null) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadReminders = useCallback(async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('remind_at', { ascending: true });

        if (error) throw error;

        const loadedReminders = (data || []).map(dbReminderToReminder);
        setReminders(loadedReminders);
      } else {
        const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
        if (saved) {
          setReminders(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setIsInitialLoad(false);
      hasLoadedRef.current = true;
    }
  }, [user, supabase]);

  useEffect(() => {
    const currentUserId = user?.id || null;
    if (lastUserIdRef.current !== currentUserId) {
      hasLoadedRef.current = false;
      lastUserIdRef.current = currentUserId;
    }
    
    if (!hasLoadedRef.current) {
      loadReminders();
    }
  }, [user, loadReminders]);

  // Sync to localStorage whenever reminders change
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    }
  }, [reminders, isInitialLoad]);

  const addReminder = useCallback(async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'isActive'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: generateId(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setReminders(prev => [...prev, newReminder]);

    if (user) {
      try {
        const { error } = await supabase
          .from('reminders')
          .insert({
            id: newReminder.id,
            user_id: user.id,
            title: newReminder.title,
            description: newReminder.description,
            type: newReminder.type,
            interval_unit: newReminder.intervalUnit,
            interval_value: newReminder.intervalValue,
            remind_at: newReminder.remindAt,
            is_active: newReminder.isActive,
            icon: newReminder.icon,
          });
        if (error) throw error;
        
        toast({
          title: "Reminder Saved",
          description: "Your reminder has been synced to the cloud.",
        });
      } catch (error) {
        console.error('Error adding reminder to Supabase:', error);
        toast({
          title: "Sync Error",
          description: "Failed to save reminder to the cloud. It will be saved locally.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Reminder Created",
        description: "Reminder saved locally.",
      });
    }
  }, [user, supabase, toast]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    if (user) {
      try {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.intervalUnit !== undefined) dbUpdates.interval_unit = updates.intervalUnit;
        if (updates.intervalValue !== undefined) dbUpdates.interval_value = updates.intervalValue;
        if (updates.remindAt !== undefined) dbUpdates.remind_at = updates.remindAt;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;

        const { error } = await supabase
          .from('reminders')
          .update(dbUpdates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating reminder in Supabase:', error);
        toast({
          title: "Update Error",
          description: "Failed to sync changes to the cloud.",
          variant: "destructive",
        });
      }
    }
  }, [user, supabase, toast]);

  const deleteReminder = useCallback(async (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));

    if (user) {
      try {
        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', id);
        if (error) throw error;
        
        toast({
          title: "Reminder Deleted",
          description: "Reminder removed from your journey.",
        });
      } catch (error) {
        console.error('Error deleting reminder from Supabase:', error);
        toast({
          title: "Delete Error",
          description: "Failed to remove reminder from the cloud.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Reminder Deleted",
        description: "Reminder removed locally.",
      });
    }
  }, [user, supabase, toast]);

  const toggleReminderActive = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      await updateReminder(id, { isActive: !reminder.isActive });
    }
  }, [reminders, updateReminder]);

  const triggerReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    if (reminder.type === 'one-time') {
      await deleteReminder(id);
    } else if (reminder.type === 'ongoing' && reminder.intervalUnit && reminder.intervalValue) {
      const nextRemindAt = new Date(parseISO(reminder.remindAt));
      
      switch (reminder.intervalUnit) {
        case 'hours':
          nextRemindAt.setHours(nextRemindAt.getHours() + reminder.intervalValue);
          break;
        case 'days':
          nextRemindAt.setDate(nextRemindAt.getDate() + reminder.intervalValue);
          break;
        case 'weeks':
          nextRemindAt.setDate(nextRemindAt.getDate() + (reminder.intervalValue * 7));
          break;
        case 'months':
          nextRemindAt.setMonth(nextRemindAt.getMonth() + reminder.intervalValue);
          break;
      }
      
      await updateReminder(id, { remindAt: nextRemindAt.toISOString() });
    }
  }, [reminders, deleteReminder, updateReminder]);

  return {
    reminders,
    isInitialLoad,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderActive,
    triggerReminder,
    reloadReminders: loadReminders,
  };
};
