import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfDay, parseISO, differenceInCalendarDays } from "date-fns";
import { Habit } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isHabitDueToday(habit: Habit): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return true; 
    case 'monthly':
      return true;
    case 'specific_days':
      return habit.customDays?.includes(dayOfWeek) || false;
    case 'every_2_days':
    case 'every_3_days':
    case 'every_4_days':
      const interval = parseInt(habit.frequency.split('_')[1]);
      const startDate = startOfDay(parseISO(habit.createdAt));
      const diffDays = differenceInCalendarDays(startOfDay(today), startDate);
      return diffDays >= 0 && diffDays % interval === 0;
    default:
      return false;
  }
}
