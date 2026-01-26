import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./utils";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const habits = await ctx.db
            .query("habits")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Fetch completions for each habit
        const habitsWithCompletions = await Promise.all(
            habits.map(async (habit) => {
                const completions = await ctx.db
                    .query("habitCompletions")
                    .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
                    .collect();
                return { ...habit, completions };
            })
        );

        return habitsWithCompletions;
    },
});

export const add = mutation({
    args: {
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
        yearlyAchieved: v.optional(v.number()),
        yearlyExpected: v.optional(v.number()),
        statsYear: v.optional(v.number()),
        archived: v.optional(v.boolean()),
        reminderTime: v.optional(v.string()),
        reminderEnabled: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        return await ctx.db.insert("habits", {
            ...args,
            userId,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("habits"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        frequency: v.optional(v.string()),
        currentStreak: v.optional(v.number()),
        bestStreak: v.optional(v.number()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        customDays: v.optional(v.array(v.number())),
        totalCompletions: v.optional(v.number()),
        yearlyAchieved: v.optional(v.number()),
        yearlyExpected: v.optional(v.number()),
        statsYear: v.optional(v.number()),
        archived: v.optional(v.boolean()),
        reminderTime: v.optional(v.string()),
        reminderEnabled: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const { id, ...updates } = args;
        const habit = await ctx.db.get(id);
        if (!habit || habit.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("habits") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const habit = await ctx.db.get(args.id);
        if (!habit || habit.userId !== userId) throw new Error("Unauthorized");

        // Delete completions
        const completions = await ctx.db
            .query("habitCompletions")
            .withIndex("by_habit", (q) => q.eq("habitId", args.id))
            .collect();

        await Promise.all(completions.map((c) => ctx.db.delete(c._id)));

        await ctx.db.delete(args.id);
    },
});

export const addCompletion = mutation({
    args: {
        habitId: v.id("habits"),
        completedAt: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const habit = await ctx.db.get(args.habitId);
        if (!habit || habit.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.insert("habitCompletions", {
            habitId: args.habitId,
            userId,
            completedAt: args.completedAt,
        });
    },
});

export const removeCompletion = mutation({
    args: {
        completionId: v.id("habitCompletions"),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const completion = await ctx.db.get(args.completionId);
        if (!completion || completion.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.delete(args.completionId);
    },
});

