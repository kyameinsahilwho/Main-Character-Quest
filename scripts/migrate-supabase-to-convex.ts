import { createClient } from '@supabase/supabase-js';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const convex = new ConvexHttpClient(CONVEX_URL);

interface MigrationStats {
    users: { total: number; migrated: number; skipped: number; errors: number };
    tasks: { total: number; migrated: number; skipped: number; errors: number };
    subtasks: { total: number; migrated: number; skipped: number; errors: number };
    projects: { total: number; migrated: number; skipped: number; errors: number };
    habits: { total: number; migrated: number; skipped: number; errors: number };
    habitCompletions: { total: number; migrated: number; skipped: number; errors: number };
}

const stats: MigrationStats = {
    users: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    tasks: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    subtasks: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    projects: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    habits: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    habitCompletions: { total: 0, migrated: 0, skipped: 0, errors: 0 },
};

// Store mapping of Supabase IDs to Convex IDs
const userIdMap = new Map<string, string>();
const projectIdMap = new Map<string, string>();
const taskIdMap = new Map<string, string>();
const habitIdMap = new Map<string, string>();

async function migrateUsers() {
    console.log('\n📦 Migrating Users...');

    // Fetch all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching Supabase users:', authError);
        return;
    }

    stats.users.total = authUsers.users.length;
    console.log(`Found ${authUsers.users.length} users in Supabase`);

    // Fetch user_settings for additional data
    const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*');

    const settingsMap = new Map(userSettings?.map(s => [s.user_id, s]) || []);

    for (const user of authUsers.users) {
        try {
            const email = user.email;
            if (!email) {
                console.log(`  ⚠️ Skipping user ${user.id} - no email`);
                stats.users.skipped++;
                continue;
            }

            // Check if user already exists in Convex by email
            const existingUser = await convex.query(api.migration.getUserByEmail, { email });

            if (existingUser) {
                console.log(`  ✓ User ${email} already exists in Convex`);
                userIdMap.set(user.id, existingUser._id);
                stats.users.skipped++;
                continue;
            }

            // Get settings for this user
            const settings = settingsMap.get(user.id);

            // Create user in Convex with a placeholder tokenIdentifier
            // The user will need to re-authenticate with Clerk to get the proper token
            const convexUserId = await convex.mutation(api.migration.createUserFromSupabase, {
                email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
                image: user.user_metadata?.avatar_url || undefined,
                supabaseId: user.id,
                totalXP: settings?.total_xp || 0,
                level: settings?.level || 1,
                currentStreak: settings?.current_streak || 0,
                longestStreak: settings?.longest_streak || 0,
                tasksCompleted: settings?.tasks_completed || 0,
            });

            userIdMap.set(user.id, convexUserId);
            console.log(`  ✓ Migrated user: ${email}`);
            stats.users.migrated++;
        } catch (error) {
            console.error(`  ✗ Error migrating user ${user.email}:`, error);
            stats.users.errors++;
        }
    }
}

async function migrateProjects() {
    console.log('\n📁 Migrating Projects...');

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*');

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    if (!projects) {
        console.log('No projects table found or empty');
        return;
    }

    stats.projects.total = projects.length;
    console.log(`Found ${projects.length} projects in Supabase`);

    for (const project of projects) {
        try {
            const convexUserId = userIdMap.get(project.user_id);
            if (!convexUserId) {
                console.log(`  ⚠️ Skipping project "${project.name}" - user not found`);
                stats.projects.skipped++;
                continue;
            }

            // Check if already migrated
            const existing = await convex.query(api.migration.getProjectBySupabaseId, {
                supabaseId: project.id
            });

            if (existing) {
                projectIdMap.set(project.id, existing._id);
                console.log(`  ✓ Project "${project.name}" already exists`);
                stats.projects.skipped++;
                continue;
            }

            const convexProjectId = await convex.mutation(api.migration.createProjectFromSupabase, {
                userId: convexUserId,
                name: project.name,
                description: project.description || undefined,
                color: project.color || '#3b82f6',
                icon: project.icon || '📁',
                createdAt: project.created_at || new Date().toISOString(),
                supabaseId: project.id,
            });

            projectIdMap.set(project.id, convexProjectId);
            console.log(`  ✓ Migrated project: ${project.name}`);
            stats.projects.migrated++;
        } catch (error) {
            console.error(`  ✗ Error migrating project ${project.name}:`, error);
            stats.projects.errors++;
        }
    }
}

async function migrateTasks() {
    console.log('\n📋 Migrating Tasks...');

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*');

    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }

    stats.tasks.total = tasks?.length || 0;
    console.log(`Found ${tasks?.length || 0} tasks in Supabase`);

    for (const task of (tasks || [])) {
        try {
            const convexUserId = userIdMap.get(task.user_id);
            if (!convexUserId) {
                console.log(`  ⚠️ Skipping task "${task.title}" - user not found`);
                stats.tasks.skipped++;
                continue;
            }

            // Check if already migrated
            const existing = await convex.query(api.migration.getTaskBySupabaseId, {
                supabaseId: task.id
            });

            if (existing) {
                taskIdMap.set(task.id, existing._id);
                console.log(`  ✓ Task "${task.title}" already exists`);
                stats.tasks.skipped++;
                continue;
            }

            // Map project if exists
            const convexProjectId = task.project_id ? projectIdMap.get(task.project_id) : undefined;

            const convexTaskId = await convex.mutation(api.migration.createTaskFromSupabase, {
                userId: convexUserId,
                title: task.title,
                dueDate: task.due_date || undefined,
                isCompleted: task.is_completed || false,
                completedAt: task.completed_at || undefined,
                createdAt: task.created_at || new Date().toISOString(),
                projectId: convexProjectId,
                rewardXp: task.reward_xp || 10,
                supabaseId: task.id,
            });

            taskIdMap.set(task.id, convexTaskId);
            console.log(`  ✓ Migrated task: ${task.title}`);
            stats.tasks.migrated++;
        } catch (error) {
            console.error(`  ✗ Error migrating task ${task.title}:`, error);
            stats.tasks.errors++;
        }
    }
}

async function migrateSubtasks() {
    console.log('\n📝 Migrating Subtasks...');

    const { data: subtasks, error } = await supabase
        .from('subtasks')
        .select('*');

    if (error) {
        console.error('Error fetching subtasks:', error);
        return;
    }

    stats.subtasks.total = subtasks?.length || 0;
    console.log(`Found ${subtasks?.length || 0} subtasks in Supabase`);

    for (const subtask of (subtasks || [])) {
        try {
            const convexTaskId = taskIdMap.get(subtask.task_id);
            if (!convexTaskId) {
                console.log(`  ⚠️ Skipping subtask "${subtask.title}" - task not found`);
                stats.subtasks.skipped++;
                continue;
            }

            // Check if already migrated
            const existing = await convex.query(api.migration.getSubtaskBySupabaseId, {
                supabaseId: subtask.id
            });

            if (existing) {
                console.log(`  ✓ Subtask "${subtask.title}" already exists`);
                stats.subtasks.skipped++;
                continue;
            }

            await convex.mutation(api.migration.createSubtaskFromSupabase, {
                taskId: convexTaskId,
                title: subtask.title,
                isCompleted: subtask.is_completed || false,
                supabaseId: subtask.id,
            });

            console.log(`  ✓ Migrated subtask: ${subtask.title}`);
            stats.subtasks.migrated++;
        } catch (error) {
            console.error(`  ✗ Error migrating subtask ${subtask.title}:`, error);
            stats.subtasks.errors++;
        }
    }
}

async function migrateHabits() {
    console.log('\n🔄 Migrating Habits...');

    const { data: habits, error } = await supabase
        .from('habits')
        .select('*');

    if (error) {
        console.log('No habits table found or error:', error.message);
        return;
    }

    stats.habits.total = habits?.length || 0;
    console.log(`Found ${habits?.length || 0} habits in Supabase`);

    for (const habit of (habits || [])) {
        try {
            const convexUserId = userIdMap.get(habit.user_id);
            if (!convexUserId) {
                console.log(`  ⚠️ Skipping habit "${habit.title}" - user not found`);
                stats.habits.skipped++;
                continue;
            }

            // Check if already migrated
            const existing = await convex.query(api.migration.getHabitBySupabaseId, {
                supabaseId: habit.id
            });

            if (existing) {
                habitIdMap.set(habit.id, existing._id);
                console.log(`  ✓ Habit "${habit.title}" already exists`);
                stats.habits.skipped++;
                continue;
            }

            // Convert null to undefined for optional fields
            const customDays = habit.custom_days ? (Array.isArray(habit.custom_days) ? habit.custom_days : undefined) : undefined;

            const convexHabitId = await convex.mutation(api.migration.createHabitFromSupabase, {
                userId: convexUserId,
                title: habit.title,
                description: habit.description || undefined,
                frequency: habit.frequency || 'daily',
                currentStreak: habit.current_streak || 0,
                bestStreak: habit.best_streak || 0,
                color: habit.color || '#3b82f6',
                icon: habit.icon || '⭐',
                createdAt: habit.created_at || new Date().toISOString(),
                customDays: customDays,
                totalCompletions: habit.total_completions || 0,
                archived: habit.archived || false,
                supabaseId: habit.id,
            });

            habitIdMap.set(habit.id, convexHabitId);
            console.log(`  ✓ Migrated habit: ${habit.title}`);
            stats.habits.migrated++;
        } catch (error) {
            console.error(`  ✗ Error migrating habit ${habit.title}:`, error);
            stats.habits.errors++;
        }
    }
}

async function migrateHabitCompletions() {
    console.log('\n✅ Migrating Habit Completions...');

    const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('*');

    if (error) {
        console.log('No habit_completions table found or error:', error.message);
        return;
    }

    stats.habitCompletions.total = completions?.length || 0;
    console.log(`Found ${completions?.length || 0} habit completions in Supabase`);

    for (const completion of (completions || [])) {
        try {
            const convexHabitId = habitIdMap.get(completion.habit_id);
            const convexUserId = userIdMap.get(completion.user_id);

            if (!convexHabitId || !convexUserId) {
                stats.habitCompletions.skipped++;
                continue;
            }

            // Check if already migrated
            const existing = await convex.query(api.migration.getHabitCompletionBySupabaseId, {
                supabaseId: completion.id
            });

            if (existing) {
                stats.habitCompletions.skipped++;
                continue;
            }

            await convex.mutation(api.migration.createHabitCompletionFromSupabase, {
                habitId: convexHabitId,
                userId: convexUserId,
                completedAt: completion.completed_at || new Date().toISOString(),
                supabaseId: completion.id,
            });

            stats.habitCompletions.migrated++;
        } catch (error) {
            stats.habitCompletions.errors++;
        }
    }

    console.log(`  ✓ Migrated ${stats.habitCompletions.migrated} habit completions`);
}

function printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));

    const tables = ['users', 'projects', 'tasks', 'subtasks', 'habits', 'habitCompletions'] as const;

    for (const table of tables) {
        const s = stats[table];
        console.log(`\n${table.toUpperCase()}:`);
        console.log(`  Total:    ${s.total}`);
        console.log(`  Migrated: ${s.migrated}`);
        console.log(`  Skipped:  ${s.skipped}`);
        console.log(`  Errors:   ${s.errors}`);
    }

    console.log('\n' + '='.repeat(50));
}

async function main() {
    console.log('🚀 Starting Supabase to Convex Migration');
    console.log('=========================================');
    console.log(`Supabase URL: ${SUPABASE_URL}`);
    console.log(`Convex URL: ${CONVEX_URL}`);
    console.log('');

    try {
        // Migrate in order (respecting foreign key relationships)
        await migrateUsers();
        await migrateProjects();
        await migrateTasks();
        await migrateSubtasks();
        await migrateHabits();
        await migrateHabitCompletions();

        printSummary();

        console.log('\n✅ Migration completed!');
        console.log('\n⚠️  IMPORTANT: Users will need to sign in with Clerk to link their accounts.');
        console.log('    Their data has been imported and will be matched by email address.');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
