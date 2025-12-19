"use client";

import { memo, useMemo, useState } from 'react';
import Image from 'next/image';
import { isToday, isTomorrow, isThisWeek, parseISO, isBefore, startOfToday, format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Task } from '@/lib/types';
import TaskItem from '@/components/task-item';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  listType: 'active' | 'completed' | 'templates';
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
  
  return format(date, 'MMM d, EEE');
};

const Section = memo(({ title, children, isPast, isToday, count }: { title: string, children: React.ReactNode, isPast?: boolean, isToday?: boolean, count?: number }) => {
  const [isOpen, setIsOpen] = useState(!isPast);

  return (
    <div className="mb-10">
      <div className="py-2 px-4 md:px-6 lg:px-8 mb-4 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
        <h2 className={cn(
          "text-sm md:text-base font-black font-headline flex items-center gap-4 uppercase tracking-[0.2em]", 
          isPast ? "text-destructive" : isToday ? "text-primary" : "text-muted-foreground/60"
        )}>
          <span className={cn(
            "px-3 py-1 rounded-lg border-b-2 flex items-center gap-2 transition-all",
            isPast ? "bg-destructive/10 border-destructive/20" : 
            isToday ? "bg-primary/10 border-primary/30 shadow-[0_2px_10px_-3px_rgba(var(--primary),0.2)]" : 
            "bg-muted/50 border-border",
            !isOpen && "opacity-60"
          )}>
            {isPast && <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "" : "-rotate-90")} />}
            {title} {count !== undefined ? `(${count})` : ''}
          </span>
          <div className={cn("h-px flex-1", isToday ? "bg-primary/30" : "bg-border/50")} />
        </h2>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
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
        : 'No Template Quests';
    const message =
      listType === 'active'
        ? 'Your quest log is empty. Add a new quest to begin your next adventure.'
        : listType === 'completed'
        ? 'Complete a quest from your active list to see it here.'
        : 'Add some template quests to create reusable task templates.';

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

  if (listType === 'templates') {
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

  const sectionOrder = useMemo(() => {
    if (listType === 'completed') return ['Completed Today', 'Completed Earlier'];
    
    const sections = Object.keys(groupedTasks);
    const fixedSections = ['Past', 'Today', 'Tomorrow'];
    const otherSections = sections.filter(s => !fixedSections.includes(s) && s !== 'No Due Date');
    
    // Sort other sections by date
    otherSections.sort((a, b) => {
      const dateA = parseISO(groupedTasks[a][0].dueDate!);
      const dateB = parseISO(groupedTasks[b][0].dueDate!);
      return dateA.getTime() - dateB.getTime();
    });

    const order = [];
    if (groupedTasks['Past']) order.push('Past');
    if (groupedTasks['Today']) order.push('Today');
    if (groupedTasks['Tomorrow']) order.push('Tomorrow');
    order.push(...otherSections);
    if (groupedTasks['No Due Date']) order.push('No Due Date');
    
    return order;
  }, [groupedTasks, listType]);


  return (
    <div className="h-full max-w-4xl mx-auto">
      {sectionOrder.map(sectionName => (
          <Section 
            key={sectionName} 
            title={sectionName} 
            isPast={sectionName === 'Past'}
            isToday={sectionName === 'Today' || sectionName === 'Completed Today'}
            count={groupedTasks[sectionName]?.length}
          >
            <AnimatePresence mode="popLayout">
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
            </AnimatePresence>
          </Section>
      ))}
    </div>
  );
}

export default memo(TaskList);
