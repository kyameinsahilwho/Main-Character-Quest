"use client";

import { useEffect, useState, useRef } from 'react';
import { Task, Habit, Reminder } from '@/lib/types';
import { isSameDay, parseISO, isBefore, addMinutes, differenceInMinutes, addHours, addDays, addWeeks, addMonths } from 'date-fns';
import { subscribeUser, unsubscribeUser } from '@/app/actions/notifications';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications(
  tasks: Task[], 
  habits: Habit[], 
  reminders: Reminder[] = [],
  onTriggerReminder?: (id: string) => void
) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission);
      }
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      setSubscription(sub);
      await subscribeUser(sub as any);
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
    }
  }

  async function unsubscribeFromPush() {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
    }
  }

  useEffect(() => {
    if (permission !== 'granted') return;

    const showNotification = async (title: string, options: NotificationOptions) => {
      try {
        // On Android/Chrome, we must use the Service Worker registration to show notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            ...options,
            icon: options.icon || '/icon-192x192.png',
            badge: options.badge || '/icon-192x192.png',
          });
        } else {
          new Notification(title, options);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback for browsers that don't support SW notifications but support the constructor
        try {
          new Notification(title, options);
        } catch (e) {
          console.error('Final fallback notification failed:', e);
        }
      }
    };

    const checkReminders = () => {
      const now = new Date();
      
      // Check tasks
      tasks.forEach(task => {
        if (task.isCompleted) return;
        
        // Check explicit reminder
        if (task.reminderEnabled && task.reminderAt) {
          const reminderTime = parseISO(task.reminderAt);
          const diff = differenceInMinutes(reminderTime, now);
          const notificationKey = `task-reminder-${task.id}-${task.reminderAt}`;
          
          if (diff <= 0 && diff > -5 && !notifiedIds.current.has(notificationKey)) {
             showNotification(`Quest Reminder: ${task.title}`, {
               body: `It's time for your quest "${task.title}"!`,
               icon: '/icon-192x192.png',
               badge: '/icon-192x192.png'
             });
             notifiedIds.current.add(notificationKey);
          }
        }
      });

      // Check habits
      habits.forEach(habit => {
        if (habit.reminderEnabled && habit.reminderTime) {
           const [hours, minutes] = habit.reminderTime.split(':').map(Number);
           const reminderTime = new Date(now);
           reminderTime.setHours(hours, minutes, 0, 0);
           
           const diff = differenceInMinutes(reminderTime, now);
           const notificationKey = `habit-reminder-${habit.id}-${now.toDateString()}`;
           
           // Check if habit is already completed today
           const isCompletedToday = habit.completions.some(c => isSameDay(parseISO(c.completedAt), now));
           
           if (!isCompletedToday && diff <= 0 && diff > -5 && !notifiedIds.current.has(notificationKey)) {
              // Check frequency
              let isScheduled = false;
              if (habit.frequency === 'daily') isScheduled = true;
              else if (habit.frequency === 'specific_days' && habit.customDays?.includes(now.getDay())) isScheduled = true;
              else if (habit.frequency === 'weekly') isScheduled = true; // Simplify for now, or check if start of week?
              else if (['every_2_days', 'every_3_days', 'every_4_days'].includes(habit.frequency)) {
                 const interval = parseInt(habit.frequency.split('_')[1]);
                 const startDate = parseISO(habit.createdAt);
                 const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                 if (diffDays >= 0 && diffDays % interval === 0) isScheduled = true;
              }
              
              if (isScheduled) {
                 showNotification(`Ritual Reminder: ${habit.title}`, {
                   body: `Time for your ritual "${habit.title}"!`,
                   icon: '/icon-192x192.png',
                   badge: '/icon-192x192.png'
                 });
                 notifiedIds.current.add(notificationKey);
              }
           }
        }
      });
    };

    // Run check immediately and then every 30 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, habits, reminders, permission]);

  return { 
    permission, 
    isSupported, 
    subscription, 
    subscribeToPush, 
    unsubscribeFromPush 
  };
}
