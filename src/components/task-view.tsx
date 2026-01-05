"use client";

import { useState } from "react";
import { Habit, Task } from "@/lib/types";
import { HabitItem } from "./habit-item";
import TaskList from "./task-list";
import { isHabitDueToday } from "@/lib/utils";
import { isBefore, isSameDay, startOfDay, parseISO, format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { RitualStats } from "./ritual-stats";

interface TaskViewProps {
  habits: Habit[];
  tasks: Task[];
  onToggleHabit: (id: string, date: string) => void;
  onUpdateHabit: (id: string, data: any) => void;
  onDeleteHabit: (id: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (id: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => any;
  setCelebrating: (val: boolean) => void;
}

export function TaskView({
  habits,
  tasks,
  onToggleHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  onToggleSubtask,
  setCelebrating
}: TaskViewProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  if (selectedHabit) {
    return <RitualStats habit={selectedHabit} onBack={() => setSelectedHabitId(null)} />;
  }
  
  const todaysHabits = habits.filter(isHabitDueToday);
  
  const today = startOfDay(new Date());
  
  const activeTasks = tasks.filter(task => !task.isCompleted);

  const todaysTasks = activeTasks.filter(task => {
    if (!task.dueDate) return false; // No due date = backlog
    const due = startOfDay(parseISO(task.dueDate));
    return isSameDay(due, today) || isBefore(due, today); // Today or Overdue
  });

  const upcomingTasks = activeTasks.filter(task => {
    if (!task.dueDate) return false;
    const due = startOfDay(parseISO(task.dueDate));
    return !isSameDay(due, today) && !isBefore(due, today);
  });

  // Group upcoming tasks by date
  const upcomingTasksByDate = upcomingTasks.reduce((acc, task) => {
    const dateKey = task.dueDate!;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(upcomingTasksByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-8 pb-20">
      {/* Habits Section */}
      {todaysHabits.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-black font-headline uppercase tracking-widest text-muted-foreground/80 px-1">
            Rituals
          </h2>
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {todaysHabits.map(habit => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggleHabit}
                  onUpdate={onUpdateHabit}
                  onDelete={onDeleteHabit}
                  onViewStats={setSelectedHabitId}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <div className="space-y-4">
        {/* Tasks Section */}
        <section className="space-y-4">

            {todaysTasks.length > 0 ? (
              <TaskList
                tasks={todaysTasks}
                listType="active"
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                onEditTask={onEditTask}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                setCelebrating={setCelebrating}
              />
            ) : (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <p className="font-bold">No quests due today.</p>
                <p className="text-sm opacity-70">Check your backlog or add a new quest!</p>
              </div>
            )}
        </section>

        {/* Upcoming Quests Section */}
        {sortedDates.length > 0 && (
          <section className="space-y-4">
            {sortedDates.map(date => (
              <div key={date} className="space-y-2">

                <TaskList
                  tasks={upcomingTasksByDate[date]}
                  listType="active"
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onEditTask={onEditTask}
                  onAddSubtask={onAddSubtask}
                  onToggleSubtask={onToggleSubtask}
                  setCelebrating={setCelebrating}
                />
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
