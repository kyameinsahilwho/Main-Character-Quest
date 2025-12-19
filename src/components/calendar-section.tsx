"use client";

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Task } from '@/lib/types';
import { parseISO, startOfDay, isSameDay, format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, Trophy } from 'lucide-react';

interface CalendarSectionProps {
  tasks: Task[];
}

export function CalendarSection({ tasks }: CalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extract dates when tasks were completed
  const completedDates = useMemo(() => {
    return tasks
      .filter(task => task.completedAt && !task.isTemplate)
      .map(task => startOfDay(parseISO(task.completedAt!)));
  }, [tasks]);

  // Check if a date has completed tasks
  const hasCompletedTasks = (date: Date) => {
    return completedDates.some(completedDate => isSameDay(completedDate, date));
  };

  const handleDayClick = (date: Date) => {
    if (hasCompletedTasks(date)) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  const getCompletedTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.completedAt && 
      !task.isTemplate && 
      isSameDay(startOfDay(parseISO(task.completedAt)), date)
    );
  };

  return (
    <>
      <Card className="mb-6 overflow-hidden">
        <div className="p-4">
          <h2 className="text-lg font-bold font-headline mb-4 text-foreground">Quest Calendar</h2>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={undefined}
              onDayClick={handleDayClick}
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
      </div>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-xl">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Completed Quests
          </DialogTitle>
          <DialogDescription>
            {selectedDate && format(selectedDate, "MMMM do, yyyy")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedDate && getCompletedTasksForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getCompletedTasksForDate(selectedDate).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{task.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No quests completed on this day.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
