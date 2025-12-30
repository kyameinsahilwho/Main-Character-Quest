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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">History</DialogTitle>
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

