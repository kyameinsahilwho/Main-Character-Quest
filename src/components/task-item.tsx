"use client";

import { useState, useCallback, memo, useMemo } from 'react';
import { format, isBefore, parseISO, startOfToday } from 'date-fns';
import { Calendar, ChevronDown, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const { completedSubtasks, progress, formattedDueDate, isPast } = useMemo(() => {
    const completed = task.subtasks.filter(st => st.isCompleted).length;
    const prog = task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0;
    const formatted = task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '';

    const isOverdue = task.dueDate && !task.isCompleted
      ? isBefore(parseISO(task.dueDate), startOfToday())
      : false;

    return { completedSubtasks: completed, progress: prog, formattedDueDate: formatted, isPast: isOverdue };
  }, [task.subtasks, task.dueDate, task.isCompleted]);

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
        setIsAnimating(false);
      }, 600);
    }
  }, [task.id, onToggleSubtask, setCelebrating]);

  const handleToggleSubtask = useCallback((e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    handleSubtaskToggle(subtaskId);
  }, [handleSubtaskToggle]);

  const handleMainCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (!task.isCompleted) {
      setIsAnimating(true);
      setTimeout(() => {
        playBigCompletionSound();
        setCelebrating(true);
        onToggle(task.id);
        setIsAnimating(false);
      }, 600);
    } else {
      // Allow undoing completion immediately
      onToggle(task.id);
    }
  }, [task.isCompleted, task.id, onToggle, setCelebrating]);

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
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="mb-3"
    >
      <Card className={cn(
        "transition-all duration-200 overflow-hidden flex flex-col border-2 rounded-2xl relative bg-card border-zinc-200 dark:border-zinc-700 border-b-[5px]",
        task.isCompleted
          ? 'bg-muted/40 border-zinc-300 dark:border-zinc-600 border-b-0 translate-y-[5px] shadow-none opacity-70'
          : 'active:translate-y-[5px] active:border-b-0 active:shadow-none hover:border-zinc-300 dark:hover:border-zinc-600',
        isAnimating && 'animate-green-flash'
      )}>
        <div className="flex flex-col">
          <div className="flex items-center p-5 cursor-pointer" onClick={handleWrapperClick}>
            <div data-interactive-area className='flex items-center mr-4 shrink-0' onClick={handleMainCheckboxClick}>
              <div
                className={cn(
                  "h-9 w-9 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 relative overflow-hidden",
                  task.isCompleted
                    ? "bg-green-500 border-green-600 border-b-0 translate-y-[4px]"
                    : "bg-card border-border border-b-[4px] text-muted-foreground/20 hover:bg-muted/10 group-active:border-b-0 group-active:translate-y-[4px]",
                )}
              >
                {task.isCompleted && <Check className="h-6 w-6 text-white stroke-[4px] z-10" />}
              </div>
            </div>
            <div className="flex-1 min-w-0 py-2">
              <CardTitle className={cn("text-xl font-black leading-tight tracking-tight", task.isCompleted && 'line-through text-muted-foreground/60')}>
                {task.title}
              </CardTitle>

              {task.subtasks.length > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-3 flex-1 bg-muted rounded-full overflow-hidden border border-border/80 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                    <motion.div
                      className="h-full bg-primary rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[11px] font-black text-muted-foreground whitespace-nowrap tracking-tighter">{completedSubtasks} / {task.subtasks.length}</span>
                </div>
              )}

            </div>
            <div data-interactive-area className="flex items-center gap-2 ml-2">
              {isPast && !isExpanded ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-[10px] font-black uppercase tracking-tight border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl flex items-center gap-2 active:translate-y-[1px]"
                  onClick={handleEdit}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Assign New Date</span>
                  <span className="sm:hidden">Reschedule</span>
                </Button>
              ) : task.subtasks.length > 0 ? (
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-accent/50 rounded-xl border-2 border-transparent active:border-b-2 active:border-border active:translate-y-[1px]" onClick={handleCollapsibleToggle}>
                  <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-accent/50 rounded-xl text-muted-foreground/40 hover:text-primary transition-all border-2 border-transparent active:border-b-2 active:border-border active:translate-y-[1px]" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
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
                <Separator className="h-0.5 bg-border/60" />
                <div className="px-4 py-4">
                  <div className="space-y-3">
                    {task.subtasks.map((subtask, index) => (
                      <motion.div
                        key={subtask.id}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center group hover:bg-accent/40 rounded-2xl px-4 py-3 -mx-2 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-border/30"
                        onClick={(e) => { e.preventDefault(); handleSubtaskToggle(subtask.id) }}
                      >
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={subtask.isCompleted}
                          className="mr-4 h-6 w-6 rounded-lg border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          onClick={(e) => handleToggleSubtask(e, subtask.id)}
                        />
                        <label
                          htmlFor={`subtask-${subtask.id}`}
                          className={cn("text-sm font-medium cursor-pointer flex-1 transition-all duration-200 leading-snug", subtask.isCompleted && "line-through text-muted-foreground/60")}
                        >
                          {subtask.text}
                        </label>
                      </motion.div>
                    ))}
                  </div>
                  <form onSubmit={handleAddSubtask} className="mt-4 flex gap-2">
                    <Input
                      value={subtaskText}
                      onChange={e => setSubtaskText(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setTimeout(() => setInputFocused(false), 300)}
                      placeholder="Add a sub-quest..."
                      className="h-10 text-sm rounded-xl border-2 border-border/80 focus:border-primary/50 transition-all"
                    />
                    <Button type="submit" variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary border-2 border-transparent active:border-b-2 active:border-primary">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
                <Separator className="h-0.5 bg-border/60" />
                <div data-interactive-area className="flex justify-between items-center p-3 px-4 bg-muted/10">
                  <div className="text-xs font-black text-muted-foreground/60 flex items-center gap-2">
                    {task.dueDate && (
                      <div className="flex items-center gap-2 bg-secondary/10 px-2.5 py-1 rounded-xl border border-secondary/20 text-secondary font-black">
                        <Calendar className="h-4 w-4 stroke-[3px]" />
                        <span className="uppercase tracking-tight text-[11px]">Due {formattedDueDate}</span>
                      </div>
                    )}
                  </div>
                  <div className='flex items-center gap-1'>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-all rounded-xl hover:bg-primary/10" onClick={handleEdit}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit task</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive transition-all rounded-xl hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete task</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
