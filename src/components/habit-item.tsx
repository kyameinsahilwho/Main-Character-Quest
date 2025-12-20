"use client";

import { useState, useRef } from "react";
import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Trash2, Flame, Trophy, BarChart2, Edit2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, startOfDay, startOfMonth, endOfMonth, isSameMonth, isSameWeek } from "date-fns";
import { EditHabitDialog } from "./edit-habit-dialog";
import confetti from 'canvas-confetti';
import { playCompletionSound } from "@/lib/sounds";

interface HabitItemProps {
  habit: Habit;
  onToggle: (habitId: string, date: string) => void;
  onUpdate: (id: string, habitData: Partial<Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>>) => void;
  onDelete: (id: string) => void;
  onViewStats: (habitId: string) => void;
}

export function HabitItem({ habit, onToggle, onUpdate, onDelete, onViewStats }: HabitItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Daily view
  const currentWeek = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 0 }),
    end: endOfWeek(new Date(), { weekStartsOn: 0 }),
  });

  // Frequency-aware status
  const now = new Date();
  const periodCompletions = habit.completions.filter(c => {
    const date = parseISO(c.completedAt);
    return habit.frequency === 'weekly' 
      ? isSameWeek(date, now, { weekStartsOn: 0 })
      : isSameMonth(date, now);
  }).length;

  const isCompletedToday = habit.completions.some(c => 
    isToday(parseISO(c.completedAt))
  );

  const isPeriodTargetMet = periodCompletions >= habit.targetDays;

  const getHabitCardAesthetics = (colorStr?: string) => {
    if (!colorStr) return {
      card: "bg-white border-[#e8e2c8] hover:border-[#d0c8a0]",
      checkbox: "bg-[#5c4d3c] border-[#3e3428] shadow-[#d6d3c9]",
      iconBg: "bg-[#faf7ed] border-[#e8e2c8]"
    };

    const match = colorStr.match(/bg-([a-z]+)-500/);
    if (match && match[1]) {
      const color = match[1];
      const themes: Record<string, { card: string; checkbox: string; iconBg: string }> = {
        blue: {
          card: "bg-blue-50/30 border-blue-100 hover:border-blue-200",
          checkbox: "bg-blue-500 border-blue-700 shadow-blue-100",
          iconBg: "bg-blue-50 border-blue-100"
        },
        purple: {
          card: "bg-purple-50/30 border-purple-100 hover:border-purple-200",
          checkbox: "bg-purple-500 border-purple-700 shadow-purple-100",
          iconBg: "bg-purple-50 border-purple-100"
        },
        cyan: {
          card: "bg-cyan-50/30 border-cyan-100 hover:border-cyan-200",
          checkbox: "bg-cyan-500 border-cyan-700 shadow-cyan-100",
          iconBg: "bg-cyan-50 border-cyan-100"
        },
        rose: {
          card: "bg-rose-50/30 border-rose-100 hover:border-rose-200",
          checkbox: "bg-rose-500 border-rose-700 shadow-rose-100",
          iconBg: "bg-rose-50 border-rose-100"
        },
        amber: {
          card: "bg-amber-50/30 border-amber-100 hover:border-amber-200",
          checkbox: "bg-amber-500 border-amber-700 shadow-amber-100",
          iconBg: "bg-amber-50 border-amber-100"
        },
        indigo: {
          card: "bg-indigo-50/30 border-indigo-100 hover:border-indigo-200",
          checkbox: "bg-indigo-500 border-indigo-700 shadow-indigo-100",
          iconBg: "bg-indigo-50 border-indigo-100"
        },
      };
      return themes[color] || {
        card: "bg-white border-[#e8e2c8] hover:border-[#d0c8a0]",
        checkbox: "bg-[#5c4d3c] border-[#3e3428] shadow-[#d6d3c9]",
        iconBg: "bg-[#faf7ed] border-[#e8e2c8]"
      };
    }

    return {
      card: "bg-white border-[#e8e2c8] hover:border-[#d0c8a0]",
      checkbox: "bg-[#5c4d3c] border-[#3e3428] shadow-[#d6d3c9]",
      iconBg: "bg-[#faf7ed] border-[#e8e2c8]"
    };
  };

  const aesthetics = getHabitCardAesthetics(habit.color);
  const cardRef = useRef<HTMLDivElement>(null);

  const themeColors = {
    text: habit.color ? aesthetics.checkbox.replace('bg-', 'text-').split(' ')[0] : 'text-[#5c4d3c]',
    border: habit.color ? aesthetics.card.split(' ')[1] : 'border-[#e8e2c8]',
    bg: habit.color ? aesthetics.card.split(' ')[0] : 'bg-white',
    icon: habit.color ? aesthetics.iconBg.split(' ')[0] : 'bg-[#faf7ed]'
  };

  const handleToggle = (habitId: string, date: string, e?: React.MouseEvent) => {
    const isCompleted = habit.completions.some(c => 
      startOfDay(parseISO(c.completedAt)).getTime() === startOfDay(parseISO(date)).getTime()
    );

    if (!isCompleted) {
      // Play sound
      playCompletionSound();
 
      // Show confetti
      if (cardRef.current && e) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x, y },
          colors: [habit.color || '#5c4d3c', '#ffffff', '#ffd700'],
          startVelocity: 30,
          ticks: 100,
          gravity: 1.2,
          drift: 0,
          scalar: 0.7
        });
      }
    }

    onToggle(habitId, date);
  };

  const isCompletedOnDate = (date: Date) => {
    return habit.completions.some(c => 
      startOfDay(parseISO(c.completedAt)).getTime() === startOfDay(date).getTime()
    );
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col p-3 md:p-4 border-2 border-b-4 rounded-2xl md:rounded-[2rem] transition-all shadow-sm mb-2",
        aesthetics.card,
        isExpanded && "border-b-[6px] shadow-md"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div 
          className="flex items-center gap-3 min-w-[140px] md:min-w-[180px] cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-inner border-2 border-b-4",
            aesthetics.iconBg
          )}>
            {habit.icon || "✨"}
          </div>
          <div className="flex flex-col flex-1">
            <h3 className={cn(
              "font-black text-sm md:text-base leading-tight uppercase tracking-tight flex items-center gap-2",
              themeColors.text
            )}>
              {habit.title}
              {isExpanded ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Flame className={cn("w-3 h-3 fill-current", habit.currentStreak > 0 ? "text-orange-500" : "text-gray-300")} />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", habit.currentStreak > 0 ? "text-orange-500" : "text-gray-300")}>
                  {habit.currentStreak} day streak
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between md:justify-end items-center gap-1 md:gap-3 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {habit.frequency === 'daily' ? (
            currentWeek.map((date, i) => {
              const completed = isCompletedOnDate(date);
              const today = isToday(date);
              const isFuture = date > new Date();

              return (
                <div key={i} className="flex flex-col items-center gap-1.5 min-w-[40px] md:min-w-[48px]">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter transition-colors",
                    today ? themeColors.text : "text-gray-300"
                  )}>
                    {format(date, 'EEE')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFuture) handleToggle(habit.id, date.toISOString(), e);
                    }}
                    disabled={isFuture}
                    className={cn(
                      "w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden",
                      isFuture ? "opacity-10 cursor-not-allowed border-gray-100" : "cursor-pointer active:translate-y-1 active:border-b-0",
                      completed 
                        ? `${aesthetics.checkbox} text-white border-b-4 shadow-md`
                        : cn(
                            "bg-white border-b-4",
                            today ? themeColors.border : "border-[#faf7ed]",
                            today && themeColors.icon
                          )
                    )}
                  >
                    {completed ? (
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-white stroke-[4]" />
                    ) : today ? (
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", themeColors.text.replace('text-', 'bg-'))} />
                    ) : null}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex items-center gap-4 pr-2">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {habit.frequency === 'weekly' ? 'This Week' : 'This Month'}
                </span>
                <span className={cn("text-xs font-black tabular-nums", themeColors.text)}>
                  {periodCompletions} / {habit.targetDays}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(habit.id, new Date().toISOString(), e);
                }}
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden",
                  (isPeriodTargetMet || isCompletedToday)
                    ? `${aesthetics.checkbox} text-white border-b-4 shadow-md`
                    : cn("bg-white border-b-4 shadow-sm active:translate-y-1 active:border-b-0", themeColors.border)
                )}
              >
                {isPeriodTargetMet ? (
                  <Check className="w-6 h-6 md:w-8 md:h-8 text-white stroke-[4]" />
                ) : (
                  <Plus className={cn(
                    "w-6 h-6 stroke-[4]",
                    isCompletedToday ? "text-white" : themeColors.text
                  )} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-4 mt-2 border-t-2 border-[#faf7ed]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewStats(habit.id)}
                className={cn(
                  "flex-1 border-2 border-b-4 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl active:translate-y-0.5 active:border-b-0 transition-all",
                  themeColors.bg,
                  themeColors.border,
                  themeColors.text,
                  "hover:brightness-95"
                )}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <EditHabitDialog habit={habit} onUpdateHabit={onUpdate}>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 border-2 border-b-4 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl active:translate-y-0.5 active:border-b-0 transition-all",
                    themeColors.bg,
                    themeColors.border,
                    themeColors.text,
                    "hover:brightness-95"
                  )}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </EditHabitDialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(habit.id)}
                className="bg-rose-50 border-2 border-b-4 border-rose-100 text-rose-300 font-black uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl hover:bg-rose-100 hover:text-rose-500 active:translate-y-0.5 active:border-b-0 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
