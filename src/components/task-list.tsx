"use client";

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Task } from '@/lib/types';
import TaskItem from '@/components/task-item';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => 'subtask' | 'main' | 'none';
  setCelebrating: (celebrating: boolean) => void;
}

export default function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  setCelebrating,
}: TaskListProps) {

  const emptyStateImage = PlaceHolderImages.find(img => img.id === 'empty-tasks');

  if (tasks.length === 0) {
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
        <h2 className="text-2xl font-bold mb-2 font-headline text-foreground">All Quests Conquered!</h2>
        <p>Your task list is empty. Add a new quest to begin your next adventure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          setCelebrating={setCelebrating}
        />
      ))}
    </div>
  );
}
