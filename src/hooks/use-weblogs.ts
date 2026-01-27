"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type Weblog = {
    _id: Id<"weblogs"> | string;
    _creationTime: number;
    userId?: Id<"users"> | string;
    title: string;
    content: string;
    emoji?: string;
    color?: string;
    isPinned?: boolean;
    category?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
};

// Local weblog type for localStorage (uses string IDs)
type LocalWeblog = Omit<Weblog, '_id' | 'userId'> & {
    _id: string;
    userId?: string;
};

export function useWeblogs() {
    const { isAuthenticated: _realIsAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const [forceLocal, setForceLocal] = useState(false);
    
    const isAuthenticated = _realIsAuthenticated && !forceLocal;

    // Convex queries and mutations - use "skip" to conditionally skip queries
    const rawWeblogs = useQuery(api.weblogs.list, isAuthenticated ? {} : "skip");
    const rawAllTags = useQuery(api.weblogs.getAllTags, isAuthenticated ? {} : "skip");

    const createWeblogMutation = useMutation(api.weblogs.create);
    const updateWeblogMutation = useMutation(api.weblogs.update);
    const deleteWeblogMutation = useMutation(api.weblogs.deleteWeblog);
    const togglePinMutation = useMutation(api.weblogs.togglePin);

    // Local State (for unauthenticated users)
    const [localWeblogs, setLocalWeblogs] = useState<LocalWeblog[]>([]);
    const [isLocalLoaded, setIsLocalLoaded] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        if (!isAuthenticated && !isAuthLoading && !isLocalLoaded) {
            try {
                const storedWeblogs = localStorage.getItem('pollytasks_weblogs');
                if (storedWeblogs) {
                    setLocalWeblogs(JSON.parse(storedWeblogs));
                }
            } catch (e) {
                console.error("Failed to load local weblogs", e);
            } finally {
                setIsLocalLoaded(true);
            }
        }
    }, [isAuthenticated, isAuthLoading, isLocalLoaded]);

    // Save to LocalStorage
    useEffect(() => {
        if (!isAuthenticated && !isAuthLoading && isLocalLoaded) {
            localStorage.setItem('pollytasks_weblogs', JSON.stringify(localWeblogs));
        }
    }, [localWeblogs, isAuthenticated, isAuthLoading, isLocalLoaded]);

    // Map data to consistent format
    const weblogs: Weblog[] = useMemo(() => {
        if (isAuthenticated) {
            return rawWeblogs || [];
        } else {
            return localWeblogs as Weblog[];
        }
    }, [rawWeblogs, isAuthenticated, localWeblogs]);

    // Get all unique tags
    const allTags: string[] = useMemo(() => {
        if (isAuthenticated) {
            return rawAllTags || [];
        } else {
            const tagSet = new Set<string>();
            localWeblogs.forEach(w => {
                w.tags?.forEach(t => tagSet.add(t));
            });
            return Array.from(tagSet).sort();
        }
    }, [rawAllTags, isAuthenticated, localWeblogs]);

    const addWeblog = useCallback(async (weblogData: {
        title: string;
        content: string;
        emoji?: string;
        category?: string;
        color?: string;
        isPinned?: boolean;
        tags?: string[];
    }) => {
        if (isAuthenticated) {
            return await createWeblogMutation(weblogData);
        } else {
            const now = new Date().toISOString();
            const newWeblog: LocalWeblog = {
                _id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                _creationTime: Date.now(),
                title: weblogData.title,
                content: weblogData.content,
                emoji: weblogData.emoji || "📝",
                category: weblogData.category || "personal",
                color: weblogData.color,
                isPinned: weblogData.isPinned || false,
                tags: weblogData.tags || [],
                createdAt: now,
                updatedAt: now,
            };
            setLocalWeblogs(prev => [newWeblog, ...prev]);
            return newWeblog._id;
        }
    }, [isAuthenticated, createWeblogMutation]);

    const updateWeblog = useCallback(async (id: Id<"weblogs"> | string, updates: Partial<Weblog>) => {
        if (isAuthenticated) {
            // @ts-ignore - Convex types can be strict with ID fields
            return await updateWeblogMutation({ id, ...updates });
        } else {
            setLocalWeblogs(prev => prev.map(w => {
                if (w._id === id) {
                    return {
                        ...w,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return w;
            }));
        }
    }, [isAuthenticated, updateWeblogMutation]);

    const deleteWeblog = useCallback(async (id: Id<"weblogs"> | string) => {
        if (isAuthenticated) {
            return await deleteWeblogMutation({ id: id as Id<"weblogs"> });
        } else {
            setLocalWeblogs(prev => prev.filter(w => w._id !== id));
        }
    }, [isAuthenticated, deleteWeblogMutation]);

    const togglePin = useCallback(async (id: Id<"weblogs"> | string) => {
        if (isAuthenticated) {
            return await togglePinMutation({ id: id as Id<"weblogs"> });
        } else {
            setLocalWeblogs(prev => prev.map(w => {
                if (w._id === id) {
                    return { ...w, isPinned: !w.isPinned };
                }
                return w;
            }));
        }
    }, [isAuthenticated, togglePinMutation]);

    return {
        weblogs,
        allTags,
        addWeblog,
        updateWeblog,
        deleteWeblog,
        togglePin,
        isLoading: isAuthLoading || (isAuthenticated && rawWeblogs === undefined),
    };
}
