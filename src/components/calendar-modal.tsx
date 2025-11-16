"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CalendarView from './calendar-view';
import { Task } from '@/lib/types';

interface CalendarModalProps {
  tasks: Task[];
}

export default function CalendarModal({ tasks }: CalendarModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Calendar</Button>
      </DialogTrigger>
      <DialogContent className="w-auto">
        <DialogHeader>
          <DialogTitle>Calendar</DialogTitle>
        </DialogHeader>
        <CalendarView tasks={tasks} />
      </DialogContent>
    </Dialog>
  );
}
