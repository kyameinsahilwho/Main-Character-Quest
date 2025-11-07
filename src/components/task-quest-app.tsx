"use client";

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import Header from '@/components/header';
import StatsPanel from '@/components/stats-panel';
import TaskList from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { Skeleton } from './ui/skeleton';
import OverallProgress from './overall-progress';

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

  const [isCelebrating, setCelebrating] = useState(false);
  const [windowSize, setWindowSize] = useState<{width: number, height: number}>({width: 0, height: 0});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({width: window.innerWidth, height: window.innerHeight});
      const handleResize = () => setWindowSize({width: window.innerWidth, height: window.innerHeight});
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (isCelebrating) {
      const timer = setTimeout(() => {
        setCelebrating(false);
      }, 5000); // Confetti disappears after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);

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
        setCelebrating={setCelebrating}
      />
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      {isCelebrating && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />}
      <Header onAddTask={addTask} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <MainContent />
        </div>
        <aside className="hidden w-80 border-l border-border bg-card/50 p-6 lg:block">
          <StatsPanel stats={stats} streaks={streaks} isInitialLoad={isInitialLoad} />
        </aside>
        <OverallProgress completionPercentage={stats.completionPercentage} isInitialLoad={isInitialLoad} />
      </main>
    </div>
  );
}
