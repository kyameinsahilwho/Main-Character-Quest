"use client";

import { useState } from "react";
import { Habit, Task } from "@/lib/types";
import { HabitItem } from "./habit-item";
import TaskList from "./task-list";
import { isHabitDueToday } from "@/lib/utils";
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
  
  const activeTasks = tasks.filter(task => !task.isCompleted);

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

      {/* Tasks Section */}
      <section className="space-y-4">
        <TaskList
          tasks={activeTasks}
          listType="active"
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          setCelebrating={setCelebrating}
        />
      </section>
    </div>
  );
}
