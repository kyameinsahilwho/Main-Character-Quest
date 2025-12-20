"use client";

import { cn } from "@/lib/utils";
import { Habit } from "@/lib/types";
import { HabitItem } from "./habit-item";
import { AddHabitDialog } from "./add-habit-dialog";
import { Button } from "./ui/button";
import { Plus, Flame, Target, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { RitualStats } from "./ritual-stats";

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (habitData: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>) => void;
  onUpdateHabit: (id: string, habitData: Partial<Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>>) => void;
  onToggleHabit: (habitId: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
}

export function HabitTracker({ habits, onAddHabit, onUpdateHabit, onToggleHabit, onDeleteHabit }: HabitTrackerProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  if (selectedHabit) {
    return <RitualStats habit={selectedHabit} onBack={() => setSelectedHabitId(null)} />;
  }

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
  const monthlyHabits = habits.filter(h => h.frequency === 'monthly');

  const renderHabitList = (title: string, habitsList: Habit[]) => {
    if (habitsList.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8c7b60]/60 ml-2">
          {title}
        </h3>
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {habitsList.map((habit) => (
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
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black font-headline text-[#4a4a4a] uppercase tracking-[0.2em] flex items-center gap-4 flex-1">
          <span className="px-4 py-2 rounded-xl bg-[#faf7ed] border-2 border-b-4 border-[#e8e2c8] text-[#5c4d3c]">Daily Rituals</span>
          <div className="h-1 flex-1 bg-[#e8e2c8]" />
        </h2>
      </div>

      <div className="flex flex-col gap-10">
        {habits.length > 0 ? (
          <>
            {renderHabitList("Daily", dailyHabits)}
            {renderHabitList("Weekly", weeklyHabits)}
            {renderHabitList("Monthly", monthlyHabits)}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center text-center gap-4 bg-[#faf7ed]/30 rounded-3xl border-2 border-b-8 border-dashed border-[#e8e2c8]"
          >
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-2 border-b-4 border-[#e8e2c8] shadow-inner">
              <Target className="w-10 h-10 text-[#d0c8a0]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#5c4d3c] uppercase tracking-tight">No Rituals Yet</h3>
              <p className="text-[#8c7b60]/60 font-medium">Start your journey by adding your first daily ritual.</p>
            </div>
            <AddHabitDialog onAddHabit={onAddHabit}>
              <Button variant="outline" className="mt-4 border-2 border-b-[6px] border-[#e8e2c8] bg-[#faf7ed] text-[#5c4d3c] hover:bg-white hover:border-[#8c7b60] font-black uppercase tracking-widest active:translate-y-[2px] active:border-b-[4px] transition-all rounded-xl h-auto py-3 relative overflow-hidden">
                {/* 3D Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/60 z-10 pointer-events-none" />
                Create Ritual
              </Button>
            </AddHabitDialog>
          </motion.div>
        )}
      </div>
    </div>
  );
}
