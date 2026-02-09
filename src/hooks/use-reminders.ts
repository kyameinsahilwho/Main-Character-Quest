"use client";

import { useMemo, useCallback } from 'react';
import { Reminder } from '@/lib/types';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useToast } from './use-toast';
import { parseISO } from 'date-fns';

const mapReminder = (r: any): Reminder => ({
  id: r._id,
  title: r.title,
  description: r.description,
  type: r.type as 'one-time' | 'ongoing',
  intervalUnit: r.intervalUnit as 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | undefined,
  intervalValue: r.intervalValue,
  remindAt: r.remindAt,
  isActive: r.isActive,
  icon: r.icon,
  createdAt: "",
});

export const useReminders = (initialReminders?: Doc<"reminders">[]) => {
  const { toast } = useToast();
  const rawReminders = useQuery(api.reminders.get);
  const addReminderMutation = useMutation(api.reminders.add);
  const updateReminderMutation = useMutation(api.reminders.update);
  const deleteReminderMutation = useMutation(api.reminders.remove);

  const reminders: Reminder[] = useMemo(() => {
    if (!rawReminders) {
      return (initialReminders ? initialReminders.map(mapReminder) : []).sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
    }
    return rawReminders.map(mapReminder).sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
  }, [rawReminders, initialReminders]);

  const addReminder = useCallback(async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      await addReminderMutation({
        title: reminderData.title,
        description: reminderData.description,
        type: reminderData.type,
        intervalUnit: reminderData.intervalUnit,
        intervalValue: reminderData.intervalValue,
        remindAt: reminderData.remindAt,
        isActive: true,
        icon: reminderData.icon
      });
      toast({
        title: "Reminder Saved",
        description: "Your reminder has been synced to the cloud.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save reminder.",
        variant: "destructive"
      });
    }
  }, [addReminderMutation, toast]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.intervalUnit !== undefined) dbUpdates.intervalUnit = updates.intervalUnit;
      if (updates.intervalValue !== undefined) dbUpdates.intervalValue = updates.intervalValue;
      if (updates.remindAt !== undefined) dbUpdates.remindAt = updates.remindAt;
      if (updates.isActive !== undefined) dbUpdates.isActive = updates.isActive;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;

      await updateReminderMutation({
        id: id as Id<"reminders">,
        ...dbUpdates
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update reminder.",
        variant: "destructive"
      });
    }
  }, [updateReminderMutation, toast]);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      await deleteReminderMutation({ id: id as Id<"reminders"> });
      toast({
        title: "Reminder Deleted",
        description: "Reminder removed from your journey.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete reminder.",
        variant: "destructive"
      });
    }
  }, [deleteReminderMutation, toast]);

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
    isInitialLoad: rawReminders === undefined && !initialReminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderActive,
    triggerReminder,
    reloadReminders: async () => { }, // No-op
  };
};
