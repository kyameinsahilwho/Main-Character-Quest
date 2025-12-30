"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Task, Habit } from "@/lib/types";
import { HistoryView } from './history-view';

interface CalendarDialogProps {
  children: React.ReactNode;
  tasks: Task[];
  habits: Habit[];
  onToggleTask?: (taskId: string) => void;
  onToggleHabit?: (habitId: string, date: string) => void;
}

export function CalendarDialog({ children, tasks, habits, onToggleTask, onToggleHabit }: CalendarDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-headline text-2xl sm:text-3xl">History</DialogTitle>
        </DialogHeader>
        <HistoryView 
          tasks={tasks} 
          habits={habits} 
          onToggleTask={onToggleTask}
          onToggleHabit={onToggleHabit}
        />
      </DialogContent>
    </Dialog>
  );
}

