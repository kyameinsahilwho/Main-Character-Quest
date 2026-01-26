import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Query functions to check for existing records

export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();
    },
});

export const getProjectBySupabaseId = query({
    args: { supabaseId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("projects")
            .filter((q) => q.eq(q.field("supabaseId"), args.supabaseId))
            .first();
    },
});

export const getTaskBySupabaseId = query({
    args: { supabaseId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tasks")
            .filter((q) => q.eq(q.field("supabaseId"), args.supabaseId))
            .first();
    },
});

export const getSubtaskBySupabaseId = query({
    args: { supabaseId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subtasks")
            .filter((q) => q.eq(q.field("supabaseId"), args.supabaseId))
            .first();
    },
});

export const getHabitBySupabaseId = query({
    args: { supabaseId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("habits")
            .filter((q) => q.eq(q.field("supabaseId"), args.supabaseId))
            .first();
    },
});

export const getHabitCompletionBySupabaseId = query({
    args: { supabaseId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("habitCompletions")
            .filter((q) => q.eq(q.field("supabaseId"), args.supabaseId))
            .first();
    },
});

// Mutation functions to create records from Supabase data

export const createUserFromSupabase = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        supabaseId: v.string(),
        totalXP: v.optional(v.number()),
        level: v.optional(v.number()),
        currentStreak: v.optional(v.number()),
        longestStreak: v.optional(v.number()),
        tasksCompleted: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists by email
        const existing = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();

        if (existing) {
            // Update existing user with Supabase data if they don't have stats
            if (!existing.totalXP && args.totalXP) {
                await ctx.db.patch(existing._id, {
                    totalXP: args.totalXP,
                    level: args.level,
                    currentStreak: args.currentStreak,
                    longestStreak: args.longestStreak,
                    tasksCompleted: args.tasksCompleted,
                });
            }
            return existing._id;
        }

        // Create a placeholder tokenIdentifier
        // When the user signs in with Clerk, the token will be updated
        const placeholderToken = `supabase-migration|${args.supabaseId}`;

        return await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            image: args.image,
            tokenIdentifier: placeholderToken,
            totalXP: args.totalXP || 0,
            level: args.level || 1,
            currentStreak: args.currentStreak || 0,
            longestStreak: args.longestStreak,
            tasksCompleted: args.tasksCompleted,
        });
    },
});

export const createProjectFromSupabase = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.string(),
        icon: v.string(),
        createdAt: v.string(),
        supabaseId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("projects", {
            userId: args.userId,
            name: args.name,
            description: args.description,
            color: args.color,
            icon: args.icon,
            createdAt: args.createdAt,
            supabaseId: args.supabaseId,
        });
    },
});

export const createTaskFromSupabase = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        dueDate: v.optional(v.string()),
        isCompleted: v.boolean(),
        completedAt: v.optional(v.string()),
        createdAt: v.string(),
        projectId: v.optional(v.id("projects")),
        rewardXp: v.number(),
        supabaseId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("tasks", {
            userId: args.userId,
            title: args.title,
            dueDate: args.dueDate,
            isCompleted: args.isCompleted,
            completedAt: args.completedAt,
            createdAt: args.createdAt,
            projectId: args.projectId,
            rewardXp: args.rewardXp,
            supabaseId: args.supabaseId,
        });
    },
});

export const createSubtaskFromSupabase = mutation({
    args: {
        taskId: v.id("tasks"),
        title: v.string(),
        isCompleted: v.boolean(),
        supabaseId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("subtasks", {
            taskId: args.taskId,
            title: args.title,
            isCompleted: args.isCompleted,
            supabaseId: args.supabaseId,
        });
    },
});

export const createHabitFromSupabase = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        description: v.optional(v.string()),
        frequency: v.string(),
        currentStreak: v.number(),
        bestStreak: v.number(),
        color: v.string(),
        icon: v.string(),
        createdAt: v.string(),
        customDays: v.optional(v.array(v.number())),
        totalCompletions: v.number(),
        archived: v.optional(v.boolean()),
        supabaseId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("habits", {
            userId: args.userId,
            title: args.title,
            description: args.description,
            frequency: args.frequency,
            currentStreak: args.currentStreak,
            bestStreak: args.bestStreak,
            color: args.color,
            icon: args.icon,
            createdAt: args.createdAt,
            customDays: args.customDays,
            totalCompletions: args.totalCompletions,
            archived: args.archived,
            supabaseId: args.supabaseId,
        });
    },
});

export const createHabitCompletionFromSupabase = mutation({
    args: {
        habitId: v.id("habits"),
        userId: v.id("users"),
        completedAt: v.string(),
        supabaseId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("habitCompletions", {
            habitId: args.habitId,
            userId: args.userId,
            completedAt: args.completedAt,
            supabaseId: args.supabaseId,
        });
    },
});

// Function to link a Supabase-migrated user to their Clerk account
export const linkSupabaseUser = mutation({
    args: {
        email: v.string(),
        tokenIdentifier: v.string(),
        name: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Find user by email
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            return null;
        }

        // Check if this is a migrated user (placeholder token starts with 'supabase-migration|')
        if (user.tokenIdentifier.startsWith("supabase-migration|")) {
            // Update to the real Clerk token
            await ctx.db.patch(user._id, {
                tokenIdentifier: args.tokenIdentifier,
                name: args.name || user.name,
                image: args.image || user.image,
            });
            console.log(`Linked Supabase user ${args.email} to Clerk account`);
        }

        return user._id;
    },
});
