"use client";

import { useState, useEffect, useMemo } from 'react';
import Confetti from 'react-confetti';
import Header from '@/components/header';
import StatsPanel from '@/components/stats-panel';
import TaskList from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { Skeleton } from './ui/skeleton';
import OverallProgress from './overall-progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  const { activeTasks, completedTasks } = useMemo(() => {
    const active = tasks.filter(task => !task.isCompleted);
    const completed = tasks.filter(task => task.isCompleted);
    return { activeTasks: active, completedTasks: completed };
  }, [tasks]);

  const MainContent = () => {
    if (isInitialLoad) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )
    }
    return (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Quests</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">
                <TaskList
                    tasks={activeTasks}
                    listType='active'
                    onToggleTask={toggleTaskCompletion}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtaskCompletion}
                    setCelebrating={setCelebrating}
                />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
                <TaskList
                    tasks={completedTasks}
                    listType='completed'
                    onToggleTask={toggleTaskCompletion}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtaskCompletion}
                    setCelebrating={setCelebrating}
                />
            </TabsContent>
        </Tabs>
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
