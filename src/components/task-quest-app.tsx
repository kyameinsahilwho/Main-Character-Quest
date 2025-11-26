"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Plus, ListPlus, LogOut, User as UserIcon } from 'lucide-react';
import Header from '@/components/header';
import TaskList from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { useSupabaseSync } from '@/hooks/use-supabase-sync';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Task } from '@/lib/types';
import { EditTaskDialog } from './edit-task-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from './ui/button';
import { AutomatedTasksPopover } from './automated-tasks-popover';
import { CalendarDialog } from './calendar-dialog';
import { CalendarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from './ui/alert';
import { calculateLevel, XP_PER_TASK } from '@/lib/level-system';

// Lazy load Confetti for better initial load performance
const Confetti = lazy(() => import('react-confetti'));


export default function TaskQuestApp() {
  const { user, isLoading: authLoading, isSyncing, syncLocalToSupabase, signOut } = useSupabaseSync();

  const {
    tasks,
    stats,
    streaks,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    addSubtask,
    toggleSubtaskCompletion,
    updateTask,
    isInitialLoad,
    addAutomatedTasksToToday,
    reloadFromSupabase,
  } = useTasks(user);

  const [isCelebrating, setCelebrating] = useState(false);
  const [windowSize, setWindowSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [syncComplete, setSyncComplete] = useState(false);

  const levelInfo = useMemo(() => {
    const totalXP = stats.completedTasks * XP_PER_TASK;
    return calculateLevel(totalXP);
  }, [stats.completedTasks]);

  // Sync local storage to Supabase when user first logs in
  useEffect(() => {
    if (user && !authLoading && !syncComplete) {
      const syncStatus = localStorage.getItem('task-quest-sync-status');

      // Only sync if haven't synced before
      if (syncStatus !== 'synced') {
        syncLocalToSupabase(user.id).then(() => {
          setSyncComplete(true);
          // Reload from Supabase after sync to get the synced data
          reloadFromSupabase();
        });
      } else {
        setSyncComplete(true);
      }
    }
  }, [user, authLoading, syncLocalToSupabase, syncComplete, reloadFromSupabase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
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

  // Memoize filtered task arrays to prevent unnecessary recalculations
  const { activeTasks, completedTasks, automatedTasks } = useMemo(() => {
    const active = tasks.filter(task => !task.isCompleted && !task.isAutomated);
    const completed = tasks.filter(task => task.isCompleted && !task.isAutomated);
    const automated = tasks.filter(task => task.isAutomated);
    return { activeTasks: active, completedTasks: completed, automatedTasks: automated };
  }, [tasks]);

  // Memoize callbacks to prevent child re-renders
  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
  }, []);

  const handleUpdateTask = useCallback((updatedTaskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, updatedTaskData);
      setTaskToEdit(null);
    }
  }, [taskToEdit, updateTask]);

  const handleAddTask = useCallback((taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
    const isAutomated = activeTab === 'automated';
    addTask({ ...taskData, isAutomated });
  }, [activeTab, addTask]);



  return (
    <div className="flex h-screen w-full flex-col font-body">
      {isCelebrating && (
        <Suspense fallback={null}>
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />
        </Suspense>
      )}
      <Header
        stats={{ ...stats, levelInfo }}
        streaks={streaks}
        isInitialLoad={isInitialLoad}
        user={user}
        onSignOut={signOut}
        isSyncing={isSyncing}
      />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto">
            {(isInitialLoad || authLoading) ? (
            <div className="space-y-4 p-4 md:p-6 lg:p-8">
              <h2 className="text-xl font-bold font-headline mb-4"><Skeleton className="h-8 w-32" /></h2>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="w-full">
              {isSyncing && (
                <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
                  <Alert className="mb-4">
                    <AlertDescription>
                      🔄 Syncing your data to the cloud...
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className='flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8'>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <TabsList className="grid w-full md:w-fit grid-cols-3">
                      <TabsTrigger value="active" className="transition-all duration-200 flex items-center justify-center">
                        <span className="relative flex items-center gap-1.5">
                          <span className="hidden sm:inline">Active</span>
                          <span className="sm:hidden">Active</span>
                          {activeTasks.length > 0 && (
                            <>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                              <span className="text-xs font-bold">
                                {activeTasks.length}
                              </span>
                            </>
                          )}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="transition-all duration-200 flex items-center justify-center">
                        <span className="flex items-center gap-1">
                          <span className="hidden sm:inline">Completed</span>
                          <span className="sm:hidden">Done</span>
                          {completedTasks.length > 0 && (
                            <span className="text-xs opacity-70">({completedTasks.length})</span>
                          )}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="automated" className="transition-all duration-200 flex items-center justify-center">
                        <span className="flex items-center gap-1">
                          <span className="hidden sm:inline">Automated</span>
                          <span className="sm:hidden">Auto</span>
                          {automatedTasks.length > 0 && (
                            <span className="text-xs opacity-70">({automatedTasks.length})</span>
                          )}
                        </span>
                      </TabsTrigger>
                    </TabsList>


                  </div>
                  <div className="flex w-full md:w-auto items-center gap-2 flex-col md:flex-row">
                    <CalendarDialog tasks={tasks}>
                      <Button variant="outline" className="w-full group hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 hover:border-foreground">
                        <CalendarIcon className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                        Quest Calendar
                      </Button>
                    </CalendarDialog>
                    {activeTab === 'active' && (
                      <AutomatedTasksPopover
                        tasks={automatedTasks}
                        onAddTasks={addAutomatedTasksToToday}
                      >
                        <Button variant="outline" className="w-full group hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 hover:border-foreground">
                          <ListPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                          Add from Automated
                        </Button>
                      </AutomatedTasksPopover>
                    )}
                    <AddTaskDialog onAddTask={handleAddTask}>
                      <Button className="w-full group hover:scale-105 transition-all duration-200 shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-1px] hover:translate-y-[-1px]">
                        <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                        New Quest
                      </Button>
                    </AddTaskDialog>
                  </div>
                </div>
                <TabsContent value="active" className="mt-4">
                  <TaskList
                    tasks={activeTasks}
                    listType='active'
                    onToggleTask={toggleTaskCompletion}
                    onDeleteTask={deleteTask}
                    onEditTask={handleEditTask}
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
                    onEditTask={handleEditTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtaskCompletion}
                    setCelebrating={setCelebrating}
                  />
                </TabsContent>
                <TabsContent value="automated" className="mt-4">
                  <TaskList
                    tasks={automatedTasks}
                    listType='automated'
                    onToggleTask={toggleTaskCompletion}
                    onDeleteTask={deleteTask}
                    onEditTask={handleEditTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtaskCompletion}
                    setCelebrating={setCelebrating}
                  />
                </TabsContent>
              </Tabs>
              <style jsx>{`
                @keyframes fade-in {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }
                @keyframes fade-in-up {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                :global(.animate-fade-in) {
                  animation: fade-in 0.2s ease-out;
                }
                :global(.animate-fade-in-up) {
                  animation: fade-in-up 0.3s ease-out;
                }
              `}</style>
            </div>
          )}
        </div>
        </div>
      </main>
      {taskToEdit && (
        <EditTaskDialog
          isOpen={!!taskToEdit}
          onClose={() => setTaskToEdit(null)}
          onEditTask={handleUpdateTask}
          task={taskToEdit}
        />
      )}
    </div>
  );
}
