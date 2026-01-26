import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./utils";

// Internal mutations called by Clerk webhooks
export const upsertFromClerk = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by token
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        image: args.image,
      });
      return existingUser._id;
    }

    // Check if there's a Supabase-migrated user with the same email
    if (args.email) {
      const migratedUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();

      if (migratedUser && migratedUser.tokenIdentifier.startsWith("supabase-migration|")) {
        // Link the Supabase user to the Clerk identity
        await ctx.db.patch(migratedUser._id, {
          tokenIdentifier: args.tokenIdentifier,
          name: args.name || migratedUser.name,
          image: args.image || migratedUser.image,
        });
        console.log(`Webhook: Linked Supabase-migrated user ${args.email} to Clerk account`);
        return migratedUser._id;
      }
    }

    // Create new user
    return await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      email: args.email,
      name: args.name,
      image: args.image,
      totalXP: 0,
      level: 1,
      currentStreak: 0,
    });
  },
});

export const deleteFromClerk = internalMutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
      if (user.name !== identity.name || user.email !== identity.email) {
        await ctx.db.patch(user._id, { name: identity.name, email: identity.email, image: identity.pictureUrl });
      }
      return user._id;
    }

    // Check if there's a Supabase-migrated user with the same email
    if (identity.email) {
      const migratedUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();

      if (migratedUser && migratedUser.tokenIdentifier.startsWith("supabase-migration|")) {
        // Link the Supabase user to the Clerk identity
        await ctx.db.patch(migratedUser._id, {
          tokenIdentifier: identity.tokenIdentifier,
          name: identity.name || migratedUser.name,
          image: identity.pictureUrl || migratedUser.image,
        });
        console.log(`Linked Supabase-migrated user ${identity.email} to Clerk account`);
        return migratedUser._id;
      }
    }

    // If it's a new identity, create a new `User`.
    return await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      image: identity.pictureUrl,
      tokenIdentifier: identity.tokenIdentifier,
      // Initialize stats
      totalXP: 0,
      level: 1,
      currentStreak: 0,
    });
  },
});

export const updateSettings = mutation({
  args: {
    totalXP: v.optional(v.number()),
    level: v.optional(v.number()),
    currentStreak: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    tasksCompleted: v.optional(v.number()),
    lastActiveDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    await ctx.db.patch(userId, args);
  },
});

// For migration only
export const seedUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", args);
  },
});
