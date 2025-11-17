"use client";

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from '@/components/ui/calendar';
import { Task } from "@/lib/types";
import { parseISO, startOfDay, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarDialogProps {
  children: React.ReactNode;
  tasks: Task[];
}

export function CalendarDialog({ children, tasks }: CalendarDialogProps) {
  // Extract dates when tasks were completed
  const completedDates = useMemo(() => {
    return tasks
      .filter(task => task.completedAt && !task.isAutomated)
      .map(task => startOfDay(parseISO(task.completedAt!)));
  }, [tasks]);

  // Check if a date has completed tasks
  const hasCompletedTasks = (date: Date) => {
    return completedDates.some(completedDate => isSameDay(completedDate, date));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Quest Calendar</DialogTitle>
          <DialogDescription>
            View your completed quests and track your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={undefined}
            className="rounded-md border-0"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-semibold font-headline",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem] uppercase",
              row: "flex w-full mt-2",
              cell: cn(
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                "h-10 w-10"
              ),
              day: cn(
                "h-10 w-10 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
                "inline-flex items-center justify-center",
                "transition-colors",
                "border border-border/50"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-semibold border-2 border-primary",
              day_outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
            modifiers={{
              completed: (date) => hasCompletedTasks(date),
            }}
            modifiersClassNames={{
              completed: "bg-green-500/30 text-green-800 dark:text-green-300 border-green-600 hover:bg-green-500/40 font-bold shadow-sm",
            }}
            disabled={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
