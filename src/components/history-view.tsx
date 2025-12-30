"use client";

import { useState } from "react";
import { format, addDays, subDays, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Flame, CircleDashed, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardTitle } from "@/components/ui/card";
import { Task, Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

interface HistoryViewProps {
  tasks: Task[];
  habits: Habit[];
  onToggleTask?: (taskId: string) => void;
  onToggleHabit?: (habitId: string, date: string) => void;
}

export function HistoryView({ tasks, habits, onToggleTask, onToggleHabit }: HistoryViewProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const completedTasks = tasks.filter(task => 
    task.isCompleted && 
    task.completedAt && 
    isSameDay(parseISO(task.completedAt), date)
  );

  const completedHabits = habits.filter(habit => 
    habit.completions.some(c => isSameDay(parseISO(c.completedAt), date))
  );

  const getDayContent = (day: Date) => {
    const hasHabit = habits.some(h => 
      h.completions.some(c => isSameDay(parseISO(c.completedAt), day))
    );
    
    const hasTask = tasks.some(t => 
      t.isCompleted && 
      t.completedAt && 
      isSameDay(parseISO(t.completedAt), day)
    );

    let dots = 0;
    if (hasHabit && hasTask) dots = 3;
    else if (hasTask) dots = 2;
    else if (hasHabit) dots = 1;

    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <span>{day.getDate()}</span>
        {dots > 0 && (
          <div className="absolute bottom-1 flex gap-0.5">
            {Array.from({ length: dots }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1 h-1 rounded-full",
                  dots === 1 ? "bg-purple-500" : 
                  dots === 2 ? "bg-green-500" : 
                  "bg-blue-500"
                )} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const getHabitColor = (colorStr?: string) => {
    if (!colorStr) return "bg-slate-100 border-slate-200 text-slate-700";
    const match = colorStr.match(/bg-([a-z]+)-600/);
    if (match && match[1]) {
      const color = match[1];
      const map: Record<string, string> = {
        blue: "bg-blue-100 border-blue-200 text-blue-700",
        purple: "bg-purple-100 border-purple-200 text-purple-700",
        cyan: "bg-cyan-100 border-cyan-200 text-cyan-700",
        rose: "bg-rose-100 border-rose-200 text-rose-700",
        amber: "bg-amber-100 border-amber-200 text-amber-700",
        indigo: "bg-indigo-100 border-indigo-200 text-indigo-700",
      };
      return map[color] || "bg-slate-100 border-slate-200 text-slate-700";
    }
    return "bg-slate-100 border-slate-200 text-slate-700";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-card p-3 sm:p-4 rounded-2xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-center">
          <Button variant="ghost" size="icon" onClick={() => setDate(subDays(date, 1))} className="h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "flex-1 sm:flex-none min-w-[140px] sm:min-w-[200px] justify-center font-bold text-base sm:text-lg px-2 sm:px-4 h-10 sm:h-11",
                !date && "text-muted-foreground"
              )}>
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{format(date, "PPP")}</span>
                <span className="sm:hidden">{format(date, "MMM d, yyyy")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-auto p-0" align="center" sideOffset={8}>
              <div className="p-1 sm:p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="w-full"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-4",
                    table: "w-full border-collapse",
                    head_row: "flex w-full justify-between",
                    head_cell: "text-muted-foreground rounded-xl w-10 sm:w-9 font-bold text-[0.7rem] sm:text-[0.8rem] uppercase flex-1",
                    row: "flex w-full mt-2 justify-between",
                    cell: "h-10 w-10 sm:h-9 sm:w-9 text-center text-sm p-0 relative flex-1 flex items-center justify-center",
                    day: "h-10 w-10 sm:h-9 sm:w-9 p-0 font-bold rounded-xl aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center justify-center",
                    day_today: "bg-transparent border-2 border-[#58cc02] text-foreground font-bold rounded-xl",
                    day_selected: "bg-[#58cc02] text-white hover:bg-[#46a302] hover:text-white focus:bg-[#58cc02] focus:text-white rounded-xl",
                    day_outside: "text-muted-foreground opacity-50",
                  }}
                  components={{
                    DayContent: ({ date }) => getDayContent(date)
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} className="h-10 w-10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Tasks Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-black font-headline uppercase tracking-widest text-muted-foreground/80 px-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed Quests
          </h3>
          
          {completedTasks.length > 0 ? (
            <div className="space-y-3">
              {completedTasks.map(task => {
                const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
                const progress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0;
                
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="transition-all duration-300 overflow-hidden flex flex-col border-2 rounded-[1.5rem] sm:rounded-[2rem] relative bg-muted/30 opacity-70 shadow-none border-transparent translate-y-[4px] border-b-0">
                      <div className="flex items-center p-4 sm:p-5">
                        <div 
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl border-2 border-b-[4px] flex items-center justify-center transition-all duration-200 relative overflow-hidden bg-primary border-primary border-b-[#46a302] cursor-pointer active:translate-y-[2px] active:border-b-0 shrink-0 mr-3 sm:mr-4"
                          onClick={() => onToggleTask?.(task.id)}
                        >
                          <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[4px] z-10" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl font-black leading-tight tracking-tight line-through text-muted-foreground/60 truncate">
                            {task.title}
                          </CardTitle>
                          
                          {task.subtasks.length > 0 && (
                             <div className="mt-2 flex items-center gap-3">
                                <div className="h-3 flex-1 bg-muted rounded-full overflow-hidden border border-border/80 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                                  <motion.div 
                                    className="h-full bg-primary rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                <span className="text-[11px] font-black text-muted-foreground whitespace-nowrap tracking-tighter">{completedSubtasks} / {task.subtasks.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted text-sm">
              <p>No quests completed.</p>
            </div>
          )}
        </section>

        {/* Habits Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-black font-headline uppercase tracking-widest text-muted-foreground/80 px-1 flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Completed Rituals
          </h3>
          
          {completedHabits.length > 0 ? (
            <div className="space-y-2">
              {completedHabits.map(habit => {
                const colorClass = getHabitColor(habit.color);
                return (
                  <div key={habit.id} className="flex items-center gap-3 p-2 bg-card border border-border rounded-lg">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center text-lg border shadow-sm",
                      colorClass
                    )}>
                      {habit.icon || <CircleDashed className="h-4 w-4" />}
                    </div>
                    <span className="font-bold text-sm text-foreground flex-1 truncate">
                      {habit.title}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                      <Flame className="h-3 w-3 fill-current" />
                      <span className="text-[10px] font-black">{habit.currentStreak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted text-sm">
              <p>No rituals completed.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
