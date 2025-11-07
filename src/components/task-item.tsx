"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronDown, Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { playBigCompletionSound, playCompletionSound } from '@/lib/sounds';
import type { Task } from '@/lib/types';
import { Separator } from './ui/separator';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => 'subtask' | 'main' | 'none';
  setCelebrating: (celebating: boolean) => void;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit, onAddSubtask, onToggleSubtask, setCelebrating }: TaskItemProps) {
  const [subtaskText, setSubtaskText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskText.trim()) {
      onAddSubtask(task.id, subtaskText.trim());
      setSubtaskText('');
    }
  };

  const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
  const progress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0;
  
  const handleSubtaskToggle = (subtaskId: string) => {
    const result = onToggleSubtask(task.id, subtaskId);
    if (result === 'subtask') {
        playCompletionSound();
    } else if (result === 'main') {
        playCompletionSound();
        setIsAnimating(true);
        setTimeout(() => {
          setCelebrating(true);
          playBigCompletionSound();
        }, 500);
    }
  }

  const handleToggleSubtask = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    handleSubtaskToggle(subtaskId);
  };
  
  const handleMainCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent collapsible from toggling
    if(task.isAutomated) return;
    
    if (!task.isCompleted) {
      setIsAnimating(true);
      playBigCompletionSound();
      setCelebrating(true);
      setTimeout(() => {
        onToggle(task.id);
        setIsAnimating(false);
      }, 500); // Duration of the animation
    } else {
      onToggle(task.id);
    }
  }

  const handleWrapperClick = (e: React.MouseEvent) => {
    // Only toggle expansion if not clicking on the checkbox area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-checkbox-area]')) {
      setIsExpanded(!isExpanded);
    }
  }

  return (
    <Card className={cn(
        "transition-all duration-300 overflow-hidden", 
        task.isCompleted && !task.isAutomated ? 'bg-card/60 border-dashed opacity-70' : 'bg-card', 
        task.isAutomated && 'border-dashed border-primary/50',
        isAnimating && 'animate-green-flash'
    )}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-start p-4 cursor-pointer" onClick={handleWrapperClick}>
        <div data-checkbox-area className='flex items-center h-full mt-1 mr-4' onClick={handleMainCheckboxClick}>
            <Checkbox
            id={`task-${task.id}`}
            checked={task.isCompleted}
            className={cn("h-6 w-6 rounded-md", task.isAutomated && "cursor-not-allowed")}
            aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
            disabled={task.isAutomated}
            />
        </div>
        <div className="flex-1">
          <CardTitle className={cn("text-lg font-bold", task.isCompleted && !task.isAutomated && 'line-through text-muted-foreground')}>
            {task.title}
          </CardTitle>
          
          {task.subtasks.length > 0 && (
             <div className="mt-3">
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <span>{completedSubtasks} of {task.subtasks.length} completed</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
          )}

        </div>
        <div className="flex items-center ml-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                <span className="sr-only">Toggle details</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <Separator className="my-0"/>
        <div className="p-4 pt-4">
          <div className="space-y-3">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center" onClick={(e) => { e.preventDefault(); handleSubtaskToggle(subtask.id) }}>
                <Checkbox
                  id={`subtask-${subtask.id}`}
                  checked={subtask.isCompleted}
                  className="mr-3 h-4 w-4"
                  onClick={(e) => handleToggleSubtask(e, subtask.id)}
                  disabled={task.isAutomated}
                />
                <label
                  htmlFor={`subtask-${subtask.id}`}
                  className={cn("text-sm cursor-pointer", subtask.isCompleted && "line-through text-muted-foreground")}
                >
                  {subtask.text}
                </label>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddSubtask} className="mt-4 flex gap-2">
            <Input
              value={subtaskText}
              onChange={e => setSubtaskText(e.target.value)}
              placeholder="Add a sub-quest..."
              className="h-9"
            />
            <Button type="submit" variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <Separator className="my-0"/>
      </CollapsibleContent>
      <CardFooter className="flex justify-between p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
                {task.dueDate && !task.isAutomated && (
                    <>
                        <Calendar className="h-4 w-4" />
                        <span>Due {format(new Date(task.dueDate), 'MMM d')}</span>
                    </>
                )}
                {task.isAutomated && (
                    <span className='font-semibold text-primary/80'>Automated Template</span>
                )}
            </div>
            <div className='flex items-center gap-1'>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(task)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit task</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete task</span>
                </Button>
            </div>
        </CardFooter>
        </Collapsible>
    </Card>
  );
}
