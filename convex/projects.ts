import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./utils";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("projects")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        color: v.string(),
        icon: v.string(),
        createdAt: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        return await ctx.db.insert("projects", {
            ...args,
            userId,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("projects"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const { id, ...updates } = args;

        const project = await ctx.db.get(id);
        if (!project || project.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const project = await ctx.db.get(args.id);
        if (!project || project.userId !== userId) throw new Error("Unauthorized");

        // Note: In Supabase, ON DELETE SET NULL was likely used for tasks.project_id
        // Here we should probably update tasks to remove the project reference
        // Fetch tasks with this projectId
        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("projectId"), args.id))
            .collect();

        for (const task of tasks) {
            await ctx.db.patch(task._id, { projectId: undefined });
        }

        await ctx.db.delete(args.id);
    },
});
