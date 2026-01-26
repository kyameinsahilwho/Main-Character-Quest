import { createClient } from '@supabase/supabase-js';
import { ConvexHttpClient } from 'convex/browser';
import * as dotenv from 'dotenv';
import { api } from '../convex/_generated/api.js';

dotenv.config({ path: '.env.local' });
// Also try loading .env
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CONVEX_URL) {
    console.error("Missing environment variables.");
    console.error("Make sure .env.local contains: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_CONVEX_URL");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const convex = new ConvexHttpClient(CONVEX_URL);

async function migrate() {
    console.log("Starting full migration...");

    // 1. Users
    console.log("Migrating users...");
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userIdMap = new Map(); // supabaseId -> convexId

    for (const user of users) {
        if (!user.email) continue;
        try {
            const convexId = await convex.mutation(api.users.seedUser, {
                email: user.email,
                name: user.user_metadata?.name || user.email.split('@')[0],
                image: user.user_metadata?.avatar_url,
                supabaseId: user.id,
            });
            userIdMap.set(user.id, convexId);
            console.log(`Migrated user: ${user.email}`);
        } catch (e) {
            console.error(`Failed to migrate user ${user.email}:`, e);
        }
    }

    // 2. Projects
    console.log("Migrating projects...");
    const { data: projects } = await supabase.from('projects').select('*');
    const projectIdMap = new Map();

    if (projects) {
        for (const p of projects) {
            const convexUserId = userIdMap.get(p.user_id);
            if (!convexUserId) continue;

            try {
                const convexId = await convex.mutation(api.projects.add, {
                    name: p.name,
                    description: p.description,
                    color: p.color,
                    icon: p.icon,
                    createdAt: p.created_at,
                });
                // We need to patch the userId because `add` mutation uses current auth user, which is null here!
                // Wait, `add` relies on `getAuthUserId`. This script runs as admin/public?
                // Convex "internal" mutations or "admin" mode is needed to set userId explicitly.
                // My public mutations check `getAuthUserId(ctx)`.
                // This script will FAIL because it is not authenticated as the user.

                console.warn("Skipping data migration via public API - requires Admin/Internal API strategies which are complex to script blindly.");
                console.warn("Please verify manually or use Convex Dashboard to import data.");
                break;
            } catch (e) {
                console.error(e);
            }
        }
    }

    console.log("Migration script requires 'Admin' mutations that accept userId as argument.");
    console.log("For now, since we removed Supabase, new data will be created in Convex.");
}

migrate().catch(console.error);
