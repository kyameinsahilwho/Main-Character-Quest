import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./utils";

// Challenge types
const CHALLENGE_TYPES = {
    streak: "Maintain a daily streak",
    tasks_count: "Complete a number of tasks",
    habits_count: "Complete habit check-ins",
    xp_earned: "Earn XP points",
} as const;

// ==================== CREATE & MANAGE CHALLENGES ====================

export const createChallenge = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        type: v.string(), // 'streak', 'tasks_count', 'habits_count', 'xp_earned'
        targetValue: v.number(),
        durationDays: v.number(),
        invitedFriendIds: v.array(v.id("users")),
        visibility: v.optional(v.string()), // 'private' or 'friends'
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthenticated");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const now = new Date();
        const startDate = now.toISOString();
        const endDate = new Date(now.getTime() + args.durationDays * 24 * 60 * 60 * 1000).toISOString();

        // Create challenge
        const challengeId = await ctx.db.insert("challenges", {
            creatorId: userId,
            title: args.title,
            description: args.description,
            type: args.type,
            targetValue: args.targetValue,
            startDate,
            endDate,
            status: "active",
            visibility: args.visibility || "private",
            createdAt: startDate,
        });

        // Add creator as participant
        await ctx.db.insert("challengeParticipants", {
            challengeId,
            userId,
            status: "accepted",
            progress: 0,
            joinedAt: startDate,
        });

        // Invite friends
        for (const friendId of args.invitedFriendIds) {
            // Verify friendship
            const friendship = await ctx.db
                .query("friendships")
                .withIndex("by_user_and_friend", (q) =>
                    q.eq("userId", userId).eq("friendId", friendId)
                )
                .first();

            if (!friendship) continue;

            // Create participant record as invited
            await ctx.db.insert("challengeParticipants", {
                challengeId,
                userId: friendId,
                status: "invited",
                progress: 0,
            });

            // Notify friend
            await ctx.db.insert("socialNotifications", {
                userId: friendId,
                type: "challenge_invite",
                fromUserId: userId,
                referenceId: challengeId,
                referenceType: "challenge",
                message: `${user.name || 'A friend'} invited you to "${args.title}" challenge!`,
                seen: false,
                createdAt: startDate,
            });
        }

        return { challengeId };
    },
});

export const respondToChallenge = mutation({
    args: {
        challengeId: v.id("challenges"),
        accept: v.boolean(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthenticated");

        const participant = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_challenge_and_user", (q) =>
                q.eq("challengeId", args.challengeId).eq("userId", userId)
            )
            .first();

        if (!participant) {
            throw new Error("You are not invited to this challenge");
        }

        if (participant.status !== "invited") {
            throw new Error("You have already responded to this challenge");
        }

        const now = new Date().toISOString();

        await ctx.db.patch(participant._id, {
            status: args.accept ? "accepted" : "declined",
            joinedAt: args.accept ? now : undefined,
        });

        // Notify challenge creator
        const challenge = await ctx.db.get(args.challengeId);
        const user = await ctx.db.get(userId);

        if (challenge && args.accept) {
            await ctx.db.insert("socialNotifications", {
                userId: challenge.creatorId,
                type: "challenge_update",
                fromUserId: userId,
                referenceId: args.challengeId,
                referenceType: "challenge",
                message: `${user?.name || 'A friend'} joined your "${challenge.title}" challenge!`,
                seen: false,
                createdAt: now,
            });
        }

        return { success: true };
    },
});

// Update challenge progress (called when tasks/habits are completed)
export const updateChallengeProgress = mutation({
    args: {
        type: v.string(), // What was completed: 'task', 'habit', 'streak'
        value: v.number(), // How much progress to add
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) return;

        const now = new Date().toISOString();

        // Find active challenges for this user
        const participations = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();

        for (const participation of participations) {
            const challenge = await ctx.db.get(participation.challengeId);
            if (!challenge || challenge.status !== "active") continue;

            // Check if challenge is still within timeframe
            if (new Date(challenge.endDate) < new Date()) {
                continue;
            }

            // Check if this progress type matches the challenge
            let shouldUpdate = false;
            if (challenge.type === "tasks_count" && args.type === "task") {
                shouldUpdate = true;
            } else if (challenge.type === "habits_count" && args.type === "habit") {
                shouldUpdate = true;
            } else if (challenge.type === "streak" && args.type === "streak") {
                shouldUpdate = true;
            } else if (challenge.type === "xp_earned" && args.type === "xp") {
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                const newProgress = participation.progress + args.value;
                const updates: any = { progress: newProgress };

                // Check if completed
                if (newProgress >= challenge.targetValue && participation.status !== "completed") {
                    updates.status = "completed";
                    updates.completedAt = now;

                    // Notify about completion
                    const user = await ctx.db.get(userId);

                    // Get all participants to notify
                    const allParticipants = await ctx.db
                        .query("challengeParticipants")
                        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
                        .filter((q) => q.neq(q.field("userId"), userId))
                        .collect();

                    for (const p of allParticipants) {
                        await ctx.db.insert("socialNotifications", {
                            userId: p.userId,
                            type: "challenge_update",
                            fromUserId: userId,
                            referenceId: challenge._id,
                            referenceType: "challenge",
                            message: `${user?.name || 'A friend'} completed the "${challenge.title}" challenge! 🎉`,
                            seen: false,
                            createdAt: now,
                        });
                    }
                }

                await ctx.db.patch(participation._id, updates);
            }
        }
    },
});

// ==================== QUERY CHALLENGES ====================

export const getActiveChallenges = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const participations = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const challenges = await Promise.all(
            participations.map(async (p) => {
                const challenge = await ctx.db.get(p.challengeId);
                if (!challenge) return null;

                // Get all participants
                const allParticipants = await ctx.db
                    .query("challengeParticipants")
                    .withIndex("by_challenge", (q) => q.eq("challengeId", p.challengeId))
                    .collect();

                const participantDetails = await Promise.all(
                    allParticipants.map(async (participant) => {
                        const user = await ctx.db.get(participant.userId);
                        return {
                            id: participant._id,
                            oderId: participant.userId,
                            name: user?.name || "Unknown",
                            image: user?.image,
                            status: participant.status,
                            progress: participant.progress,
                            progressPercent: Math.min(100, (participant.progress / challenge.targetValue) * 100),
                            isMe: participant.userId === userId,
                        };
                    })
                );

                // Sort by progress
                participantDetails.sort((a, b) => b.progress - a.progress);

                return {
                    id: challenge._id,
                    title: challenge.title,
                    description: challenge.description,
                    type: challenge.type,
                    targetValue: challenge.targetValue,
                    startDate: challenge.startDate,
                    endDate: challenge.endDate,
                    status: challenge.status,
                    myStatus: p.status,
                    myProgress: p.progress,
                    myProgressPercent: Math.min(100, (p.progress / challenge.targetValue) * 100),
                    participants: participantDetails,
                    daysRemaining: Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
                    isCreator: challenge.creatorId === userId,
                };
            })
        );

        return challenges.filter(Boolean);
    },
});

export const getPendingChallengeInvites = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const invites = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "invited"))
            .collect();

        const challenges = await Promise.all(
            invites.map(async (invite) => {
                const challenge = await ctx.db.get(invite.challengeId);
                if (!challenge) return null;

                const creator = await ctx.db.get(challenge.creatorId);

                return {
                    participantId: invite._id,
                    challenge: {
                        id: challenge._id,
                        title: challenge.title,
                        description: challenge.description,
                        type: challenge.type,
                        targetValue: challenge.targetValue,
                        durationDays: Math.ceil((new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)),
                    },
                    creator: creator ? {
                        name: creator.name,
                        image: creator.image,
                    } : null,
                };
            })
        );

        return challenges.filter(Boolean);
    },
});

// Cancel/leave a challenge
export const leaveChallenge = mutation({
    args: {
        challengeId: v.id("challenges"),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthenticated");

        const participation = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_challenge_and_user", (q) =>
                q.eq("challengeId", args.challengeId).eq("userId", userId)
            )
            .first();

        if (participation) {
            await ctx.db.delete(participation._id);
        }

        // If creator and no other participants, cancel challenge
        const challenge = await ctx.db.get(args.challengeId);
        if (challenge && challenge.creatorId === userId) {
            const otherParticipants = await ctx.db
                .query("challengeParticipants")
                .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
                .first();

            if (!otherParticipants) {
                await ctx.db.patch(args.challengeId, { status: "cancelled" });
            }
        }

        return { success: true };
    },
});

// ==================== MILESTONES ====================

// Milestone thresholds for automatic creation
const MILESTONE_THRESHOLDS = {
    tasks_completed: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    streak_achieved: [7, 14, 30, 60, 100, 200, 365],
    habit_streak: [7, 14, 30, 60, 100],
    level_up: [5, 10, 15, 20, 25, 30, 40, 50, 75, 100],
};

export const createMilestone = mutation({
    args: {
        type: v.string(),
        value: v.number(),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthenticated");

        // Check for duplicate milestone (same type and value)
        const existingMilestones = await ctx.db
            .query("milestones")
            .withIndex("by_user_and_type", (q) =>
                q.eq("userId", userId).eq("type", args.type)
            )
            .collect();

        const isDuplicate = existingMilestones.some(m => m.value === args.value);
        if (isDuplicate) {
            // Already have this milestone, skip creation
            return { milestoneId: null, duplicate: true };
        }

        const now = new Date().toISOString();

        const milestoneId = await ctx.db.insert("milestones", {
            userId,
            type: args.type,
            value: args.value,
            achievedAt: now,
            isPublic: args.isPublic ?? true,
            celebratedBy: [],
        });

        // Notify friends if public
        if (args.isPublic !== false) {
            const user = await ctx.db.get(userId);
            const friendships = await ctx.db
                .query("friendships")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();

            const milestoneMessages: Record<string, string> = {
                tasks_completed: `completed ${args.value} quests`,
                streak_achieved: `reached a ${args.value}-day streak`,
                level_up: `leveled up to Level ${args.value}`,
                habit_streak: `hit a ${args.value}-day habit streak`,
                weekly_goal: `crushed their weekly goal`,
            };

            const message = milestoneMessages[args.type] || `achieved a milestone`;

            for (const friendship of friendships) {
                await ctx.db.insert("socialNotifications", {
                    userId: friendship.friendId,
                    type: "milestone_friend",
                    fromUserId: userId,
                    referenceId: milestoneId,
                    referenceType: "milestone",
                    message: `${user?.name || 'A friend'} ${message}! 🎉`,
                    seen: false,
                    createdAt: now,
                });
            }
        }

        return { milestoneId, duplicate: false };
    },
});

// Auto-check and create milestones based on user stats
export const autoCheckMilestones = mutation({
    args: {
        tasksCompleted: v.optional(v.number()),
        currentStreak: v.optional(v.number()),
        level: v.optional(v.number()),
        habitStreak: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) return { created: [] };

        const createdMilestones: string[] = [];
        const now = new Date().toISOString();

        // Helper to check and create a milestone
        const checkAndCreate = async (type: string, value: number) => {
            const thresholds = MILESTONE_THRESHOLDS[type as keyof typeof MILESTONE_THRESHOLDS] || [];

            // Find achieved thresholds
            const achievedThresholds = thresholds.filter(t => value >= t);

            if (achievedThresholds.length === 0) return;

            // Get existing milestones of this type
            const existing = await ctx.db
                .query("milestones")
                .withIndex("by_user_and_type", (q) =>
                    q.eq("userId", userId).eq("type", type)
                )
                .collect();

            const existingValues = new Set(existing.map(m => m.value));

            // Find new milestones to create
            for (const threshold of achievedThresholds) {
                if (!existingValues.has(threshold)) {
                    // Create new milestone
                    const milestoneId = await ctx.db.insert("milestones", {
                        userId,
                        type,
                        value: threshold,
                        achievedAt: now,
                        isPublic: true,
                        celebratedBy: [],
                    });

                    createdMilestones.push(`${type}:${threshold}`);

                    // Notify friends
                    const user = await ctx.db.get(userId);
                    const friendships = await ctx.db
                        .query("friendships")
                        .withIndex("by_user", (q) => q.eq("userId", userId))
                        .collect();

                    const milestoneMessages: Record<string, string> = {
                        tasks_completed: `completed ${threshold} quests`,
                        streak_achieved: `reached a ${threshold}-day streak`,
                        level_up: `leveled up to Level ${threshold}`,
                        habit_streak: `hit a ${threshold}-day habit streak`,
                    };

                    const message = milestoneMessages[type] || `achieved a milestone`;

                    for (const friendship of friendships) {
                        await ctx.db.insert("socialNotifications", {
                            userId: friendship.friendId,
                            type: "milestone_friend",
                            fromUserId: userId,
                            referenceId: milestoneId,
                            referenceType: "milestone",
                            message: `${user?.name || 'A friend'} ${message}! 🎉`,
                            seen: false,
                            createdAt: now,
                        });
                    }
                }
            }
        };

        // Check each type of milestone
        if (args.tasksCompleted !== undefined) {
            await checkAndCreate("tasks_completed", args.tasksCompleted);
        }
        if (args.currentStreak !== undefined) {
            await checkAndCreate("streak_achieved", args.currentStreak);
        }
        if (args.level !== undefined) {
            await checkAndCreate("level_up", args.level);
        }
        if (args.habitStreak !== undefined) {
            await checkAndCreate("habit_streak", args.habitStreak);
        }

        return { created: createdMilestones };
    },
});

export const getFriendsMilestones = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        // Get friends
        const friendships = await ctx.db
            .query("friendships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const friendIds = friendships.map((f) => f.friendId);

        // Get recent milestones from friends
        const allMilestones = [];

        for (const friendId of friendIds) {
            const milestones = await ctx.db
                .query("milestones")
                .withIndex("by_user", (q) => q.eq("userId", friendId))
                .filter((q) => q.eq(q.field("isPublic"), true))
                .order("desc")
                .take(5);

            for (const m of milestones) {
                const user = await ctx.db.get(friendId);
                allMilestones.push({
                    ...m,
                    user: user ? {
                        id: user._id,
                        name: user.name,
                        image: user.image,
                    } : null,
                    hasCelebrated: m.celebratedBy?.includes(userId),
                });
            }
        }

        // Sort by date and limit
        allMilestones.sort((a, b) =>
            new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
        );

        return allMilestones.slice(0, args.limit || 20);
    },
});

export const celebrateMilestone = mutation({
    args: {
        milestoneId: v.id("milestones"),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthenticated");

        const milestone = await ctx.db.get(args.milestoneId);
        if (!milestone) throw new Error("Milestone not found");

        const celebratedBy = milestone.celebratedBy || [];
        if (!celebratedBy.includes(userId)) {
            celebratedBy.push(userId);
            await ctx.db.patch(args.milestoneId, { celebratedBy });

            // Send cheer notification
            const user = await ctx.db.get(userId);
            await ctx.db.insert("socialNotifications", {
                userId: milestone.userId,
                type: "cheer_received",
                fromUserId: userId,
                referenceId: args.milestoneId,
                referenceType: "milestone",
                message: `${user?.name || 'A friend'} celebrated your milestone! 🎉`,
                seen: false,
                createdAt: new Date().toISOString(),
            });
        }

        return { success: true };
    },
});

// ==================== ACTIVITY SNAPSHOTS ====================

export const recordDailyActivity = mutation({
    args: {
        tasksCompleted: v.number(),
        habitsCompleted: v.number(),
        xpEarned: v.number(),
        streakMaintained: v.boolean(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthenticated");

        const today = new Date().toISOString().split("T")[0];

        // Check if snapshot exists for today
        const existing = await ctx.db
            .query("activitySnapshots")
            .withIndex("by_user_and_date", (q) =>
                q.eq("userId", userId).eq("date", today)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                tasksCompleted: args.tasksCompleted,
                habitsCompleted: args.habitsCompleted,
                xpEarned: args.xpEarned,
                streakMaintained: args.streakMaintained,
            });
        } else {
            await ctx.db.insert("activitySnapshots", {
                userId,
                date: today,
                ...args,
            });
        }

        return { success: true };
    },
});

export const getFriendsActivity = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const friendships = await ctx.db
            .query("friendships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const today = new Date().toISOString().split("T")[0];

        const activities = await Promise.all(
            friendships.map(async (f) => {
                const friend = await ctx.db.get(f.friendId);
                if (!friend) return null;

                const activity = await ctx.db
                    .query("activitySnapshots")
                    .withIndex("by_user_and_date", (q) =>
                        q.eq("userId", f.friendId).eq("date", today)
                    )
                    .first();

                return {
                    friend: {
                        id: friend._id,
                        name: friend.name,
                        image: friend.image,
                        level: friend.level || 1,
                        streak: friend.currentStreak || 0,
                    },
                    activity: activity ? {
                        tasksCompleted: activity.tasksCompleted,
                        habitsCompleted: activity.habitsCompleted,
                        xpEarned: activity.xpEarned,
                        streakMaintained: activity.streakMaintained,
                    } : null,
                };
            })
        );

        return activities.filter(Boolean);
    },
});

// ==================== LEADERBOARD ====================

export const getFriendsLeaderboard = query({
    args: {
        type: v.optional(v.string()), // 'xp', 'streak', 'level', 'tasks'
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (!user) return [];

        // Get friends
        const friendships = await ctx.db
            .query("friendships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const leaderboard = [{
            id: userId,
            name: user.name || "You",
            image: user.image,
            level: user.level || 1,
            totalXP: user.totalXP || 0,
            currentStreak: user.currentStreak || 0,
            tasksCompleted: user.tasksCompleted || 0,
            isMe: true,
        }];

        for (const f of friendships) {
            const friend = await ctx.db.get(f.friendId);
            if (friend) {
                leaderboard.push({
                    id: friend._id,
                    name: friend.name || "Friend",
                    image: friend.image,
                    level: friend.level || 1,
                    totalXP: friend.totalXP || 0,
                    currentStreak: friend.currentStreak || 0,
                    tasksCompleted: friend.tasksCompleted || 0,
                    isMe: false,
                });
            }
        }

        // Sort by requested type
        const sortType = args.type || "xp";
        leaderboard.sort((a, b) => {
            if (sortType === "streak") return b.currentStreak - a.currentStreak;
            if (sortType === "level") return b.level - a.level;
            if (sortType === "tasks") return b.tasksCompleted - a.tasksCompleted;
            return b.totalXP - a.totalXP;
        });

        // Add ranks
        return leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));
    },
});
