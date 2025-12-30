"use client";

import { useEffect, useState, useRef } from 'react';
import { Task, Habit, Reminder } from '@/lib/types';
import { isSameDay, parseISO, isBefore, addMinutes, differenceInMinutes, addHours, addDays, addWeeks, addMonths } from 'date-fns';

export function useNotifications(
  tasks: Task[], 
  habits: Habit[], 
  reminders: Reminder[] = [],
  onTriggerReminder?: (id: string) => void
) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission);
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      
      // Check tasks
      tasks.forEach(task => {
        if (task.isCompleted || !task.dueDate) return;
        
        const dueDate = parseISO(task.dueDate);
        
        // Only check if it's today
        if (!isSameDay(dueDate, now)) return;

        // If it has a time component (simple check: ISO string length > 10)
        if (task.dueDate.length > 10) {
           const diff = differenceInMinutes(dueDate, now);
           
           // Notify if due within 15 minutes and hasn't been notified yet
           const notificationKey = `task-${task.id}-${task.dueDate}`;
           if (diff <= 15 && diff >= 0 && !notifiedIds.current.has(notificationKey)) {
             new Notification(`Quest Due Soon: ${task.title}`, {
               body: `Your quest "${task.title}" is due in ${diff} minutes!`,
               icon: '/icon-192x192.png'
             });
             notifiedIds.current.add(notificationKey);
           }
        }
      });

      // Check custom reminders
      reminders.forEach(reminder => {
        if (!reminder.isActive) return;

        const remindAt = parseISO(reminder.remindAt);
        
        // Notify if due now or passed, and hasn't been notified for this specific time yet
        const notificationKey = `reminder-${reminder.id}-${reminder.remindAt}`;
        if (now >= remindAt && !notifiedIds.current.has(notificationKey)) {
          new Notification(`${reminder.icon || '🔔'} ${reminder.title}`, {
            body: reminder.description || "Time for your reminder!",
            icon: '/icon-192x192.png'
          });
          notifiedIds.current.add(notificationKey);
          
          if (onTriggerReminder) {
            onTriggerReminder(reminder.id);
          }
        }
      });

      // Check habits (Generic reminder at 8 PM if not all daily habits are done)
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        const incompleteDailyHabits = habits.filter(h => 
          h.frequency === 'daily' && 
          !h.completions.some(c => isSameDay(parseISO(c.completedAt), now))
        );

        if (incompleteDailyHabits.length > 0 && !notifiedIds.current.has('daily-habits-' + now.toDateString())) {
           new Notification("Daily Rituals Reminder", {
             body: `You have ${incompleteDailyHabits.length} rituals left to complete today!`,
             icon: '/icon-192x192.png'
           });
           notifiedIds.current.add('daily-habits-' + now.toDateString());
        }
      }
    };

    // Run check immediately and then every 30 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, habits, reminders, permission]);

  return { permission };
}
