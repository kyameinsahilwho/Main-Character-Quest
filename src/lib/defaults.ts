import { Task, Habit } from './types';
import { addDays, subDays, startOfDay } from 'date-fns';

export const getDefaultTasks = (): Task[] => {
  const today = startOfDay(new Date());

  return [
    {
      id: 'default-1',
      title: 'Welcome to TaskQuest! 👋',
      dueDate: today.toISOString(),
      isCompleted: false,
      completedAt: null,
      subtasks: [
        { id: 'sub-1', text: 'Explore the dashboard', isCompleted: false },
        { id: 'sub-2', text: 'Check your habits', isCompleted: false }
      ],
      createdAt: subDays(today, 1).toISOString(),
      projectId: null,
      xp: 10
    },
    {
      id: 'default-2',
      title: 'Plan your goals for tomorrow',
      dueDate: addDays(today, 1).toISOString(),
      isCompleted: false,
      completedAt: null,
      subtasks: [],
      createdAt: subDays(today, 1).toISOString(),
      projectId: null,
      xp: 10
    },
    {
      id: 'default-3',
      title: 'Reflect on yesterday\'s achievements',
      dueDate: subDays(today, 1).toISOString(),
      isCompleted: false,
      completedAt: null,
      subtasks: [],
      createdAt: subDays(today, 2).toISOString(),
      projectId: null,
      xp: 10
    },
    {
      id: 'default-4',
      title: 'Set a long term vision',
      dueDate: null,
      isCompleted: false,
      completedAt: null,
      subtasks: [],
      createdAt: subDays(today, 1).toISOString(),
      projectId: null,
      xp: 10
    }
  ];
};

export const getDefaultHabits = (): Habit[] => {
  const today = startOfDay(new Date());

  return [
    {
      id: 'habit-1',
      title: 'Morning Water',
      description: 'Drink a glass of water after waking up',
      frequency: 'daily',
      currentStreak: 0,
      bestStreak: 0,
      createdAt: subDays(today, 1).toISOString(),
      completions: [],
      totalCompletions: 0,
      color: '#3b82f6', // blue
      icon: 'droplet'
    },
    {
      id: 'habit-2',
      title: 'Read 15 mins',
      description: 'Read a book or article',
      frequency: 'daily',
      currentStreak: 0,
      bestStreak: 0,
      createdAt: subDays(today, 1).toISOString(),
      completions: [],
      totalCompletions: 0,
      color: '#8b5cf6', // purple
      icon: 'book-open'
    },
    {
      id: 'habit-3',
      title: 'Workout',
      description: 'Exercise for 30 mins',
      frequency: 'every_2_days',
      currentStreak: 0,
      bestStreak: 0,
      createdAt: subDays(today, 2).toISOString(),
      completions: [],
      totalCompletions: 0,
      color: '#ef4444', // red
      icon: 'dumbbell'
    }
  ];
};
