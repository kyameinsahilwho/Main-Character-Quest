"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useEffect, useState, useMemo } from "react";

// Storage keys for social data caching
const SOCIAL_CACHE_KEYS = {
    friends: 'pollytasks_social_friends',
    notifications: 'pollytasks_social_notifications',
    leaderboard: 'pollytasks_social_leaderboard',
    challenges: 'pollytasks_social_challenges',
    activity: 'pollytasks_social_activity',
};

// Cache expiry in milliseconds (5 minutes for social data)
const CACHE_EXPIRY = 5 * 60 * 1000;

interface CachedData<T> {
    data: T;
    timestamp: number;
}

function getCachedData<T>(key: string): T | null {
    try {
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
        const cached: CachedData<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
        console.error("Failed to cache social data:", e);
    }
}

export function useSocial() {
    // Cached initial state
    const [cachedFriends] = useState(() => getCachedData<any[]>(SOCIAL_CACHE_KEYS.friends));
    const [cachedNotifications] = useState(() => getCachedData<any[]>(SOCIAL_CACHE_KEYS.notifications));

    // Queries
    const friendsQuery = useQuery(api.social.getFriends);
    const pendingInvites = useQuery(api.social.getPendingInvites) ?? [];
    const sentInvites = useQuery(api.social.getSentInvites) ?? [];
    const cheersReceived = useQuery(api.social.getCheersReceived, { limit: 20 }) ?? [];
    const notificationsQuery = useQuery(api.social.getSocialNotifications, { limit: 50 });
    const unreadCount = useQuery(api.social.getUnreadNotificationCount) ?? 0;

    // Use cached data while loading, then switch to fresh data
    const friends = useMemo(() => {
        if (friendsQuery !== undefined) {
            return friendsQuery;
        }
        return cachedFriends ?? [];
    }, [friendsQuery, cachedFriends]);

    const notifications = useMemo(() => {
        if (notificationsQuery !== undefined) {
            return notificationsQuery;
        }
        return cachedNotifications ?? [];
    }, [notificationsQuery, cachedNotifications]);

    // Cache fresh data when received
    useEffect(() => {
        if (friendsQuery !== undefined && friendsQuery.length > 0) {
            setCachedData(SOCIAL_CACHE_KEYS.friends, friendsQuery);
        }
    }, [friendsQuery]);

    useEffect(() => {
        if (notificationsQuery !== undefined && notificationsQuery.length > 0) {
            setCachedData(SOCIAL_CACHE_KEYS.notifications, notificationsQuery);
        }
    }, [notificationsQuery]);

    // Optimistic state for notifications
    const [optimisticNotificationsSeen, setOptimisticNotificationsSeen] = useState<Set<string>>(new Set());

    // Apply optimistic seen status to notifications
    const optimisticNotifications = useMemo(() => {
        return notifications.map((n: any) => ({
            ...n,
            seen: n.seen || optimisticNotificationsSeen.has(n._id)
        }));
    }, [notifications, optimisticNotificationsSeen]);

    const optimisticUnreadCount = useMemo(() => {
        const actualUnread = notifications.filter((n: any) => !n.seen && !optimisticNotificationsSeen.has(n._id)).length;
        return Math.max(0, actualUnread);
    }, [notifications, optimisticNotificationsSeen]);

    // Mutations
    const sendInviteMutation = useMutation(api.social.sendFriendInvite);
    const acceptInviteMutation = useMutation(api.social.acceptFriendInvite);
    const declineInviteMutation = useMutation(api.social.declineFriendInvite);
    const acceptByCodeMutation = useMutation(api.social.acceptInviteByCode);
    const removeFriendMutation = useMutation(api.social.removeFriend);
    const sendCheerMutation = useMutation(api.social.sendCheer);
    const markCheersSeenMutation = useMutation(api.social.markCheersAsSeen);
    const markNotificationsSeenMutation = useMutation(api.social.markNotificationsAsSeen);

    // Actions
    const sendFriendInvite = useCallback(async (email: string) => {
        return await sendInviteMutation({ toEmail: email });
    }, [sendInviteMutation]);

    const acceptFriendInvite = useCallback(async (inviteId: Id<"friendInvites">) => {
        return await acceptInviteMutation({ inviteId });
    }, [acceptInviteMutation]);

    const declineFriendInvite = useCallback(async (inviteId: Id<"friendInvites">) => {
        return await declineInviteMutation({ inviteId });
    }, [declineInviteMutation]);

    const acceptInviteByCode = useCallback(async (code: string) => {
        return await acceptByCodeMutation({ inviteCode: code });
    }, [acceptByCodeMutation]);

    const removeFriend = useCallback(async (friendId: Id<"users">) => {
        return await removeFriendMutation({ friendId });
    }, [removeFriendMutation]);

    const sendCheer = useCallback(async (
        toUserId: Id<"users">,
        type: string,
        message?: string,
        milestoneId?: Id<"milestones">
    ) => {
        return await sendCheerMutation({ toUserId, type, message, milestoneId });
    }, [sendCheerMutation]);

    const markCheersAsSeen = useCallback(async () => {
        return await markCheersSeenMutation({});
    }, [markCheersSeenMutation]);

    // Optimistic mark notifications as seen
    const markNotificationsAsSeen = useCallback(async (ids?: Id<"socialNotifications">[]) => {
        // 🚀 OPTIMISTIC UPDATE - mark as seen immediately
        if (ids) {
            setOptimisticNotificationsSeen(prev => {
                const next = new Set(prev);
                ids.forEach(id => next.add(id));
                return next;
            });
        } else {
            // Mark all as seen
            setOptimisticNotificationsSeen(prev => {
                const next = new Set(prev);
                notifications.forEach((n: any) => next.add(n._id));
                return next;
            });
        }

        try {
            await markNotificationsSeenMutation({ notificationIds: ids });
            // Clear optimistic state once server confirms
            if (ids) {
                setOptimisticNotificationsSeen(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
            } else {
                setOptimisticNotificationsSeen(new Set());
            }
        } catch (error) {
            console.error("Failed to mark notifications as seen:", error);
            // Rollback on failure
            if (ids) {
                setOptimisticNotificationsSeen(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
            }
            throw error;
        }
    }, [markNotificationsSeenMutation, notifications]);

    return {
        // Data (with caching and optimistic updates)
        friends,
        pendingInvites,
        sentInvites,
        cheersReceived,
        notifications: optimisticNotifications,
        unreadCount: optimisticUnreadCount,

        // Loading states
        isLoadingFriends: friendsQuery === undefined && cachedFriends === null,
        isLoadingNotifications: notificationsQuery === undefined && cachedNotifications === null,

        // Actions
        sendFriendInvite,
        acceptFriendInvite,
        declineFriendInvite,
        acceptInviteByCode,
        removeFriend,
        sendCheer,
        markCheersAsSeen,
        markNotificationsAsSeen,
    };
}

export function useChallenges() {
    // Cached initial state
    const [cachedChallenges] = useState(() => getCachedData<any[]>(SOCIAL_CACHE_KEYS.challenges));
    const [cachedLeaderboard] = useState(() => getCachedData<any[]>(SOCIAL_CACHE_KEYS.leaderboard));
    const [cachedActivity] = useState(() => getCachedData<any[]>(SOCIAL_CACHE_KEYS.activity));

    // Queries
    const challengesQuery = useQuery(api.challenges.getActiveChallenges);
    const pendingInvites = useQuery(api.challenges.getPendingChallengeInvites) ?? [];
    const leaderboardQuery = useQuery(api.challenges.getFriendsLeaderboard, { type: "xp" });
    const friendsMilestones = useQuery(api.challenges.getFriendsMilestones, { limit: 20 }) ?? [];
    const activityQuery = useQuery(api.challenges.getFriendsActivity);

    // Use cached data while loading
    const activeChallenges = useMemo(() => {
        if (challengesQuery !== undefined) return challengesQuery;
        return cachedChallenges ?? [];
    }, [challengesQuery, cachedChallenges]);

    const friendsLeaderboard = useMemo(() => {
        if (leaderboardQuery !== undefined) return leaderboardQuery;
        return cachedLeaderboard ?? [];
    }, [leaderboardQuery, cachedLeaderboard]);

    const friendsActivity = useMemo(() => {
        if (activityQuery !== undefined) return activityQuery;
        return cachedActivity ?? [];
    }, [activityQuery, cachedActivity]);

    // Cache fresh data when received
    useEffect(() => {
        if (challengesQuery !== undefined && challengesQuery.length > 0) {
            setCachedData(SOCIAL_CACHE_KEYS.challenges, challengesQuery);
        }
    }, [challengesQuery]);

    useEffect(() => {
        if (leaderboardQuery !== undefined && leaderboardQuery.length > 0) {
            setCachedData(SOCIAL_CACHE_KEYS.leaderboard, leaderboardQuery);
        }
    }, [leaderboardQuery]);

    useEffect(() => {
        if (activityQuery !== undefined && activityQuery.length > 0) {
            setCachedData(SOCIAL_CACHE_KEYS.activity, activityQuery);
        }
    }, [activityQuery]);

    // Optimistic state for milestone celebrations
    const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());

    const optimisticMilestones = useMemo(() => {
        return friendsMilestones.map((m: any) => ({
            ...m,
            hasCelebrated: m.hasCelebrated || celebratedMilestones.has(m._id)
        }));
    }, [friendsMilestones, celebratedMilestones]);

    // Mutations
    const createChallengeMutation = useMutation(api.challenges.createChallenge);
    const respondMutation = useMutation(api.challenges.respondToChallenge);
    const leaveMutation = useMutation(api.challenges.leaveChallenge);
    const celebrateMutation = useMutation(api.challenges.celebrateMilestone);
    const createMilestoneMutation = useMutation(api.challenges.createMilestone);
    const recordActivityMutation = useMutation(api.challenges.recordDailyActivity);

    // Actions
    const createChallenge = useCallback(async (data: {
        title: string;
        description?: string;
        type: string;
        targetValue: number;
        durationDays: number;
        invitedFriendIds: Id<"users">[];
        visibility?: string;
    }) => {
        return await createChallengeMutation(data);
    }, [createChallengeMutation]);

    const respondToChallenge = useCallback(async (challengeId: Id<"challenges">, accept: boolean) => {
        return await respondMutation({ challengeId, accept });
    }, [respondMutation]);

    const leaveChallenge = useCallback(async (challengeId: Id<"challenges">) => {
        return await leaveMutation({ challengeId });
    }, [leaveMutation]);

    // Optimistic celebrate milestone
    const celebrateMilestone = useCallback(async (milestoneId: Id<"milestones">) => {
        // 🚀 OPTIMISTIC UPDATE
        setCelebratedMilestones(prev => new Set(prev).add(milestoneId));

        try {
            await celebrateMutation({ milestoneId });
            // Keep optimistic state as it matches server now
        } catch (error) {
            console.error("Failed to celebrate milestone:", error);
            // Rollback
            setCelebratedMilestones(prev => {
                const next = new Set(prev);
                next.delete(milestoneId);
                return next;
            });
            throw error;
        }
    }, [celebrateMutation]);

    const createMilestone = useCallback(async (type: string, value: number, isPublic?: boolean) => {
        return await createMilestoneMutation({ type, value, isPublic });
    }, [createMilestoneMutation]);

    const recordDailyActivity = useCallback(async (data: {
        tasksCompleted: number;
        habitsCompleted: number;
        xpEarned: number;
        streakMaintained: boolean;
    }) => {
        return await recordActivityMutation(data);
    }, [recordActivityMutation]);

    return {
        // Data (with caching and optimistic updates)
        activeChallenges,
        pendingInvites,
        friendsLeaderboard,
        friendsMilestones: optimisticMilestones,
        friendsActivity,

        // Loading states
        isLoadingChallenges: challengesQuery === undefined && cachedChallenges === null,
        isLoadingLeaderboard: leaderboardQuery === undefined && cachedLeaderboard === null,

        // Actions
        createChallenge,
        respondToChallenge,
        leaveChallenge,
        celebrateMilestone,
        createMilestone,
        recordDailyActivity,
    };
}
