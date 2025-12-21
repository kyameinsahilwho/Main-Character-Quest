"use client";

import { Habit } from "@/lib/types";
import { Button } from "./ui/button";
import { ArrowLeft, Trophy, Flame, Target, Calendar as CalendarIcon, CheckCircle2, CircleDashed } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { parseISO, startOfDay, isSameWeek, isSameMonth, subDays, startOfWeek, startOfMonth } from "date-fns";

interface RitualStatsProps {
  habit: Habit;
  onBack: () => void;
}

export function RitualStats({ habit, onBack }: RitualStatsProps) {
  // Calculate stats
  const completionDates = habit.completions.map(c => startOfDay(parseISO(c.completedAt)));
  
  // Frequency-aware completion calculation
  const getCompletionRate = () => {
    if (habit.frequency === 'daily') {
      return Math.min(100, Math.round((habit.currentStreak / habit.targetDays) * 100));
    }
    
    const now = new Date();
    const currentPeriodCompletions = habit.completions.filter(c => {
      const date = parseISO(c.completedAt);
      return habit.frequency === 'weekly' 
        ? isSameWeek(date, now, { weekStartsOn: 0 })
        : isSameMonth(date, now);
    }).length;

    return Math.min(100, Math.round((currentPeriodCompletions / habit.targetDays) * 100));
  };

  const getTotalCompletions = () => habit.completions.length;

  const getHabitAccentColorHex = (colorStr?: string) => {
    // Duolingo Blue as default
    if (!colorStr) return "hsl(199, 92%, 54%)";
    if (colorStr.includes("blue")) return "hsl(217, 91%, 60%)";
    if (colorStr.includes("purple")) return "hsl(271, 91%, 65%)";
    if (colorStr.includes("cyan")) return "hsl(188, 86%, 53%)";
    if (colorStr.includes("rose")) return "hsl(341, 81%, 62%)";
    if (colorStr.includes("amber")) return "hsl(38, 92%, 50%)";
    if (colorStr.includes("indigo")) return "hsl(239, 84%, 67%)";
    return "hsl(199, 92%, 54%)";
  };

  const accentColor = getHabitAccentColorHex(habit.color);

  const modifiers = {
    completed: completionDates
  };
  
  const modifiersStyles = {
    completed: {
      backgroundColor: accentColor,
      color: "white",
      fontWeight: "bold",
      borderRadius: "50%"
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-12 h-12 rounded-2xl border-2 border-b-4 border-[#E2E8F0] hover:bg-[#F1F4F9] text-[#1E293B] active:border-b-0 active:translate-y-1 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-3xl font-black text-[#1E293B] uppercase tracking-tight flex items-center gap-3">
              <span className="text-4xl">{habit.icon || <CircleDashed className="w-10 h-10 text-gray-300" />}</span>
              {habit.title}
            </h2>
            <p className="text-[#64748B]/60 font-black uppercase tracking-[0.2em] text-xs">Ritual Statistics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak/Frequency Cards */}
        <div className="bg-white border-2 border-b-8 border-[#E2E8F0] p-6 rounded-[2rem] flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-3 text-orange-500">
            <Flame className="w-6 h-6 fill-orange-500" />
            <span className="text-xs font-black uppercase tracking-widest">
              {habit.frequency === 'daily' ? 'Current Streak' : `${habit.frequency} Progress`}
            </span>
          </div>
          <div className="text-5xl font-black text-[#1E293B]">
            {habit.frequency === 'daily' ? habit.currentStreak : `${getCompletionRate()}%`}
            <span className="text-xl text-gray-300 uppercase ml-2">
              {habit.frequency === 'daily' ? 'Days' : 'Done'}
            </span>
          </div>
        </div>

        <div className="bg-white border-2 border-b-8 border-[#E2E8F0] p-6 rounded-[2rem] flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-3 text-[#1E293B]">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest">Total Achieved</span>
          </div>
          <div className="text-5xl font-black text-[#1E293B]">
            {getTotalCompletions()}
            <span className="text-xl text-gray-300 uppercase ml-2">Times</span>
          </div>
        </div>

        <div className="bg-[#F1F4F9] border-2 border-b-8 border-[#E2E8F0] p-6 rounded-[2rem] flex flex-col justify-center items-center text-center gap-4 shadow-sm">
             <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-2 border-b-4 border-[#E2E8F0]">
                <Target className="w-10 h-10 text-[#1E293B]" />
             </div>
             <div>
                <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tight">Keep it up!</h3>
                <p className="text-[#64748B]/60 font-medium mt-1 text-sm">Consistency is key to mastery.</p>
             </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white border-2 border-b-8 border-[#E2E8F0] p-8 rounded-[3rem] shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F1F4F9] border-2 border-b-4 border-[#E2E8F0] flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-[#1E293B]" />
            </div>
            Completion History
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-[#F1F4F9] border border-[#E2E8F0]" />
              <span className="text-xs font-bold text-gray-400">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-[#1E293B] border border-[#0F172A] shadow-sm" />
              <span className="text-xs font-bold text-gray-400">Achieved</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center p-4 bg-[#F1F4F9]/30 rounded-3xl border-2 border-b-4 border-[#F1F4F9]">
          <Calendar
            mode="multiple"
            selected={completionDates}
            className="rounded-md border-none"
            classNames={{
              day_today: "bg-[#F1F4F9] text-[#1E293B] font-black rounded-full border-2 border-[#E2E8F0]",
              day_selected: "rounded-full border-2 shadow-sm opacity-100 hover:opacity-100",
              head_cell: "text-[#64748B]/60 font-black uppercase tracking-widest text-[10px]",
              nav_button: "border-2 border-b-4 border-[#E2E8F0] hover:bg-[#F1F4F9] text-[#1E293B] rounded-xl transition-all",
            }}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </div>
      </div>
    </div>
  );
}
