import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./utils";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const tasksWithSubtasks = await Promise.all(
            tasks.map(async (task) => {
                const subtasks = await ctx.db
                    .query("subtasks")
                    .withIndex("by_task", (q) => q.eq("taskId", task._id))
                    .collect();
                return { ...task, subtasks };
            })
        );

        return tasksWithSubtasks;
    },
});

export const add = mutation({
    args: {
        title: v.string(),
        dueDate: v.optional(v.string()),
        isCompleted: v.boolean(),
        completedAt: v.optional(v.string()),
        createdAt: v.string(),
        projectId: v.optional(v.id("projects")),
        reminderAt: v.optional(v.string()),
        reminderEnabled: v.optional(v.boolean()),
        rewardXp: v.number(),
        subtasks: v.optional(
            v.array(
                v.object({
                    title: v.string(),
                    isCompleted: v.boolean(),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const { subtasks, ...taskData } = args;

        const taskId = await ctx.db.insert("tasks", {
            ...taskData,
            userId,
        });

        if (subtasks && subtasks.length > 0) {
            await Promise.all(
                subtasks.map((st) =>
                    ctx.db.insert("subtasks", {
                        taskId,
                        title: st.title,
                        isCompleted: st.isCompleted,
                    })
                )
            );
        }

        return taskId;
    },
});

export const update = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        isCompleted: v.optional(v.boolean()),
        completedAt: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
        reminderAt: v.optional(v.string()),
        reminderEnabled: v.optional(v.boolean()),
        rewardXp: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const { id, ...updates } = args;

        // Security check: ensure task belongs to user
        const task = await ctx.db.get(id);
        if (!task || task.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const task = await ctx.db.get(args.id);
        if (!task || task.userId !== userId) throw new Error("Unauthorized");

        // Delete subtasks
        const subtasks = await ctx.db
            .query("subtasks")
            .withIndex("by_task", (q) => q.eq("taskId", args.id))
            .collect();

        await Promise.all(subtasks.map((st) => ctx.db.delete(st._id)));

        // Delete task
        await ctx.db.delete(args.id);
    },
});

// Subtask operations
export const addSubtask = mutation({
    args: {
        taskId: v.id("tasks"),
        title: v.string(),
        isCompleted: v.boolean(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const task = await ctx.db.get(args.taskId);
        if (!task || task.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.insert("subtasks", {
            taskId: args.taskId,
            title: args.title,
            isCompleted: args.isCompleted,
        });
    },
});

export const updateSubtask = mutation({
    args: {
        id: v.id("subtasks"),
        title: v.optional(v.string()),
        isCompleted: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const subtask = await ctx.db.get(args.id);
        if (!subtask) throw new Error("Not found");

        const task = await ctx.db.get(subtask.taskId);
        if (!task || task.userId !== userId) throw new Error("Unauthorized");

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const removeSubtask = mutation({
    args: { id: v.id("subtasks") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const subtask = await ctx.db.get(args.id);
        if (!subtask) return; // already deleted

        const task = await ctx.db.get(subtask.taskId);
        if (!task || task.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});
