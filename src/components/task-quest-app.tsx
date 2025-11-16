"use client";

import { useState, useEffect, useMemo } from 'react';
import Confetti from 'react-confetti';
import { Plus, ListPlus } from 'lucide-react';
import Header from '@/components/header';
import StatsPanel from '@/components/stats-panel';
import TaskList from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { Skeleton } from './ui/skeleton';
import OverallProgress from './overall-progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Task } from '@/lib/types';
import { EditTaskDialog } from './edit-task-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from './ui/button';
import { AutomatedTasksPopover } from './automated-tasks-popover';
import { CalendarSection } from './calendar-section';

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
    updateTask,
    isInitialLoad,
    addAutomatedTasksToToday,
  } = useTasks();

  const [isCelebrating, setCelebrating] = useState(false);
  const [windowSize, setWindowSize] = useState<{width: number, height: number}>({width: 0, height: 0});
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState("active");

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

  const { activeTasks, completedTasks, automatedTasks } = useMemo(() => {
    const active = tasks.filter(task => !task.isCompleted && !task.isAutomated);
    const completed = tasks.filter(task => task.isCompleted && !task.isAutomated);
    const automated = tasks.filter(task => task.isAutomated);
    return { activeTasks: active, completedTasks: completed, automatedTasks: automated };
  }, [tasks]);

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
  }

  const handleUpdateTask = (updatedTaskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, updatedTaskData);
      setTaskToEdit(null);
    }
  }

  const handleAddTask = (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => {
    const isAutomated = activeTab === 'automated';
    addTask({ ...taskData, isAutomated });
  }

  const MainContent = () => {
    if (isInitialLoad) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-headline mb-4"><Skeleton className="h-8 w-32" /></h2>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )
    }
    return (
        <div className="w-full">
            <CalendarSection tasks={tasks} />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className='flex flex-col md:flex-row justify-between items-center mb-4 gap-4'>
                <TabsList className="grid w-full md:w-fit grid-cols-3">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="automated">Automated</TabsTrigger>
                </TabsList>
                 <div className="flex w-full md:w-auto items-center gap-2 flex-col md:flex-row">
                    {activeTab === 'active' && (
                         <AutomatedTasksPopover
                            tasks={automatedTasks}
                            onAddTasks={addAutomatedTasksToToday}
                        >
                            <Button variant="outline" className="w-full">
                                <ListPlus className="mr-2 h-4 w-4" />
                                Add from Automated
                            </Button>
                        </AutomatedTasksPopover>
                    )}
                    <AddTaskDialog onAddTask={handleAddTask}>
                        <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
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
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      {isCelebrating && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />}
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <MainContent />
        </div>
        <aside className="hidden w-80 border-l border-border bg-card/50 p-6 lg:block">
          <StatsPanel stats={stats} streaks={streaks} isInitialLoad={isInitialLoad} />
        </aside>
        <OverallProgress completionPercentage={stats.completionPercentage} isInitialLoad={isInitialLoad} />
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
