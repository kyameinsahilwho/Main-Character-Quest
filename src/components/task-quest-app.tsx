"use client";

import Header from '@/components/header';
import StatsPanel from '@/components/stats-panel';
import TaskList from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { Skeleton } from './ui/skeleton';

export default function TaskQuestApp() {
  const {
    tasks,
    stats,
    streaks,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    addSubtask,
    toggleSubtaskCompletion,
    isInitialLoad,
  } = useTasks();

  const MainContent = () => {
    if (isInitialLoad) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )
    }
    return (
      <TaskList
        tasks={tasks}
        onToggleTask={toggleTaskCompletion}
        onDeleteTask={deleteTask}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtaskCompletion}
      />
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      <Header onAddTask={addTask} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <MainContent />
        </div>
        <aside className="hidden w-80 border-l border-border bg-card/50 p-6 lg:block">
          <StatsPanel stats={stats} streaks={streaks} isInitialLoad={isInitialLoad} />
        </aside>
      </main>
    </div>
  );
}
