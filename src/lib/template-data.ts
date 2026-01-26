import { Task, Project, Habit } from './types';

// Check if this is a first-time visitor
export const isFirstTimeVisitor = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('pollytasks_has_visited');
};

// Mark that the user has visited
export const markAsVisited = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pollytasks_has_visited', 'true');
};

// Template Projects for first-time visitors
export const getTemplateProjects = (): Project[] => {
    const now = new Date().toISOString();
    return [
        {
            id: 'template-project-1',
            name: 'Getting Started',
            description: 'Learn how to use Pollytasks effectively',
            color: '#65d01e',
            icon: '🚀',
            createdAt: now,
        },
        {
            id: 'template-project-2',
            name: 'Personal Goals',
            description: 'My personal development goals',
            color: '#3b82f6',
            icon: '🎯',
            createdAt: now,
        },
    ];
};

// Template Tasks for first-time visitors
export const getTemplateTasks = (): Task[] => {
    const now = new Date().toISOString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
        {
            id: 'template-task-1',
            title: '👋 Welcome to Pollytasks!',
            dueDate: null,
            isCompleted: false,
            completedAt: null,
            createdAt: now,
            projectId: 'template-project-1',
            xp: 10,
            subtasks: [
                { id: 'template-subtask-1', text: 'Tap this task to see details', isCompleted: false },
                { id: 'template-subtask-2', text: 'Complete subtasks to make progress', isCompleted: false },
                { id: 'template-subtask-3', text: 'Complete all subtasks to finish the quest', isCompleted: false },
            ],
        },
        {
            id: 'template-task-2',
            title: '🎮 Complete your first quest',
            dueDate: tomorrow.toISOString(),
            isCompleted: false,
            completedAt: null,
            createdAt: now,
            projectId: 'template-project-1',
            xp: 10,
            subtasks: [],
        },
        {
            id: 'template-task-3',
            title: '📱 Explore the Projects tab',
            dueDate: null,
            isCompleted: false,
            completedAt: null,
            createdAt: now,
            projectId: 'template-project-1',
            xp: 10,
            subtasks: [],
        },
        {
            id: 'template-task-4',
            title: '🔄 Check out the Rituals tab',
            dueDate: null,
            isCompleted: false,
            completedAt: null,
            createdAt: now,
            projectId: 'template-project-1',
            xp: 10,
            subtasks: [],
        },
        {
            id: 'template-task-5',
            title: '⭐ Create your own quest!',
            dueDate: nextWeek.toISOString(),
            isCompleted: false,
            completedAt: null,
            createdAt: now,
            projectId: 'template-project-2',
            xp: 10,
            subtasks: [],
        },
    ];
};

// Template Habits for first-time visitors
export const getTemplateHabits = (): Habit[] => {
    const now = new Date().toISOString();

    return [
        {
            id: 'template-habit-1',
            title: 'Morning Routine',
            description: 'Start your day right',
            frequency: 'daily' as const,
            currentStreak: 0,
            bestStreak: 0,
            color: '#f59e0b',
            icon: '☀️',
            createdAt: now,
            totalCompletions: 0,
            completions: [],
            xp: 0,
            yearlyStats: { achieved: 0, totalExpected: 365, year: new Date().getFullYear() },
        },
        {
            id: 'template-habit-2',
            title: 'Exercise',
            description: 'Stay active and healthy',
            frequency: 'every_2_days' as const,
            currentStreak: 0,
            bestStreak: 0,
            color: '#ef4444',
            icon: '💪',
            createdAt: now,
            totalCompletions: 0,
            completions: [],
            xp: 0,
            yearlyStats: { achieved: 0, totalExpected: 183, year: new Date().getFullYear() },
        },
        {
            id: 'template-habit-3',
            title: 'Read for 30 mins',
            description: 'Expand your knowledge',
            frequency: 'daily' as const,
            currentStreak: 0,
            bestStreak: 0,
            color: '#8b5cf6',
            icon: '📚',
            createdAt: now,
            totalCompletions: 0,
            completions: [],
            xp: 0,
            yearlyStats: { achieved: 0, totalExpected: 365, year: new Date().getFullYear() },
        },
    ];
};
