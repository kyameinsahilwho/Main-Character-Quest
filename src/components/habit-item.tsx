"use client";

import { useState, useRef } from "react";
import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Trash2, Flame, Trophy, BarChart2, Edit2, ChevronDown, ChevronUp, Plus, CircleDashed } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, startOfDay, startOfMonth, endOfMonth, isSameMonth, isSameWeek, subWeeks, subMonths, differenceInCalendarDays } from "date-fns";
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

  const displayDays = currentWeek;

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

  const getFrequencyLabel = (freq: Habit['frequency']) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'every_2_days': return 'Every 2nd Day';
      case 'every_3_days': return 'Every 3rd Day';
      case 'every_4_days': return 'Every 4th Day';
      case 'specific_days': return 'Custom Schedule';
      default: return freq;
    }
  };

  const getCompletionsForPeriod = (date: Date, frequency: Habit['frequency']) => {
    return habit.completions.filter(c => {
      const completionDate = parseISO(c.completedAt);
      if (frequency === 'weekly') return isSameWeek(completionDate, date, { weekStartsOn: 0 });
      if (frequency === 'monthly') return isSameMonth(completionDate, date);
      return false;
    }).length;
  };

  const periods = (habit.frequency === 'daily' || habit.frequency === 'specific_days' || ['every_2_days', 'every_3_days', 'every_4_days'].includes(habit.frequency)) ? [] : Array.from({ length: 4 }).map((_, i) => {
    const date = habit.frequency === 'weekly' ? subWeeks(now, i) : subMonths(now, i);
    const completions = getCompletionsForPeriod(date, habit.frequency);
    const label = habit.frequency === 'weekly' ? `W${4-i}` : format(date, 'MMM');
    return { date, completions, label, isCurrent: i === 0 };
  }).reverse();

  const getHabitCardAesthetics = (colorStr?: string) => {
    if (!colorStr) return {
      card: "bg-white border-[#CBD5E1] hover:border-[#94A3B8]",
      checkbox: "bg-[#1E293B] border-[#0F172A]",
      iconBg: "bg-[#F1F4F9] border-[#CBD5E1]"
    };

    const match = colorStr.match(/bg-([a-z]+)-600/);
    if (match && match[1]) {
      const color = match[1];
      const themes: Record<string, { card: string; checkbox: string; iconBg: string }> = {
        blue: {
          card: "bg-blue-50 border-blue-200 hover:border-blue-400",
          checkbox: "bg-blue-600 border-blue-800",
          iconBg: "bg-blue-100 border-blue-200"
        },
        purple: {
          card: "bg-purple-50 border-purple-200 hover:border-purple-400",
          checkbox: "bg-purple-600 border-purple-800",
          iconBg: "bg-purple-100 border-purple-200"
        },
        cyan: {
          card: "bg-cyan-50 border-cyan-200 hover:border-cyan-400",
          checkbox: "bg-cyan-600 border-cyan-800",
          iconBg: "bg-cyan-100 border-cyan-200"
        },
        rose: {
          card: "bg-rose-50 border-rose-200 hover:border-rose-400",
          checkbox: "bg-rose-600 border-rose-800",
          iconBg: "bg-rose-100 border-rose-200"
        },
        amber: {
          card: "bg-amber-50 border-amber-200 hover:border-amber-400",
          checkbox: "bg-amber-600 border-amber-800",
          iconBg: "bg-amber-100 border-amber-200"
        },
        indigo: {
          card: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
          checkbox: "bg-indigo-600 border-indigo-800",
          iconBg: "bg-indigo-100 border-indigo-200"
        },
      };
      return themes[color] || {
        card: "bg-white border-[#CBD5E1] hover:border-[#94A3B8]",
        checkbox: "bg-[#1E293B] border-[#0F172A]",
        iconBg: "bg-[#F1F4F9] border-[#CBD5E1]"
      };
    }

    return {
      card: "bg-white border-[#CBD5E1] hover:border-[#94A3B8]",
      checkbox: "bg-[#1E293B] border-[#0F172A]",
      iconBg: "bg-[#F1F4F9] border-[#CBD5E1]"
    };
  };

  const aesthetics = getHabitCardAesthetics(habit.color);
  const cardRef = useRef<HTMLDivElement>(null);

  const themeColors = {
    text: habit.color ? aesthetics.checkbox.replace('bg-', 'text-').split(' ')[0] : 'text-[#0F172A]',
    border: habit.color ? aesthetics.card.split(' ')[1] : 'border-[#CBD5E1]',
    bg: habit.color ? aesthetics.card.split(' ')[0] : 'bg-white',
    icon: habit.color ? aesthetics.iconBg.split(' ')[0] : 'bg-[#F1F4F9]'
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
          colors: [habit.color || '#1E293B', '#ffffff', '#ffd700'],
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
            {habit.icon || <CircleDashed className="w-6 h-6 text-gray-400" />}
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
                <Flame className={cn(
                  "w-3 h-3 fill-current", 
                  habit.currentStreak > 0 ? "text-orange-500" : "text-gray-300"
                )} />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", habit.currentStreak > 0 ? "text-orange-500" : "text-gray-300")}>
                  {habit.currentStreak} day streak
                </span>
              </div>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                {getFrequencyLabel(habit.frequency)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between md:justify-end items-center gap-1 md:gap-3 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {(habit.frequency === 'daily' || habit.frequency === 'specific_days' || ['every_2_days', 'every_3_days', 'every_4_days'].includes(habit.frequency)) ? (
            displayDays.map((date, i) => {
              const completed = isCompletedOnDate(date);
              const today = isToday(date);
              const isFuture = date > new Date();
              
              let isDayEnabled = true;
              if (habit.frequency === 'specific_days') {
                isDayEnabled = habit.customDays?.includes(date.getDay()) ?? false;
              } else if (['every_2_days', 'every_3_days', 'every_4_days'].includes(habit.frequency)) {
                const interval = parseInt(habit.frequency.split('_')[1]);
                const startDate = startOfDay(parseISO(habit.createdAt));
                const diffDays = differenceInCalendarDays(startOfDay(date), startDate);
                isDayEnabled = diffDays >= 0 && diffDays % interval === 0;
              }

              return (
                <div key={i} className={cn(
                  "flex flex-col items-center gap-1.5 min-w-[40px] md:min-w-[48px]",
                  !isDayEnabled && "opacity-0 pointer-events-none"
                )}>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter transition-colors",
                    today ? themeColors.text : "text-gray-300"
                  )}>
                    {format(date, 'EEE')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFuture && isDayEnabled) handleToggle(habit.id, date.toISOString(), e);
                    }}
                    disabled={isFuture || !isDayEnabled}
                    className={cn(
                      "w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden",
                      (isFuture || !isDayEnabled) ? "opacity-10 cursor-not-allowed border-gray-100" : "cursor-pointer active:translate-y-0.5",
                      completed 
                        ? `${aesthetics.checkbox} text-white`
                        : cn(
                            "bg-white",
                            today ? themeColors.border : "border-[#F1F4F9]",
                            today && themeColors.icon
                          )
                    )}
                  >
                    {completed ? (
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-white stroke-[4]" />
                    ) : today && isDayEnabled ? (
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", themeColors.text.replace('text-', 'bg-'))} />
                    ) : null}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar">
              {periods.map((period, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 min-w-[40px] md:min-w-[48px]">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter transition-colors",
                    period.isCurrent ? themeColors.text : "text-gray-300"
                  )}>
                    {period.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (period.isCurrent) handleToggle(habit.id, period.date.toISOString(), e);
                    }}
                    className={cn(
                      "w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden",
                      !period.isCurrent && "opacity-40 cursor-default",
                      period.completions > 0 
                        ? `${aesthetics.checkbox} text-white`
                        : cn(
                            "bg-white",
                            period.isCurrent ? themeColors.border : "border-[#F1F4F9]",
                            period.isCurrent && themeColors.icon
                          ),
                      period.isCurrent && "active:translate-y-0.5 cursor-pointer"
                    )}
                  >
                    {period.completions > 0 ? (
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-white stroke-[4]" />
                    ) : period.isCurrent ? (
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", themeColors.text.replace('text-', 'bg-'))} />
                    ) : null}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-4 mt-2 border-t-2 border-[#F1F4F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewStats(habit.id)}
                className={cn(
                  "flex-1 border-2 border-b-4 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl active:translate-y-0.5 active:border-b-0 transition-all",
                  "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F4F9] hover:text-[#1E293B] hover:border-[#CBD5E1]"
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
                    "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F4F9] hover:text-[#1E293B] hover:border-[#CBD5E1]"
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
