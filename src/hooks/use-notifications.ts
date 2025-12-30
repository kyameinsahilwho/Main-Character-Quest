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
             showNotification(`Quest Due Soon: ${task.title}`, {
               body: `Your quest "${task.title}" is due in ${diff} minutes!`,
               icon: '/icon-192x192.png',
               badge: '/icon-192x192.png'
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
          showNotification(`${reminder.icon || '🔔'} ${reminder.title}`, {
            body: reminder.description || "Time for your reminder!",
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
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
           showNotification("Daily Rituals Reminder", {
             body: `You have ${incompleteDailyHabits.length} rituals left to complete today!`,
             icon: '/icon-192x192.png',
             badge: '/icon-192x192.png'
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

  return { 
    permission, 
    isSupported, 
    subscription, 
    subscribeToPush, 
    unsubscribeFromPush 
  };
}
