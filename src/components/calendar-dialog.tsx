"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CalendarView from "./calendar-view";
import { Task } from "@/lib/types";

interface CalendarDialogProps {
  children: React.ReactNode;
  tasks: Task[];
}

export function CalendarDialog({ children, tasks }: CalendarDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Quest Calendar</DialogTitle>
          <DialogDescription>
            View your completed quests and track your progress.
          </DialogDescription>
        </DialogHeader>
        <CalendarView tasks={tasks} />
      </DialogContent>
    </Dialog>
  );
}
