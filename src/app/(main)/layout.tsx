import { TaskQuestProvider, InitialData } from '@/context/task-quest-context';
import AppShell from '@/components/app-shell';
import { fetchQuery } from '@/lib/server-convex-client';
import { api } from '../../../convex/_generated/api';
import { Doc } from '../../../convex/_generated/dataModel';

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let initialData: InitialData | undefined = undefined;

    try {
        const [tasks, projects, habits, reminders] = await Promise.all([
            fetchQuery<Doc<"tasks">[]>(api.tasks.get),
            fetchQuery<Doc<"projects">[]>(api.projects.get),
            fetchQuery<Doc<"habits">[]>(api.habits.get),
            fetchQuery<Doc<"reminders">[]>(api.reminders.get),
        ]);

        initialData = {
            tasks,
            projects,
            habits,
            reminders
        };
    } catch (error) {
        // Fallback to client-side fetching if server fetch fails (e.g. unauthenticated)
        console.warn("Server-side preloading failed or user not authenticated:", error);
    }

    return (
        <TaskQuestProvider initialData={initialData}>
            <AppShell>
                {children}
            </AppShell>
        </TaskQuestProvider>
    );
}
