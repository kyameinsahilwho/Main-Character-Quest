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

  return (
    <div className="space-y-8 pb-32">
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
          <div className="border-2 border-b-[6px] border-muted-foreground/20 rounded-[2rem] bg-card/40 flex items-center p-5 gap-4">
            <div className="h-9 w-9 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-muted-foreground/60">No quests due today</p>
              <p className="text-sm text-muted-foreground/40">Add a quest or check your backlog</p>
            </div>
          </div>
        )}
      </section>

      {/* Upcoming Quests Section */}
      {upcomingTasks.length > 0 && (
        <section className="space-y-6 pt-4">
          <TaskList
            tasks={upcomingTasks}
            listType="active"
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            setCelebrating={setCelebrating}
          />
        </section>
      )}
    </div>
  );
}
