"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Task, Subtask, Streaks, Project } from '@/lib/types';
import { startOfDay, isToday, isYesterday, differenceInCalendarDays, parseISO } from 'date-fns';
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { isFirstTimeVisitor, markAsVisited, getTemplateTasks, getTemplateProjects } from '@/lib/template-data';

const mapTask = (t: any, optimisticUpdates: any = {}): Task => {
    const baseTask: Task = {
        id: t._id,
        title: t.title,
        dueDate: t.dueDate || null,
        isCompleted: t.isCompleted,
        completedAt: t.completedAt || null,
        createdAt: t.createdAt,
        projectId: t.projectId || null,
        reminderAt: t.reminderAt,
        reminderEnabled: t.reminderEnabled,
        xp: t.rewardXp,
        subtasks: (t.subtasks || []).map((st: any) => ({
            id: st._id,
            text: st.title,
            isCompleted: st.isCompleted
        }))
    };

    const optimistic = optimisticUpdates[t._id];
    if (optimistic) {
        return { ...baseTask, ...optimistic };
    }
    return baseTask;
};

const mapProject = (p: any): Project => ({
    id: p._id,
    name: p.name,
    description: p.description,
    color: p.color,
    icon: p.icon,
    createdAt: p.createdAt
});

// Optimistic update storage key
const OPTIMISTIC_TASKS_KEY = 'pollytasks_optimistic_tasks';
const OPTIMISTIC_PROJECTS_KEY = 'pollytasks_optimistic_projects';

// Cache keys for localStorage-first approach
const CACHE_KEYS = {
    tasks: 'pollytasks_cache_tasks',
    projects: 'pollytasks_cache_projects',
};

// Cache expiry in milliseconds (10 minutes)
const CACHE_EXPIRY = 10 * 60 * 1000;

interface CachedData<T> {
    data: T;
    timestamp: number;
}

function getCachedData<T>(key: string): T | null {
    try {
        if (typeof window === 'undefined') return null;
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const parsed: CachedData<T> = JSON.parse(cached);
        const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRY;

        if (isExpired) {
            localStorage.removeItem(key);
            return null;
        }

        return parsed.data;
    } catch {
        return null;
    }
}

function setCachedData<T>(key: string, data: T): void {
    try {
        if (typeof window === 'undefined') return;
        const cached: CachedData<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
        console.error("Failed to cache data:", e);
    }
}

export const useTasks = (
    initialTasks?: Doc<"tasks">[],
    initialProjects?: Doc<"projects">[]
) => {
    // Auth state
    const { isAuthenticated: _realIsAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const [forceLocal, setForceLocal] = useState(false);

    // Use local fallback if auth fails or explicitly forced
    const isAuthenticated = _realIsAuthenticated && !forceLocal;

    // Convex Queries
    const rawTasks = useQuery(api.tasks.get);
    const rawProjects = useQuery(api.projects.get);
    const addProjectMutation = useMutation(api.projects.add);

    // Local State (for unauthenticated users)
    const [localTasks, setLocalTasks] = useState<Task[]>([]);
    const [localProjects, setLocalProjects] = useState<Project[]>([]);
    const [isLocalLoaded, setIsLocalLoaded] = useState(false);

    // Cached data for localStorage-first approach (authenticated users)
    const [cachedTasks] = useState<Task[] | null>(() => getCachedData<Task[]>(CACHE_KEYS.tasks));
    const [cachedProjects] = useState<Project[] | null>(() => getCachedData<Project[]>(CACHE_KEYS.projects));

    // Optimistic updates state - overlay on top of server data
    const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<Task>>>({});
    const pendingMutations = useRef<Set<string>>(new Set());

    // Load from LocalStorage (with template data for first-time visitors)
    useEffect(() => {
        if (!isAuthenticated && !isAuthLoading && !isLocalLoaded) {
            try {
                const storedTasks = localStorage.getItem('pollytasks_tasks');
                const storedProjects = localStorage.getItem('pollytasks_projects');

                // Check if first-time visitor (no stored data and hasn't visited before)
                if (!storedTasks && !storedProjects && isFirstTimeVisitor()) {
                    // Seed template data for first-time visitors
                    setLocalTasks(getTemplateTasks());
                    setLocalProjects(getTemplateProjects());
                    markAsVisited();
                } else {
                    // Load existing data
                    if (storedTasks) {
                        const parsed = JSON.parse(storedTasks);
                        setLocalTasks(parsed);
                    }
                    if (storedProjects) {
                        const parsed = JSON.parse(storedProjects);
                        setLocalProjects(parsed);
                    }
                }
            } catch (e) {
                console.error("Failed to load local tasks", e);
            } finally {
                setIsLocalLoaded(true);
            }
        }
    }, [isAuthenticated, isAuthLoading, isLocalLoaded]);

    // Load optimistic updates from localStorage on mount (for persistence across refreshes)
    useEffect(() => {
        try {
            const stored = localStorage.getItem(OPTIMISTIC_TASKS_KEY);
            if (stored) {
                setOptimisticUpdates(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load optimistic updates", e);
        }
    }, []);

    // Save optimistic updates to localStorage
    useEffect(() => {
        if (Object.keys(optimisticUpdates).length > 0) {
            localStorage.setItem(OPTIMISTIC_TASKS_KEY, JSON.stringify(optimisticUpdates));
        } else {
            localStorage.removeItem(OPTIMISTIC_TASKS_KEY);
        }
    }, [optimisticUpdates]);

    // Save to LocalStorage
    useEffect(() => {
        if (!isAuthenticated && !isAuthLoading && isLocalLoaded) {
            localStorage.setItem('pollytasks_tasks', JSON.stringify(localTasks));
            localStorage.setItem('pollytasks_projects', JSON.stringify(localProjects));
        }
    }, [localTasks, localProjects, isAuthenticated, isAuthLoading, isLocalLoaded]);

    const addTaskMutation = useMutation(api.tasks.add);
    const updateTaskMutation = useMutation(api.tasks.update);
    const deleteTaskMutation = useMutation(api.tasks.remove);

    const addSubtaskMutation = useMutation(api.tasks.addSubtask);
    const updateSubtaskMutation = useMutation(api.tasks.updateSubtask);
    const removeSubtaskMutation = useMutation(api.tasks.removeSubtask);

    const updateProjectMutation = useMutation(api.projects.update);
    const deleteProjectMutation = useMutation(api.projects.remove);

    // Challenge progress tracking
    const updateChallengeProgressMutation = useMutation(api.challenges.updateChallengeProgress);

    // Map Convex data to App types with optimistic updates applied
    const tasks: Task[] = useMemo(() => {
        if (isAuthenticated) {
            // Use cached data while server data is loading (localStorage-first)
            if (!rawTasks) {
                return (initialTasks !== undefined ? initialTasks.map(t => mapTask(t, optimisticUpdates)) : cachedTasks) ?? [];
            }
            return rawTasks.map(t => mapTask(t, optimisticUpdates));
        } else {
            return localTasks;
        }
    }, [rawTasks, isAuthenticated, localTasks, optimisticUpdates, cachedTasks, initialTasks]);

    // Cache fresh tasks data when received from server
    useEffect(() => {
        if (isAuthenticated && rawTasks !== undefined) {
            const mappedTasks: Task[] = rawTasks.map(t => mapTask(t, {}));
            setCachedData(CACHE_KEYS.tasks, mappedTasks);
        }
    }, [rawTasks, isAuthenticated]);

    const projects: Project[] = useMemo(() => {
        if (isAuthenticated) {
            // Use cached data while server data is loading (localStorage-first)
            if (!rawProjects) {
                return (initialProjects !== undefined ? initialProjects.map(mapProject) : cachedProjects) ?? [];
            }
            return rawProjects.map(mapProject);
        } else {
            return localProjects;
        }
    }, [rawProjects, isAuthenticated, localProjects, cachedProjects, initialProjects]);

    // Cache fresh projects data when received from server
    useEffect(() => {
        if (isAuthenticated && rawProjects !== undefined) {
            const mappedProjects: Project[] = rawProjects.map(mapProject);
            setCachedData(CACHE_KEYS.projects, mappedProjects);
        }
    }, [rawProjects, isAuthenticated]);

    // Derived state (Stats & Streaks)
    const stats = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.isCompleted).length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
            totalTasks,
            completedTasks,
            completionPercentage,
        };
    }, [tasks]);

    const streaks = useMemo<Streaks>(() => {
        const completedDates = tasks
            .filter(task => task.completedAt)
            .map(task => startOfDay(parseISO(task.completedAt!)))
            .sort((a, b) => a.getTime() - b.getTime());

        if (completedDates.length === 0) return { current: 0, longest: 0 };

        const uniqueDates = Array.from(
            new Set(completedDates.map(d => d.getTime()))
        ).map(time => new Date(time));

        if (uniqueDates.length === 0) return { current: 0, longest: 0 };

        let longest = 1;
        let current = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const daysDiff = differenceInCalendarDays(uniqueDates[i], uniqueDates[i - 1]);
            if (daysDiff === 1) {
                current++;
            } else if (daysDiff > 1) {
                longest = Math.max(longest, current);
                current = 1;
            }
        }
        longest = Math.max(longest, current);

        let currentStreak = 0;
        const lastCompletion = uniqueDates[uniqueDates.length - 1];

        if (isToday(lastCompletion) || isYesterday(lastCompletion)) {
            currentStreak = 1;
            for (let i = uniqueDates.length - 2; i >= 0; i--) {
                const daysDiff = differenceInCalendarDays(uniqueDates[i + 1], uniqueDates[i]);
                if (daysDiff === 1) {
                    currentStreak++;
                } else if (daysDiff > 1) {
                    break;
                }
            }
        }

        return { current: currentStreak, longest };
    }, [tasks]);

    // Helper: Apply optimistic update
    const applyOptimisticUpdate = useCallback((taskId: string, update: Partial<Task>) => {
        setOptimisticUpdates(prev => ({
            ...prev,
            [taskId]: { ...(prev[taskId] || {}), ...update }
        }));
    }, []);

    // Helper: Clear optimistic update
    const clearOptimisticUpdate = useCallback((taskId: string) => {
        setOptimisticUpdates(prev => {
            const next = { ...prev };
            delete next[taskId];
            return next;
        });
    }, []);

    // Action wrappers
    const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
        const handleLocalAdd = () => {
            const newTask: Task = {
                id: crypto.randomUUID(),
                title: taskData.title,
                dueDate: taskData.dueDate,
                isCompleted: false,
                completedAt: null,
                createdAt: new Date().toISOString(),
                projectId: taskData.projectId,
                reminderAt: taskData.reminderAt,
                reminderEnabled: taskData.reminderEnabled,
                xp: taskData.xp || 10,
                subtasks: (taskData.subtasks || []).map(st => ({
                    id: crypto.randomUUID(),
                    text: st.text,
                    isCompleted: st.isCompleted
                }))
            };
            setLocalTasks(prev => [...prev, newTask]);
        };

        if (isAuthenticated) {
            try {
                await addTaskMutation({
                    title: taskData.title,
                    dueDate: taskData.dueDate || undefined,
                    projectId: taskData.projectId ? taskData.projectId as Id<"projects"> : undefined,
                    reminderAt: taskData.reminderAt || undefined,
                    reminderEnabled: taskData.reminderEnabled,
                    rewardXp: taskData.xp || 10,
                    isCompleted: false,
                    createdAt: new Date().toISOString(),
                    subtasks: (taskData.subtasks || []).map(st => ({
                        title: st.text,
                        isCompleted: st.isCompleted
                    }))
                });
            } catch (error: any) {
                console.error("Mutation failed, falling back to local:", error);
                if (error.message?.includes("Unauthorized") || error.toString().includes("Unauthorized")) {
                    setForceLocal(true);
                    handleLocalAdd();
                } else {
                    throw error;
                }
            }
        } else {
            handleLocalAdd();
        }
    }, [addTaskMutation, isAuthenticated]);


    const updateTask = useCallback(async (taskId: string, updatedData: Partial<Task>) => {
        const handleLocalUpdate = () => {
            setLocalTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, ...updatedData } : t
            ));
        };

        if (isAuthenticated) {
            try {
                const updates: any = {};
                if (updatedData.title !== undefined) updates.title = updatedData.title;
                if (updatedData.dueDate !== undefined) updates.dueDate = updatedData.dueDate || undefined;
                if (updatedData.isCompleted !== undefined) updates.isCompleted = updatedData.isCompleted;
                if (updatedData.completedAt !== undefined) updates.completedAt = updatedData.completedAt || undefined;
                if (updatedData.projectId !== undefined) updates.projectId = updatedData.projectId ? updatedData.projectId as Id<"projects"> : undefined;
                if (updatedData.reminderAt !== undefined) updates.reminderAt = updatedData.reminderAt || undefined;
                if (updatedData.reminderEnabled !== undefined) updates.reminderEnabled = updatedData.reminderEnabled;
                if (updatedData.xp !== undefined) updates.rewardXp = updatedData.xp;

                await updateTaskMutation({
                    id: taskId as Id<"tasks">,
                    ...updates
                });

                // Handle Subtasks Sync
                if (updatedData.subtasks) {
                    const currentTask = tasks.find(t => t.id === taskId);
                    if (currentTask) {
                        const currentSubtasks = currentTask.subtasks;
                        const newSubtasks = updatedData.subtasks;

                        // 1. Identify subtasks to delete
                        const newSubtaskIds = new Set(newSubtasks.map(st => st.id));
                        const subtasksToDelete = currentSubtasks.filter(st => !newSubtaskIds.has(st.id));

                        for (const st of subtasksToDelete) {
                            await removeSubtaskMutation({ id: st.id as Id<"subtasks"> });
                        }

                        // 2. Identify subtasks to add
                        const currentSubtaskIds = new Set(currentSubtasks.map(st => st.id));
                        const subtasksToAdd = newSubtasks.filter(st => !currentSubtaskIds.has(st.id));

                        for (const st of subtasksToAdd) {
                            await addSubtaskMutation({
                                taskId: taskId as Id<"tasks">,
                                title: st.text,
                                isCompleted: st.isCompleted
                            });
                        }

                        // 3. Identify subtasks to update
                        const subtasksToUpdate = newSubtasks.filter(st => {
                            if (!currentSubtaskIds.has(st.id)) return false;
                            const current = currentSubtasks.find(c => c.id === st.id);
                            return current && (current.text !== st.text || current.isCompleted !== st.isCompleted);
                        });

                        for (const st of subtasksToUpdate) {
                            await updateSubtaskMutation({
                                id: st.id as Id<"subtasks">,
                                title: st.text,
                                isCompleted: st.isCompleted
                            });
                        }
                    }
                }
            } catch (error: any) {
                console.error("Mutation failed, falling back to local:", error);
                if (error.message?.includes("Unauthorized") || error.toString().includes("Unauthorized")) {
                    setForceLocal(true);
                    handleLocalUpdate();
                } else {
                    throw error;
                }
            }
        } else {
            handleLocalUpdate();
        }
    }, [updateTaskMutation, isAuthenticated, tasks, removeSubtaskMutation, addSubtaskMutation, updateSubtaskMutation]);

    const deleteTask = useCallback(async (taskId: string) => {
        if (isAuthenticated) {
            try {
                await deleteTaskMutation({ id: taskId as Id<"tasks"> });
            } catch (error: any) {
                console.error("Mutation failed, falling back to local:", error);
                if (error.message?.includes("Unauthorized") || error.toString().includes("Unauthorized")) {
                    setForceLocal(true);
                    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
                } else {
                    throw error;
                }
            }
        } else {
            setLocalTasks(prev => prev.filter(t => t.id !== taskId));
        }
    }, [deleteTaskMutation, isAuthenticated]);

    // OPTIMISTIC toggle task completion - instant UI update!
    const toggleTaskCompletion = useCallback(async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const isCompleted = !task.isCompleted;
        const completedAt = isCompleted ? new Date().toISOString() : undefined;

        // XP Logic
        let newXP = task.xp || 10;
        if (isCompleted) {
            const hasCompletedTaskToday = tasks.some(t =>
                t.id !== taskId &&
                t.isCompleted &&
                t.completedAt &&
                isToday(parseISO(t.completedAt))
            );
            const effectiveStreak = hasCompletedTaskToday ? streaks.current : streaks.current + 1;
            const multiplier = Math.min(1 + (effectiveStreak * 0.1), 5);
            newXP = Math.round(10 * multiplier);
        } else {
            newXP = 10;
        }

        // Update subtasks to match
        const updatedSubtasks = task.subtasks.map(st => ({ ...st, isCompleted }));

        // Store previous state for rollback
        const previousState = {
            isCompleted: task.isCompleted,
            completedAt: task.completedAt,
            xp: task.xp,
            subtasks: task.subtasks
        };

        if (isAuthenticated) {
            // 🚀 OPTIMISTIC UPDATE - Update UI immediately!
            applyOptimisticUpdate(taskId, {
                isCompleted,
                completedAt: completedAt || null,
                xp: newXP,
                subtasks: updatedSubtasks
            });

            // Sync to database in background
            try {
                await updateTaskMutation({
                    id: taskId as Id<"tasks">,
                    isCompleted,
                    completedAt,
                    rewardXp: newXP
                });

                // Also toggle subtasks
                if (task.subtasks.length > 0) {
                    await Promise.all(task.subtasks.map(st =>
                        updateSubtaskMutation({
                            id: st.id as Id<"subtasks">,
                            isCompleted
                        })
                    ));
                }

                // Clear optimistic update after successful sync (server data will take over)
                clearOptimisticUpdate(taskId);

                // 📊 Update challenge progress if task was completed
                if (isCompleted) {
                    try {
                        await updateChallengeProgressMutation({ type: "task", value: 1 });
                        // Also update XP progress
                        await updateChallengeProgressMutation({ type: "xp", value: newXP });
                    } catch (err) {
                        console.error("Failed to update challenge progress:", err);
                        // Don't fail the task completion if challenge update fails
                    }
                }
            } catch (error: any) {
                console.error("Mutation failed, rolling back:", error);

                // ⏪ ROLLBACK on failure
                if (error.message?.includes("Unauthorized") || error.toString().includes("Unauthorized")) {
                    setForceLocal(true);
                    // Apply update locally instead
                    clearOptimisticUpdate(taskId);
                    setLocalTasks(prev => prev.map(t => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                isCompleted,
                                completedAt: completedAt || null,
                                xp: newXP,
                                subtasks: updatedSubtasks
                            };
                        }
                        return t;
                    }));
                } else {
                    // Rollback immediately by clearing the optimistic update
                    clearOptimisticUpdate(taskId);
                    throw error;
                }
            }
        } else {
            // Local-only update
            setLocalTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    return {
                        ...t,
                        isCompleted,
                        completedAt: completedAt || null,
                        xp: newXP,
                        subtasks: updatedSubtasks
                    };
                }
                return t;
            }));
        }

    }, [tasks, streaks, updateTaskMutation, updateSubtaskMutation, isAuthenticated, applyOptimisticUpdate, clearOptimisticUpdate]);

    const addSubtask = useCallback(async (taskId: string, text: string) => {
        const handleLocalAddSubtask = () => {
            setLocalTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    const newSubtask: Subtask = { id: crypto.randomUUID(), text, isCompleted: false };
                    const updatedTask = { ...t, subtasks: [...t.subtasks, newSubtask] };
                    if (updatedTask.isCompleted) {
                        updatedTask.isCompleted = false;
                        updatedTask.completedAt = null;
                    }
                    return updatedTask;
                }
                return t;
            }));
        };

        if (isAuthenticated) {
            try {
                await addSubtaskMutation({
                    taskId: taskId as Id<"tasks">,
                    title: text,
                    isCompleted: false
                });

                const task = tasks.find(t => t.id === taskId);
                if (task?.isCompleted) {
                    await updateTaskMutation({
                        id: taskId as Id<"tasks">,
                        isCompleted: false,
                        completedAt: undefined
                    });
                }
            } catch (error: any) {
                console.error("Mutation failed, falling back to local:", error);
                if (error.message?.includes("Unauthorized") || error.toString().includes("Unauthorized")) {
                    setForceLocal(true);
                    handleLocalAddSubtask();
                } else {
                    throw error;
                }
            }
        } else {
            handleLocalAddSubtask();
        }
    }, [addSubtaskMutation, tasks, updateTaskMutation, isAuthenticated]);

    // OPTIMISTIC toggle subtask completion
    const toggleSubtaskCompletion = useCallback(async (taskId: string, subtaskId: string) => {
        const handleLocalToggleSubtask = () => {
            let result: 'subtask' | 'main' | 'none' = 'none';
            setLocalTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    const subtasks = t.subtasks.map(st =>
                        st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
                    );

                    const targetSubtask = subtasks.find(st => st.id === subtaskId);
                    const newIsCompleted = targetSubtask?.isCompleted;

                    let isCompleted = t.isCompleted;
                    let completedAt = t.completedAt;

                    const allCompleted = subtasks.every(st => st.isCompleted);

                    if (newIsCompleted && allCompleted && !isCompleted) {
                        isCompleted = true;
                        completedAt = new Date().toISOString();
                        result = 'main';
                    } else if (!newIsCompleted && isCompleted) {
                        isCompleted = false;
                        completedAt = null;
                        result = 'main';
                    } else {
                        result = 'subtask';
                    }

                    return { ...t, subtasks, isCompleted, completedAt };
                }
                return t;
            }));
            return result;
        };

        if (isAuthenticated) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return 'none';
            const subtask = task.subtasks.find(st => st.id === subtaskId);
            if (!subtask) return 'none';

            const newIsCompleted = !subtask.isCompleted;

            // Calculate what the result would be
            const updatedSubtasks = task.subtasks.map(st =>
                st.id === subtaskId ? { ...st, isCompleted: newIsCompleted } : st
            );
            const allCompleted = updatedSubtasks.every(st => st.isCompleted);

            let taskIsCompleted = task.isCompleted;
            let taskCompletedAt = task.completedAt;
            let result = 'subtask';

            if (newIsCompleted && allCompleted && !task.isCompleted) {
                taskIsCompleted = true;
                taskCompletedAt = new Date().toISOString();
                result = 'main';
            } else if (!newIsCompleted && task.isCompleted) {
                taskIsCompleted = false;
                taskCompletedAt = null;
                result = 'main';
            }

            // 🚀 OPTIMISTIC UPDATE
            applyOptimisticUpdate(taskId, {
                subtasks: updatedSubtasks,
                isCompleted: taskIsCompleted,
                completedAt: taskCompletedAt
            });

            try {
                await updateSubtaskMutation({
                    id: subtaskId as Id<"subtasks">,
                    isCompleted: newIsCompleted
                });

                // Update main task if needed
                if (taskIsCompleted !== task.isCompleted) {
                    await updateTaskMutation({
                        id: taskId as Id<"tasks">,
                        isCompleted: taskIsCompleted,
                        completedAt: taskIsCompleted ? taskCompletedAt || undefined : undefined
                    });
                }

                clearOptimisticUpdate(taskId);
                return result;
            } catch (error: any) {
                console.error("Mutation failed:", error);
                // Rollback
                clearOptimisticUpdate(taskId);
                if (error.message?.includes("Unauthorized") || error.toString().includes("Unauthorized")) {
                    setForceLocal(true);
                    return handleLocalToggleSubtask();
                }
                throw error;
            }
        } else {
            return handleLocalToggleSubtask();
        }
    }, [tasks, updateSubtaskMutation, updateTaskMutation, isAuthenticated, applyOptimisticUpdate, clearOptimisticUpdate]) as (taskId: string, subtaskId: string) => Promise<'subtask' | 'main' | 'none'>;

    const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
        if (isAuthenticated) {
            await addProjectMutation({
                name: projectData.name,
                description: projectData.description || "",
                color: projectData.color || "#6366f1",
                icon: projectData.icon || "📁",
                createdAt: new Date().toISOString()
            });
        } else {
            const newProject: Project = {
                id: crypto.randomUUID(),
                name: projectData.name,
                description: projectData.description,
                color: projectData.color || "#6366f1",
                icon: projectData.icon || "📁",
                createdAt: new Date().toISOString()
            };
            setLocalProjects(prev => [...prev, newProject]);
        }
    }, [addProjectMutation, isAuthenticated]);

    const updateProject = useCallback(async (projectId: string, data: Partial<Project>) => {
        if (isAuthenticated) {
            await updateProjectMutation({
                id: projectId as Id<"projects">,
                name: data.name,
                description: data.description || undefined,
                color: data.color,
                icon: data.icon
            });
        } else {
            setLocalProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, ...data } : p
            ));
        }
    }, [updateProjectMutation, isAuthenticated]);

    const deleteProject = useCallback(async (projectId: string) => {
        if (isAuthenticated) {
            await deleteProjectMutation({ id: projectId as Id<"projects"> });
        } else {
            setLocalProjects(prev => prev.filter(p => p.id !== projectId));
        }
    }, [deleteProjectMutation, isAuthenticated]);

    // sortedTasks
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            if (a.isCompleted && !b.isCompleted) return 1;
            if (!a.isCompleted && b.isCompleted) return -1;

            if (!a.isCompleted && !b.isCompleted) {
                if (a.dueDate && b.dueDate) return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
                if (a.dueDate) return -1;
                if (b.dueDate) return 1;
                return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
            }

            if (a.completedAt && b.completedAt) {
                return parseISO(b.completedAt).getTime() - parseISO(a.completedAt).getTime();
            }

            return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
        });
    }, [tasks]);

    return {
        tasks: sortedTasks,
        projects,
        stats,
        streaks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        addSubtask,
        toggleSubtaskCompletion,
        addProject,
        updateProject,
        deleteProject,
        // isInitialLoad is false if we have cached data (localStorage-first approach)
        isInitialLoad: isAuthenticated ? (rawTasks === undefined && cachedTasks === null && !initialTasks) : !isLocalLoaded,
        reloadFromSupabase: async () => { },
    };
};
