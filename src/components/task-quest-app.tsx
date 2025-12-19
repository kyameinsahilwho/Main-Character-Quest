"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Plus, ListPlus, LogOut, User as UserIcon, Sword, CheckCircle2, Bot, Menu, Star } from 'lucide-react';
import { motion } from 'framer-motion';
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
import { TemplateTasksPopover } from './template-tasks-popover';
import { CalendarDialog } from './calendar-dialog';
import { CalendarIcon, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateLevel, XP_PER_TASK } from '@/lib/level-system';
import { useToast } from '@/hooks/use-toast';
import ProjectSection from './project-section';

// Lazy load Confetti for better initial load performance
const Confetti = lazy(() => import('react-confetti'));


export default function TaskQuestApp() {
  const { user, isLoading: authLoading, isSyncing, syncLocalToSupabase, signOut } = useSupabaseSync();
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
    addTemplatesToToday,
    reloadFromSupabase,
  } = useTasks(user);

  const [isCelebrating, setCelebrating] = useState(false);
  const [windowSize, setWindowSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    if (syncComplete) {
       toast({
         title: "Sync Complete",
         description: "Your quests are saved to the cloud.",
       })
    }
  }, [syncComplete, toast]);

  const levelInfo = useMemo(() => {
    const totalXP = tasks.reduce((acc, task) => {
      if (task.isCompleted && !task.isTemplate) {
        return acc + (task.xp || XP_PER_TASK);
      }
      return acc;
    }, 0);
    return calculateLevel(totalXP);
  }, [tasks]);

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
  const { activeTasks, completedTasks, templateTasks } = useMemo(() => {
    const active = tasks.filter(task => !task.isCompleted && !task.isTemplate);
    const completed = tasks.filter(task => task.isCompleted && !task.isTemplate);
    const templates = tasks.filter(task => task.isTemplate);
    return { activeTasks: active, completedTasks: completed, templateTasks: templates };
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
    const isTemplate = activeTab === 'templates';
    addTask({ ...taskData, isTemplate });
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
              <aside className="hidden md:flex w-72 flex-col gap-6 p-6 border-r-4 border-border bg-card/50 backdrop-blur-md z-10">
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] ml-1">Navigation</p>
                  <TabsList className="flex flex-col h-auto bg-transparent border-0 p-0 gap-3 w-full">
                    <AddTaskDialog onAddTask={handleAddTask} projects={projects}>
                      <Button className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-[#58cc02] bg-[#58cc02] text-white hover:bg-[#46a302] transition-all duration-200 group rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[4px] mb-2">
                        <Plus className="mr-3 h-6 w-6 stroke-[4px]" />
                        <span className="font-black tracking-wide">New Quest</span>
                      </Button>
                    </AddTaskDialog>

                    <TabsTrigger value="active" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-[#9D4EDD] data-[state=active]:text-white data-[state=active]:border-[#9D4EDD] data-[state=active]:border-b-[#7B2CBF] data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                      <Sword className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                      <span className="font-black tracking-wide">Active Quests</span>
                      {activeTasks.length > 0 && (
                        <span className="ml-auto bg-muted text-muted-foreground group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          {activeTasks.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:border-secondary data-[state=active]:border-b-[#1899d6] data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                      <CheckCircle2 className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                      <span className="font-black tracking-wide">Completed</span>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=active]:border-b-blue-700 data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                      <Folder className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                      <span className="font-black tracking-wide">Projects</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="w-full justify-start px-4 py-3 h-auto text-base border-2 border-b-[6px] border-border bg-card hover:bg-accent/5 transition-all duration-200 group rounded-2xl shadow-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-accent data-[state=active]:border-b-[#c49b00] data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] active:translate-y-[2px] active:border-b-[4px]">
                      <Bot className="mr-3 h-5 w-5 group-data-[state=active]:animate-bounce-subtle" />
                      <span className="font-black tracking-wide">Templates</span>
                    </TabsTrigger>
                  </TabsList>
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
              <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-32 md:pb-8">
                <div className="max-w-4xl mx-auto">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight uppercase">
                      {activeTab === 'active' ? 'Active Quests' : activeTab === 'completed' ? 'Completed' : activeTab === 'projects' ? 'Projects' : 'Templates'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <CalendarDialog tasks={tasks}>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none group h-11 px-4">
                          <CalendarIcon className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                          Calendar
                        </Button>
                      </CalendarDialog>
                      
                      {activeTab === 'active' && (
                        <TemplateTasksPopover tasks={templateTasks} onAddTasks={addTemplatesToToday}>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none group h-11 px-4">
                            <ListPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Templates
                          </Button>
                        </TemplateTasksPopover>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[500px]">
                    <TabsContent value="active" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <TabsContent value="completed" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <TabsContent value="projects" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <ProjectSection
                        projects={projects}
                        tasks={tasks}
                        onAddProject={addProject}
                        onUpdateProject={updateProject}
                        onDeleteProject={deleteProject}
                        onToggleTask={toggleTaskCompletion}
                        onDeleteTask={deleteTask}
                        onEditTask={handleEditTask}
                        onAddSubtask={addSubtask}
                        onToggleSubtask={toggleSubtaskCompletion}
                      />
                    </TabsContent>
                    <TabsContent value="templates" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <TaskList
                        tasks={templateTasks}
                        listType='templates'
                        onToggleTask={toggleTaskCompletion}
                        onDeleteTask={deleteTask}
                        onEditTask={handleEditTask}
                        onAddSubtask={addSubtask}
                        onToggleSubtask={toggleSubtaskCompletion}
                        setCelebrating={setCelebrating}
                      />
                    </TabsContent>
                  </div>
                </div>
              </main>

              {/* Mobile Tabs (Bottom) */}
              <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex justify-center">
                 <TabsList className="grid w-full grid-cols-5 bg-background/90 backdrop-blur-xl p-1.5 rounded-[2rem] border-2 border-b-[6px] border-border shadow-2xl h-auto">
                    <TabsTrigger value="active" className="rounded-[1.5rem] data-[state=active]:bg-[#9D4EDD] data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-bold py-4 h-auto active:translate-y-[2px]">
                      <Sword className="h-6 w-6"/>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="rounded-[1.5rem] data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-4 h-auto active:translate-y-[2px]">
                      <Folder className="h-6 w-6"/>
                    </TabsTrigger>
                    <AddTaskDialog onAddTask={handleAddTask} projects={projects}>
                      <Button variant="ghost" className="rounded-[1.5rem] bg-[#58cc02] text-white shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-4 h-full w-full active:translate-y-[2px] hover:bg-[#46a302] border-b-4 border-[#46a302]">
                        <Plus className="h-7 w-7 stroke-[4px]"/>
                      </Button>
                    </AddTaskDialog>
                    <TabsTrigger value="completed" className="rounded-[1.5rem] data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-4 h-auto active:translate-y-[2px]">
                      <CheckCircle2 className="h-6 w-6"/>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="rounded-[1.5rem] data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.3)] transition-all font-bold py-4 h-auto active:translate-y-[2px]">
                      <Bot className="h-6 w-6"/>
                    </TabsTrigger>
                 </TabsList>
              </div>
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
    </div>
  );
}
