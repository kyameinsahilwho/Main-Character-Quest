export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  subtasks: Subtask[];
  createdAt: string;
  xp?: number;
  projectId?: string | null;
  reminderAt?: string | null;
  reminderEnabled?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'every_2_days' | 'every_3_days' | 'every_4_days' | 'specific_days';
  customDays?: number[];
  currentStreak: number;
  bestStreak: number;
  xp?: number;
  color?: string;
  icon?: string;
  createdAt: string;
  completions: HabitCompletion[];
  totalCompletions?: number;
  archived?: boolean;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  yearlyStats?: {
    achieved: number;
    totalExpected: number;
    year: number;
  };
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: 'one-time' | 'ongoing';
  intervalUnit?: 'hours' | 'days' | 'weeks' | 'months' | 'minutes';
  intervalValue?: number;
  remindAt: string;
  isActive: boolean;
  icon?: string;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
}

export interface Streaks {
  current: number;
  longest: number;
}

// User type for the application
export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}
