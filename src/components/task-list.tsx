"use client";

import { memo, useMemo } from 'react';
import Image from 'next/image';
import { isToday, isTomorrow, isThisWeek, parseISO, isBefore, startOfToday } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Task } from '@/lib/types';
import TaskItem from '@/components/task-item';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  listType: 'active' | 'completed' | 'automated';
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => 'subtask' | 'main' | 'none' | Promise<'subtask' | 'main' | 'none'>;
  setCelebrating: (celebrating: boolean) => void;
}

const getTaskSection = (task: Task): string => {
  if (task.isCompleted && task.completedAt) {
    const completedDate = parseISO(task.completedAt);
    if (isToday(completedDate)) return 'Completed Today';
    return 'Completed Earlier';
  }
  if (!task.dueDate) return 'No Due Date';

  const date = parseISO(task.dueDate);
  const today = startOfToday();

  if (isBefore(date, today) && !isToday(date)) return 'Past';
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'This Week';
  return 'Later';
};

const Section = memo(({ title, children, isPast }: { title: string, children: React.ReactNode, isPast?: boolean }) => (
  <div className="mb-6">
    <div className="py-2 px-4 md:px-6 lg:px-8 mb-2">
      <h2 className={cn("text-xl font-bold font-headline flex items-center gap-3", isPast ? "text-destructive" : "text-foreground")}>
        {title}
        <div className="h-0.5 flex-1 bg-foreground/10 rounded-full" />
      </h2>
    </div>
    <div className="flex flex-col gap-3 px-4 md:px-6 lg:px-8">
      {children}
    </div>
  </div>
));
Section.displayName = 'Section';

function TaskList({
  tasks,
  listType,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  onToggleSubtask,
  setCelebrating,
}: TaskListProps) {
  const emptyStateImage = PlaceHolderImages.find(img => img.id === 'empty-tasks');

  if (tasks.length === 0) {
    const title = listType === 'active' 
        ? 'All Quests Conquered!' 
        : listType === 'completed'
        ? 'No Completed Quests Yet'
        : 'No Automated Quests';
    const message =
      listType === 'active'
        ? 'Your quest log is empty. Add a new quest to begin your next adventure.'
        : listType === 'completed'
        ? 'Complete a quest from your active list to see it here.'
        : 'Add some automated quests to create reusable task templates.';

    return (
      <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground p-8">
        {emptyStateImage && (
          <Image
            src={emptyStateImage.imageUrl}
            alt={emptyStateImage.description}
            width={400}
            height={300}
            className="max-w-xs rounded-lg mb-8"
            data-ai-hint={emptyStateImage.imageHint}
          />
        )}
        <h2 className={cn("text-2xl font-bold mb-2 font-headline text-foreground")}>{title}</h2>
        <p>{message}</p>
      </div>
    );
  }

  if (listType === 'automated') {
    return (
      <div className="flex flex-col gap-3 max-w-4xl mx-auto">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            setCelebrating={setCelebrating}
          />
        ))}
      </div>
    );
  }

  const groupedTasks = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const section = getTaskSection(task);
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const activeSectionOrder = ['Past', 'Today', 'Tomorrow', 'This Week', 'Later', 'No Due Date'];
  const completedSectionOrder = ['Completed Today', 'Completed Earlier'];
  const sectionOrder = listType === 'active' ? activeSectionOrder : completedSectionOrder;


  return (
    <div className="h-full max-w-4xl mx-auto">
      {sectionOrder.map(sectionName =>
        groupedTasks[sectionName] ? (
          <Section key={sectionName} title={sectionName} isPast={sectionName === 'Past'}>
            {groupedTasks[sectionName].map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                setCelebrating={setCelebrating}
              />
            ))}
          </Section>
        ) : null
      )}
    </div>
  );
}

export default memo(TaskList);
