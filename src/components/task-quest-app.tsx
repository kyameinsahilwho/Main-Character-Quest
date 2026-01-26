"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react';
import Header from '@/components/header';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";
import { useTasks } from '@/hooks/use-tasks';
import { useHabits } from '@/hooks/use-habits';
import { useReminders } from '@/hooks/use-reminders';
import { useNotifications } from '@/hooks/use-notifications';
import { TaskView } from '@/components/task-view';
import { ArchiveView } from '@/components/archive-view';
import { HabitTracker } from '@/components/habit-tracker';
import ProjectSection from '@/components/project-section';
import { SocialSection } from '@/components/social-section';
import { QuickAddMenu } from '@/components/quick-add-menu';
import { EditTaskDialog } from '@/components/edit-task-dialog';
import { EditReminderDialog } from '@/components/edit-reminder-dialog';
import { CalendarDialog } from '@/components/calendar-dialog';
import { User, Task, Reminder } from '@/lib/types';
import { calculateLevel, XP_PER_TASK } from '@/lib/level-system';

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

// Layout components
import { DesktopSidebar, MobileBottomNav, LoadingSkeleton } from '@/components/layout';

// Lazy load Confetti for better initial load performance
const Confetti = lazy(() => import('react-confetti'));

export default function TaskQuestApp() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();
  const userData = useQuery(api.users.viewer);
  const updateSettingsMutation = useMutation(api.users.updateSettings);
  const storeUser = useMutation(api.users.store);
  const { toast } = useToast();

  // Store user on auth
  useEffect(() => {
    if (isAuthenticated) {
      storeUser().then((id) => {
        console.log("User stored/synced with ID:", id);
      }).catch((error) => {
        console.error("Failed to store user:", error);
        toast({
          title: "Authentication Sync Error",
          description: "Could not sync user data. Please try refreshing.",
          variant: "destructive"
        });
      });
    }
  }, [isAuthenticated, storeUser, toast]);

  const user: User | null = useMemo(() => {
    if (!userData) return null;
    return {
      id: userData._id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
    };
  }, [userData]);

  // Hooks
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
  } = useTasks();

  const {
    habits,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    deleteHabit,
  } = useHabits();

  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderActive,
    triggerReminder,
  } = useReminders();

  const {
    permission,
    isSupported,
    subscription,
    subscribeToPush,
    unsubscribeFromPush
  } = useNotifications(tasks, habits, reminders, triggerReminder);

  // State
  const [isCelebrating, setCelebrating] = useState(false);
  const [windowSize, setWindowSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when switching tabs
  useEffect(() => {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    });
  }, [activeTab]);

  // Clear selected project when switching tabs
  useEffect(() => {
    if (activeTab !== 'projects') {
      setSelectedProjectId(null);
    }
  }, [activeTab]);

  // Calculate level info
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

  // Sync user settings to Convex
  useEffect(() => {
    if (user && !isInitialLoad && levelInfo) {
      const syncSettings = async () => {
        try {
          await updateSettingsMutation({
            totalXP: levelInfo.totalXP,
            level: levelInfo.level,
            currentStreak: streaks.current,
            longestStreak: streaks.longest,
            tasksCompleted: stats.completedTasks,
          });
        } catch (error) {
          console.error('Error syncing user settings:', error);
        }
      };

      const timer = setTimeout(syncSettings, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isInitialLoad, levelInfo.totalXP, levelInfo.level, streaks, stats.completedTasks, updateSettingsMutation]);

  // Window resize for confetti
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Confetti timeout
  useEffect(() => {
    if (isCelebrating) {
      const timer = setTimeout(() => setCelebrating(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);

  // Callbacks
  const handleToggleTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.isCompleted) {
      toggleTaskCompletion(taskId);
      toast({
        title: "Quest Undone",
        description: "Quest moved back to active list.",
      });
    } else {
      toggleTaskCompletion(taskId);
    }
  }, [tasks, toggleTaskCompletion, toast]);

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
    <div className="flex h-[100dvh] w-full font-body transition-colors duration-500 bg-background overflow-hidden">
      {isCelebrating && (
        <Suspense fallback={null}>
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />
        </Suspense>
      )}

      {(isInitialLoad || authLoading) ? (
        <LoadingSkeleton />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 w-full overflow-hidden">
          {/* Desktop Sidebar */}
          <DesktopSidebar
            levelInfo={levelInfo}
            completionPercentage={stats.completionPercentage}
          />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            <Header
              stats={{ ...stats, levelInfo }}
              streaks={streaks}
              isInitialLoad={isInitialLoad}
              user={user}
              onSignOut={signOut}
              isSyncing={false}
              isAuthenticated={isAuthenticated}
              notificationState={{
                permission,
                isSupported,
                subscription,
                subscribeToPush,
                unsubscribeFromPush
              }}
            />

            {/* Scrollable Content */}
            <div ref={mainRef} className="flex-1 overflow-y-auto p-4 pb-32 md:p-8">
              <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
                {/* Page Title & Actions */}
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tight">
                    {activeTab === 'today' ? "Quests" : activeTab === 'habits' ? 'Rituals' : activeTab === 'projects' ? 'Projects' : activeTab === 'social' ? 'Squad' : 'Archive'}
                  </h1>
                  <CalendarDialog
                    tasks={tasks}
                    habits={habits}
                    onToggleTask={toggleTaskCompletion}
                    onToggleHabit={toggleHabitCompletion}
                  >
                    <button className="bg-card hover:bg-muted/50 border-2 border-border text-foreground font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-3d active:shadow-none active:translate-y-1 transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">calendar_month</span>
                      Calendar
                    </button>
                  </CalendarDialog>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
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
                  <TabsContent value="archive" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ArchiveView
                      habits={habits}
                      tasks={tasks}
                      onUnarchiveHabit={(id) => updateHabit(id, { archived: false })}
                      onDeleteHabit={deleteHabit}
                      onDeleteTask={deleteTask}
                      onToggleTask={handleToggleTask}
                      onEditTask={handleEditTask}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtaskCompletion}
                      setCelebrating={setCelebrating}
                    />
                  </TabsContent>
                  <TabsContent value="social" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SocialSection />
                  </TabsContent>
                </div>
              </div>
            </div>

            {/* Quick Add Menu (FAB) */}
            <QuickAddMenu
              projects={projects}
              selectedProjectId={selectedProjectId}
              onAddTask={handleAddTask}
              onAddHabit={addHabit}
              onAddProject={addProject}
              isOpen={isQuickAddOpen}
              onOpenChange={setIsQuickAddOpen}
            />
          </main>

          {/* Mobile Navigation */}
          <MobileBottomNav
            activeTab={activeTab}
            isQuickAddOpen={isQuickAddOpen}
            onToggleQuickAdd={() => setIsQuickAddOpen(prev => !prev)}
          />
        </Tabs>
      )}

      {/* Dialogs */}
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
    </div>
  );
}
