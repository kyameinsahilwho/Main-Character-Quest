"use client";

import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Task } from '@/lib/types';

interface CalendarViewProps {
  tasks: Task[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const completedDays = useMemo(() => {
    return tasks
      .filter(task => task.isCompleted && task.completedAt)
      .map(task => new Date(task.completedAt!));
  }, [tasks]);

  const modifiers = {
    completed: completedDays,
  };

  const modifiersStyles = {
    completed: {
      backgroundColor: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
    },
  };

  return (
    <div className="flex justify-center p-4">
      <Calendar
        mode="single"
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md border"
      />
    </div>
  );
}
