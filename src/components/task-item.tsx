"use client";

import { useState, useCallback, memo, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronDown, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className="mb-3"
    >
    <Card className={cn(
        "transition-all duration-300 overflow-hidden flex flex-col", 
        task.isCompleted && !task.isAutomated ? 'bg-card/60 border-dashed opacity-70' : 'bg-card', 
        task.isAutomated && 'border-dashed border-primary/50',
        isAnimating && 'animate-green-flash'
    )}>
      <div className="flex flex-col">
      <div className="flex items-center p-2 cursor-pointer" onClick={handleWrapperClick}>
        <div data-interactive-area className='flex items-center mr-2' onClick={handleMainCheckboxClick}>
            <div 
              className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                task.isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground",
                task.isAutomated && "cursor-not-allowed opacity-50"
              )}
              style={{
                background: !task.isCompleted && progress > 0 
                  ? `conic-gradient(#22c55e ${progress}%, transparent 0)` 
                  : undefined
              }}
            >
              {task.isCompleted && <Check className="h-3 w-3 text-white z-10" />}
            </div>
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className={cn("text-sm font-bold leading-tight", task.isCompleted && !task.isAutomated && 'line-through text-muted-foreground')}>
            {task.title}
          </CardTitle>
          
          {task.subtasks.length > 0 && (
             <div className="mt-1 flex items-center gap-2">
                <Progress value={progress} className="h-1 flex-1" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{completedSubtasks}/{task.subtasks.length}</span>
            </div>
          )}

        </div>
        <div data-interactive-area className="flex items-center gap-1 ml-2">
          {task.dueDate && !task.isAutomated && (
            <div className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDueDate}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCollapsibleToggle}>
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <Separator className="my-0"/>
            <div className="px-3 py-2.5">
              <div className="space-y-2">
                {task.subtasks.map((subtask, index) => (
                  <div 
                    key={subtask.id} 
                    className="flex items-center group hover:bg-accent/50 rounded px-2 py-1.5 -mx-2 transition-colors duration-150 cursor-pointer"
                    onClick={(e) => { e.preventDefault(); handleSubtaskToggle(subtask.id) }}
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
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </Card>
    </motion.div>
  );
}

export default memo(TaskItem);
