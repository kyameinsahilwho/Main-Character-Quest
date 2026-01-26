import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./utils";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("reminders")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

export const add = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        intervalUnit: v.optional(v.string()),
        intervalValue: v.optional(v.number()),
        remindAt: v.string(),
        isActive: v.boolean(),
        icon: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        return await ctx.db.insert("reminders", {
            ...args,
            userId,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("reminders"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        type: v.optional(v.string()),
        intervalUnit: v.optional(v.string()),
        intervalValue: v.optional(v.number()),
        remindAt: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const { id, ...updates } = args;
        const reminder = await ctx.db.get(id);
        if (!reminder || reminder.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("reminders") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const reminder = await ctx.db.get(args.id);
        if (!reminder || reminder.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});
