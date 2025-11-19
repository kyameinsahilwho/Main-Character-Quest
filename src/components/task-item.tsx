"use client";

import { useState, useCallback, memo, useMemo } from 'react';
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
  onToggleSubtask: (taskId: string, subtaskId: string) => 'subtask' | 'main' | 'none' | Promise<'subtask' | 'main' | 'none'>;
  setCelebrating: (celebating: boolean) => void;
}

function TaskItem({ task, onToggle, onDelete, onEdit, onAddSubtask, onToggleSubtask, setCelebrating }: TaskItemProps) {
  const [subtaskText, setSubtaskText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Memoize computed values
  const { completedSubtasks, progress, formattedDueDate } = useMemo(() => {
    const completed = task.subtasks.filter(st => st.isCompleted).length;
    const prog = task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0;
    const formatted = task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '';
    return { completedSubtasks: completed, progress: prog, formattedDueDate: formatted };
  }, [task.subtasks, task.dueDate]);

  const handleAddSubtask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (subtaskText.trim()) {
      onAddSubtask(task.id, subtaskText.trim());
      setSubtaskText('');
    }
  }, [subtaskText, onAddSubtask, task.id]);
  
  const handleSubtaskToggle = useCallback(async (subtaskId: string) => {
    const result = await Promise.resolve(onToggleSubtask(task.id, subtaskId));
    if (result === 'subtask') {
        playCompletionSound();
    } else if (result === 'main') {
        playCompletionSound();
        setIsAnimating(true);
        setTimeout(() => {
          setCelebrating(true);
          playBigCompletionSound();
        }, 200);
    }
  }, [task.id, onToggleSubtask, setCelebrating]);

  const handleToggleSubtask = useCallback((e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    handleSubtaskToggle(subtaskId);
  }, [handleSubtaskToggle]);
  
  const handleMainCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if(task.isAutomated) return;
    
    if (!task.isCompleted) {
      setIsAnimating(true);
      setTimeout(() => {
        playBigCompletionSound();
        setCelebrating(true);
        onToggle(task.id);
        setIsAnimating(false);
      }, 200);
    } else {
      onToggle(task.id);
    }
  }, [task.isAutomated, task.isCompleted, task.id, onToggle, setCelebrating]);

  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (!target.closest('[data-interactive-area]') && !target.closest('button') && !target.closest('input')) {
      setIsExpanded(prev => !prev);
    }
  }, []);

  const handleCollapsibleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't toggle if input is focused (keyboard is likely open)
    if (inputFocused) return;
    setIsExpanded(prev => !prev);
  }, [inputFocused]);

  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  return (
    <Card className={cn(
        "transition-all duration-300 overflow-hidden h-full flex flex-col", 
        task.isCompleted && !task.isAutomated ? 'bg-card/60 border-dashed opacity-70' : 'bg-card', 
        task.isAutomated && 'border-dashed border-primary/50',
        isAnimating && 'animate-green-flash'
    )}>
        <Collapsible 
          open={isExpanded} 
          onOpenChange={(open) => {
            // Don't close if input is focused
            if (!open && inputFocused) return;
            setIsExpanded(open);
          }}
          className="flex flex-col h-full"
        >
      <div className="flex items-center p-3 cursor-pointer" onClick={handleWrapperClick}>
        <div data-interactive-area className='flex items-center mr-3' onClick={handleMainCheckboxClick}>
            <Checkbox
            id={`task-${task.id}`}
            checked={task.isCompleted}
            className={cn("h-5 w-5 rounded-md", task.isAutomated && "cursor-not-allowed")}
            aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
            disabled={task.isAutomated}
            />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className={cn("text-base font-bold leading-tight", task.isCompleted && !task.isAutomated && 'line-through text-muted-foreground')}>
            {task.title}
          </CardTitle>
          
          {task.subtasks.length > 0 && (
             <div className="mt-2 flex items-center gap-2">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{completedSubtasks}/{task.subtasks.length}</span>
            </div>
          )}

        </div>
        <div data-interactive-area className="flex items-center gap-1.5 ml-2">
          {task.dueDate && !task.isAutomated && (
            <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDueDate}</span>
            </div>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={handleCollapsibleToggle}>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                <span className="sr-only">Toggle details</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <Separator className="my-0"/>
        <div className="px-3 py-2.5">
          <div className="space-y-2">
            {task.subtasks.map((subtask, index) => (
              <div 
                key={subtask.id} 
                className="flex items-center group hover:bg-accent/50 rounded px-2 py-1.5 -mx-2 transition-colors duration-150 cursor-pointer"
                onClick={(e) => { e.preventDefault(); handleSubtaskToggle(subtask.id) }}
                style={{ 
                  animation: isExpanded ? `fadeInSlide 0.2s ease-out ${index * 0.05}s both` : 'none' 
                }}
              >
                <Checkbox
                  id={`subtask-${subtask.id}`}
                  checked={subtask.isCompleted}
                  className="mr-2.5 h-4 w-4"
                  onClick={(e) => handleToggleSubtask(e, subtask.id)}
                  disabled={task.isAutomated}
                />
                <label
                  htmlFor={`subtask-${subtask.id}`}
                  className={cn("text-sm cursor-pointer flex-1 transition-all duration-150 leading-snug", subtask.isCompleted && "line-through text-muted-foreground")}
                >
                  {subtask.text}
                </label>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddSubtask} className="mt-2.5 flex gap-2">
            <Input
              value={subtaskText}
              onChange={e => setSubtaskText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 300)}
              placeholder="Add a sub-quest..."
              className="h-8 text-sm"
            />
            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <Separator className="my-0"/>
        <div data-interactive-area className="flex justify-between items-center p-2.5 px-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                {task.dueDate && !task.isAutomated && (
                    <div className="flex sm:hidden items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due {formattedDueDate}</span>
                    </div>
                )}
                {task.isAutomated && (
                    <span className='font-semibold text-primary/80'>Template</span>
                )}
            </div>
            <div className='flex items-center gap-0.5'>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors" onClick={handleEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit task</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={handleDelete}>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete task</span>
                </Button>
            </div>
        </div>
      </CollapsibleContent>
        </Collapsible>
        <style jsx>{`
          @keyframes fadeInSlide {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes collapse {
            from {
              height: var(--radix-collapsible-content-height);
            }
            to {
              height: 0;
            }
          }
          @keyframes expand {
            from {
              height: 0;
            }
            to {
              height: var(--radix-collapsible-content-height);
            }
          }
          :global(.animate-collapse) {
            animation: collapse 0.3s ease-in-out;
          }
          :global(.animate-expand) {
            animation: expand 0.3s ease-in-out;
          }
        `}</style>
    </Card>
  );
}

export default memo(TaskItem);
