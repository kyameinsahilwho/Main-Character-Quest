"use client";

import { cn } from "@/lib/utils";
import { Habit } from "@/lib/types";
import { HabitItem } from "./habit-item";
import { AddHabitDialog } from "./add-habit-dialog";
import { Button } from "./ui/button";
import { Plus, Flame, Target, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { RitualStats } from "./ritual-stats";
import { startOfDay, parseISO, differenceInCalendarDays } from "date-fns";

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (habitData: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>) => void;
  onUpdateHabit: (id: string, habitData: Partial<Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>>) => void;
  onToggleHabit: (habitId: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
}

export function HabitTracker({ habits, onAddHabit, onUpdateHabit, onToggleHabit, onDeleteHabit }: HabitTrackerProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Reset scroll position when switching between list and stats
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  }, [selectedHabitId]);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  if (selectedHabit) {
    return <RitualStats habit={selectedHabit} onBack={() => setSelectedHabitId(null)} />;
  }

  const today = new Date();
  const dayOfWeek = today.getDay();

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
  const monthlyHabits = habits.filter(h => h.frequency === 'monthly');
  
  const intervalHabits = habits.filter(h => {
    if (!['every_2_days', 'every_3_days', 'every_4_days'].includes(h.frequency)) return false;
    if (showAll) return true;
    
    const interval = parseInt(h.frequency.split('_')[1]);
    const startDate = startOfDay(parseISO(h.createdAt));
    const diffDays = differenceInCalendarDays(startOfDay(today), startDate);
    return diffDays >= 0 && diffDays % interval === 0;
  });

  const specificDayHabits = habits.filter(h => {
    if (h.frequency !== 'specific_days') return false;
    if (showAll) return true;
    return h.customDays?.includes(dayOfWeek);
  });

  const isAnyHabitVisible = dailyHabits.length > 0 || 
                            specificDayHabits.length > 0 || 
                            intervalHabits.length > 0 || 
                            weeklyHabits.length > 0 || 
                            monthlyHabits.length > 0;

  const renderHabitList = (title: string, habitsList: Habit[]) => {
    if (habitsList.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 ml-2">
          <div className="h-px flex-1 bg-[#E2E8F0]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]/40 whitespace-nowrap">
            {title} Rituals
          </h3>
          <div className="h-px flex-1 bg-[#E2E8F0]" />
        </div>
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
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black font-headline text-[#334155] uppercase tracking-[0.2em] flex items-center gap-4 flex-1">
          <span className="px-4 py-2 rounded-xl bg-[#F1F4F9] border-2 border-b-4 border-[#E2E8F0] text-[#1E293B]">My Rituals</span>
          
          <div 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center bg-[#F1F4F9] p-1.5 rounded-xl border-2 border-[#E2E8F0] gap-1 cursor-pointer select-none"
          >
            <div
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150",
                !showAll ? "text-[#1E293B] bg-white border-2 border-b-4 border-[#E2E8F0] shadow-sm" : "text-[#64748B]"
              )}
            >
              Today
            </div>
            <div
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150",
                showAll ? "text-[#1E293B] bg-white border-2 border-b-4 border-[#E2E8F0] shadow-sm" : "text-[#64748B]"
              )}
            >
              All
            </div>
          </div>

          <div className="h-1 flex-1 bg-[#E2E8F0]" />
        </h2>
      </div>

      <div className="flex flex-col gap-12">
        {habits.length > 0 ? (
          isAnyHabitVisible ? (
            <>
              {renderHabitList("Daily", dailyHabits)}
              {renderHabitList("Custom Schedule", specificDayHabits)}
              {renderHabitList("Interval", intervalHabits)}
              {renderHabitList("Weekly", weeklyHabits)}
              {renderHabitList("Monthly", monthlyHabits)}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 max-w-md mx-auto flex flex-col items-center justify-center text-center gap-6 bg-[#F1F4F9]/30 rounded-[3rem] border-2 border-b-8 border-dashed border-[#E2E8F0]"
            >
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-2 border-b-4 border-[#E2E8F0] shadow-inner">
                <Flame className="w-10 h-10 text-[#CBD5E1]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tight">Rest Day!</h3>
                <p className="text-[#64748B]/60 font-medium">No rituals scheduled for today. Enjoy your break!</p>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-28 max-w-md mx-auto flex flex-col items-center justify-center text-center gap-6 bg-[#F1F4F9]/30 rounded-[3rem] border-2 border-b-8 border-dashed border-[#E2E8F0]"
          >
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-2 border-b-4 border-[#E2E8F0] shadow-inner">
              <Target className="w-12 h-12 text-[#CBD5E1]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight">No Rituals Yet</h3>
              <p className="text-[#64748B]/60 font-medium">Start your journey by adding your first daily ritual.</p>
            </div>
            <AddHabitDialog onAddHabit={onAddHabit}>
              <Button className="mt-4 border-2 border-b-[6px] border-[#4f46e5] bg-[#6366f1] text-white hover:bg-[#818cf8] hover:border-[#6366f1] font-black uppercase tracking-widest active:translate-y-[2px] active:border-b-[4px] transition-all rounded-2xl h-auto py-5 px-10 text-lg relative overflow-hidden">
                {/* 3D Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/40 z-10 pointer-events-none" />
                Create Ritual
              </Button>
            </AddHabitDialog>
          </motion.div>
        )}
      </div>
    </div>
  );
}
