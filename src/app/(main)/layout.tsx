"use client";

import { TaskQuestProvider } from '@/context/task-quest-context';
import AppShell from '@/components/app-shell';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TaskQuestProvider>
            <AppShell>
                {children}
            </AppShell>
        </TaskQuestProvider>
    );
}
