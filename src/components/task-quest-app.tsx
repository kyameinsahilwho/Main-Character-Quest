"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react';
import { Sword, CheckCircle2, Star, Bot, Clock, Flame, Plus, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/header';
import TaskList from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { useSupabaseSync } from '@/hooks/use-supabase-sync';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Task, Reminder } from '@/lib/types';
import { EditTaskDialog } from './edit-task-dialog';
import { Button } from './ui/button';
import { CalendarDialog } from './calendar-dialog';
import { CalendarIcon, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateLevel, XP_PER_TASK } from '@/lib/level-system';
import { useToast } from '@/hooks/use-toast';
import ProjectSection from './project-section';
import { HabitTracker } from './habit-tracker';
import { useHabits } from '@/hooks/use-habits';
import { useReminders } from '@/hooks/use-reminders';
import { TaskView } from './task-view';
import { ReminderView } from './reminder-view';
import { isSameDay, isBefore, startOfDay, parseISO } from 'date-fns';
import { AddTaskDialog } from './add-task-dialog';
import { AddHabitDialog } from './add-habit-dialog';
import { AddProjectDialog } from './add-project-dialog';
import { AddReminderDialog } from './add-reminder-dialog';
import { EditReminderDialog } from './edit-reminder-dialog';
import { HistoryView } from './history-view';
import { useNotifications } from '@/hooks/use-notifications';
import { UnifiedAddButton } from './unified-add-button';

// Lazy load Confetti for better initial load performance
const Confetti = lazy(() => import('react-confetti'));


export default function TaskQuestApp() {
  const { user, isLoading: authLoading, isSyncing, syncLocalToSupabase, signOut, supabase } = useSupabaseSync();
  const { toast } = useToast();

  const {
    tasks,
    projects,
    stats,
    streaks,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    addSubtask,
    toggleSubtaskCompletion,
    updateTask,
    addProject,
    updateProject,
    deleteProject,
    isInitialLoad,
    reloadFromSupabase,
  } = useTasks(user);

  const {
    habits,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    deleteHabit,
  } = useHabits(user);

  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderActive,
    triggerReminder,
  } = useReminders(user);

  useNotifications(tasks, habits, reminders, triggerReminder);

  const [isCelebrating, setCelebrating] = useState(false);
  const [windowSize, setWindowSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [syncComplete, setSyncComplete] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Clear selected project when switching tabs away from projects
  useEffect(() => {
    if (activeTab !== 'projects') {
      setSelectedProjectId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (syncComplete) {
       toast({
         title: "Sync Complete",
         description: "Your quests are saved to the cloud.",
       })
    }
  }, [syncComplete, toast]);

  const levelInfo = useMemo(() => {
    const taskXP = tasks.reduce((acc, task) => {
      if (task.isCompleted) {
        return acc + (task.xp || XP_PER_TASK);
      }
      return acc;
    }, 0);

    const habitXP = habits.reduce((acc, habit) => {
      return acc + (habit.xp || 0);
    }, 0);

    return calculateLevel(taskXP + habitXP);
  }, [tasks, habits]);

  // Sync user settings (XP, Level, Streaks) to Supabase
  useEffect(() => {
    if (user && !isInitialLoad && levelInfo) {
      const syncSettings = async () => {
        try {
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              total_xp: levelInfo.totalXP,
              level: levelInfo.level,
              current_streak: streaks.current,
              longest_streak: streaks.longest,
              tasks_completed: stats.completedTasks,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });
          if (error) throw error;
        } catch (error) {
          console.error('Error syncing user settings:', error);
        }
      };

      // Debounce sync to avoid too many requests
      const timer = setTimeout(syncSettings, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isInitialLoad, levelInfo.totalXP, levelInfo.level, streaks, stats.completedTasks, supabase]);

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
  const { todaysTasks, backlogTasks, completedTasks } = useMemo(() => {
    const today = startOfDay(new Date());
    
    const active = tasks.filter(task => !task.isCompleted);
    const completed = tasks.filter(task => task.isCompleted);
    
    const todayTasks = active.filter(task => {
        if (!task.dueDate) return false;
        const due = startOfDay(parseISO(task.dueDate));
        return isSameDay(due, today) || isBefore(due, today);
    });
    
    const backlog = active.filter(task => {
        if (!task.dueDate) return true;
        const due = startOfDay(parseISO(task.dueDate));
        return !isSameDay(due, today) && !isBefore(due, today);
    });

    return { todaysTasks: todayTasks, backlogTasks: backlog, completedTasks: completed };
  }, [tasks]);

  const handleToggleTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.isCompleted) {
      // Undo completion
      toggleTaskCompletion(taskId);
      toast({
        title: "Quest Undone",
        description: "Quest moved back to active list.",
      });
    } else {
      toggleTaskCompletion(taskId);
    }
  }, [tasks, toggleTaskCompletion, toast]);

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
    addTask(taskData);
  }, [addTask]);

  const handleEditReminder = useCallback((reminder: Reminder) => {
    setReminderToEdit(reminder);
  }, []);

  const handleUpdateReminder = useCallback((id: string, updatedReminderData: Partial<Reminder>) => {
    updateReminder(id, updatedReminderData);
    setReminderToEdit(null);
  }, [updateReminder]);



  return (
    <div className="flex h-[100dvh] w-full flex-col font-body transition-colors duration-500 bg-background">
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
      <div className="flex flex-1 overflow-hidden">
          {(isInitialLoad || authLoading) ? (
            <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
              <h2 className="text-xl font-bold font-headline mb-4"><Skeleton className="h-8 w-32" /></h2>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 w-full flex-col md:flex-row overflow-hidden">
              
              {/* Sidebar (Desktop) */}
              <aside className="hidden md:flex w-72 flex-col gap-6 p-6 border-r-4 transition-all duration-500 z-10 bg-card/50 border-border backdrop-blur-md">
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] ml-1">Navigation</p>
                  <div className="flex flex-col gap-3 w-full">
                    <TabsList className="flex flex-col h-auto bg-transparent border-0 p-0 gap-3 w-full">
                      <div className="mb-2">
                        {activeTab === 'habits' ? (
                          <AddHabitDialog onAddHabit={addHabit}>
                            <Button className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-[#6366f1] border-b-[#4f46e5] bg-[#6366f1] text-white hover:bg-[#4f46e5] transition-all duration-200 group rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[4px] flex items-center">
                              <Plus className="mr-3 h-6 w-6 stroke-[4px]" />
                              <span className="font-black tracking-wide">New Ritual</span>
                            </Button>
                          </AddHabitDialog>
                        ) : activeTab === 'projects' && !selectedProjectId ? (
                          <AddProjectDialog onAddProject={addProject}>
                            <Button className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-blue-600 border-b-blue-700 bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 group rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[4px] flex items-center">
                              <Plus className="mr-3 h-6 w-6 stroke-[4px]" />
                              <span className="font-black tracking-wide">New Project</span>
                            </Button>
                          </AddProjectDialog>
                        ) : activeTab === 'reminders' ? (
                          <AddReminderDialog onAddReminder={addReminder}>
                            <Button className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-yellow-600 border-b-yellow-700 bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-200 group rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[4px] flex items-center">
                              <Plus className="mr-3 h-6 w-6 stroke-[4px]" />
                              <span className="font-black tracking-wide">New Reminder</span>
                            </Button>
                          </AddReminderDialog>
                        ) : (
                          <AddTaskDialog 
                            onAddTask={handleAddTask} 
                            projects={projects}
                            defaultProjectId={selectedProjectId}
                            forceProject={!!selectedProjectId}
                          >
                            <Button className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-[#58cc02] border-b-[#46a302] bg-[#58cc02] text-white hover:bg-[#46a302] transition-all duration-200 group rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[4px] flex items-center">
                              <Plus className="mr-3 h-6 w-6 stroke-[4px]" />
                              <span className="font-black tracking-wide">
                                {selectedProjectId ? "Add to Project" : "New Quest"}
                              </span>
                            </Button>
                          </AddTaskDialog>
                        )}
                      </div>

                      <TabsTrigger value="today" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-[#58cc02] data-[state=active]:text-white data-[state=active]:border-[#58cc02] data-[state=active]:border-b-[#46a302] data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                        <Sword className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                        <span className="font-black tracking-wide">Quests</span>
                        {todaysTasks.length > 0 && (
                          <span className="ml-auto bg-muted text-muted-foreground group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white px-2 py-0.5 rounded-full text-xs font-bold">
                            {todaysTasks.length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="habits" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-[#6366f1] data-[state=active]:text-white data-[state=active]:border-[#6366f1] data-[state=active]:border-b-[#4f46e5] data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                        <Flame className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                        <span className="font-black tracking-wide">Rituals</span>
                      </TabsTrigger>
                      <TabsTrigger value="projects" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=active]:border-b-blue-700 data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                        <Folder className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                        <span className="font-black tracking-wide">Projects</span>
                      </TabsTrigger>
                      <TabsTrigger value="reminders" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:border-yellow-600 data-[state=active]:border-b-yellow-700 data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                        <Bell className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                        <span className="font-black tracking-wide">Reminders</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                
                <div className="mt-auto p-5 bg-card rounded-[2rem] border-2 border-b-[8px] border-border shadow-xl relative overflow-hidden group">
                    {/* Mascot Placeholder */}
                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <Bot className="h-32 w-32 text-primary" />
                    </div>
                    {/* 3D Highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-white/60 z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />

                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4 relative z-10">Hero Stats</p>
                    
                    <div className="space-y-5 relative z-10">
                      <div>
                        <div className="flex justify-between items-center text-xs font-black uppercase mb-2">
                            <span className="text-secondary flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-secondary" /> Level {levelInfo.level}</span>
                            <span className="text-secondary tracking-tighter">{Math.floor(levelInfo.currentLevelXP)} / {levelInfo.nextLevelXP} XP</span>
                        </div>
                        <div className="w-full bg-secondary/10 h-3 rounded-full overflow-hidden border-2 border-secondary/20 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <motion.div 
                              className="bg-secondary h-full rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" 
                              initial={{ width: 0 }}
                              animate={{ width: `${levelInfo.progress}%` }}
                              transition={{ duration: 1, ease: "circOut" }}
                            />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-black uppercase mb-2">
                            <span className="text-primary flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Progress</span>
                            <span className="text-primary tracking-tighter">{Math.round(stats.completionPercentage)}%</span>
                        </div>
                        <div className="w-full bg-primary/10 h-3 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <motion.div 
                              className="bg-primary h-full rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" 
                              initial={{ width: 0 }}
                              animate={{ width: `${stats.completionPercentage}%` }}
                              transition={{ duration: 1, ease: "circOut" }}
                            />
                        </div>
                      </div>
                    </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-40 md:pb-8">
                <div className="max-w-4xl mx-auto">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight uppercase">
                      {activeTab === 'today' ? "Quests" : activeTab === 'habits' ? 'Rituals' : activeTab === 'projects' ? 'Projects' : 'Reminders'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <CalendarDialog 
                        tasks={tasks} 
                        habits={habits}
                        onToggleTask={toggleTaskCompletion}
                        onToggleHabit={toggleHabitCompletion}
                      >
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none group h-11 px-4">
                          <CalendarIcon className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                          Calendar
                        </Button>
                      </CalendarDialog>
                    </div>
                  </div>

                  <div className="min-h-[500px]">
                    <TabsContent value="today" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <TaskView 
                        habits={[]}
                        tasks={tasks}
                        onToggleHabit={toggleHabitCompletion}
                        onUpdateHabit={updateHabit}
                        onDeleteHabit={deleteHabit}
                        onToggleTask={handleToggleTask}
                        onDeleteTask={deleteTask}
                        onEditTask={handleEditTask}
                        onAddSubtask={addSubtask}
                        onToggleSubtask={toggleSubtaskCompletion}
                        setCelebrating={setCelebrating}
                      />
                    </TabsContent>
                    <TabsContent value="habits" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <HabitTracker
                        habits={habits}
                        onAddHabit={addHabit}
                        onUpdateHabit={updateHabit}
                        onToggleHabit={toggleHabitCompletion}
                        onDeleteHabit={deleteHabit}
                      />
                    </TabsContent>
                    <TabsContent value="projects" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <ProjectSection
                        projects={projects}
                        tasks={tasks}
                        onAddProject={addProject}
                        onUpdateProject={updateProject}
                        onDeleteProject={deleteProject}
                        onToggleTask={handleToggleTask}
                        onDeleteTask={deleteTask}
                        onEditTask={handleEditTask}
                        onAddSubtask={addSubtask}
                        onToggleSubtask={toggleSubtaskCompletion}
                        onAddTask={handleAddTask}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={setSelectedProjectId}
                        setCelebrating={setCelebrating}
                      />
                    </TabsContent>
                    <TabsContent value="reminders" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                              <Bell className="h-6 w-6 text-yellow-500" />
                              Reminders
                            </h2>
                            <p className="text-muted-foreground">Stay on track with your journey.</p>
                          </div>
                        </div>
                        <ReminderView 
                          reminders={reminders}
                          onDeleteReminder={deleteReminder}
                          onToggleActive={toggleReminderActive}
                          onEditReminder={handleEditReminder}
                        />
                      </div>
                    </TabsContent>
                  </div>
                </div>
              </main>

              {/* Mobile Navigation (Bottom Bar) */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 bg-card/95 border-t-4 border-border backdrop-blur-md">
                <div className="flex flex-col">
                  <TabsList className="grid w-full grid-cols-5 p-2 h-auto bg-transparent border-0 rounded-none gap-1">
                    <TabsTrigger value="today" className="rounded-xl data-[state=active]:bg-[#58cc02] data-[state=active]:text-white data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-3 h-auto active:translate-y-[2px]">
                      <Sword className="h-6 w-6"/>
                    </TabsTrigger>
                    <TabsTrigger value="habits" className="rounded-xl data-[state=active]:bg-[#6366f1] data-[state=active]:text-white data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-3 h-auto active:translate-y-[2px]">
                      <Flame className="h-6 w-6"/>
                    </TabsTrigger>
                    <div className="flex items-center justify-center">
                        {activeTab === 'habits' ? (
                          <AddHabitDialog onAddHabit={addHabit}>
                            <Button size="icon" className="h-12 w-12 rounded-full bg-[#6366f1] border-b-[#4f46e5] hover:bg-[#4f46e5] text-white shadow-md active:translate-y-0.5 transition-all">
                              <Plus className="h-6 w-6 stroke-[3px]" />
                            </Button>
                          </AddHabitDialog>
                        ) : activeTab === 'projects' && !selectedProjectId ? (
                          <AddProjectDialog onAddProject={addProject}>
                            <Button size="icon" className="h-12 w-12 rounded-full bg-blue-500 border-b-blue-700 hover:bg-blue-600 text-white shadow-md active:translate-y-0.5 transition-all">
                              <Plus className="h-6 w-6 stroke-[3px]" />
                            </Button>
                          </AddProjectDialog>
                        ) : activeTab === 'reminders' ? (
                          <AddReminderDialog onAddReminder={addReminder}>
                            <Button size="icon" className="h-12 w-12 rounded-full bg-yellow-500 border-b-yellow-700 hover:bg-yellow-600 text-white shadow-md active:translate-y-0.5 transition-all">
                              <Plus className="h-6 w-6 stroke-[3px]" />
                            </Button>
                          </AddReminderDialog>
                        ) : (
                          <AddTaskDialog 
                            onAddTask={handleAddTask} 
                            projects={projects}
                            defaultProjectId={selectedProjectId}
                            forceProject={!!selectedProjectId}
                          >
                            <Button size="icon" className="h-12 w-12 rounded-full bg-[#58cc02] border-b-[#46a302] hover:bg-[#46a302] text-white shadow-md active:translate-y-0.5 transition-all">
                              <Plus className="h-6 w-6 stroke-[3px]" />
                            </Button>
                          </AddTaskDialog>
                        )}
                    </div>
                    <TabsTrigger value="projects" className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-3 h-auto active:translate-y-[2px]">
                      <Folder className="h-6 w-6"/>
                    </TabsTrigger>
                    <TabsTrigger value="reminders" className="rounded-xl data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-3 h-auto active:translate-y-[2px]">
                      <Bell className="h-6 w-6"/>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </nav>
            </Tabs>
          )}
      </div>
      {taskToEdit && (
        <EditTaskDialog
          isOpen={!!taskToEdit}
          onClose={() => setTaskToEdit(null)}
          onEditTask={handleUpdateTask}
          task={taskToEdit}
          projects={projects}
        />
      )}
      {reminderToEdit && (
        <EditReminderDialog
          isOpen={!!reminderToEdit}
          onClose={() => setReminderToEdit(null)}
          onEditReminder={handleUpdateReminder}
          reminder={reminderToEdit}
        />
      )}
      <UnifiedAddButton 
        onAddTask={handleAddTask}
        onAddHabit={addHabit}
        onAddProject={addProject}
        onAddReminder={addReminder}
        projects={projects}
        className="hidden md:flex fixed bottom-8 right-6 h-16 w-16 rounded-full shadow-2xl bg-[#58cc02] hover:bg-[#46a302] text-white border-b-[6px] border-[#46a302] active:border-b-0 active:translate-y-1 transition-all items-center justify-center z-50"
      />
    </div>
  );
}
