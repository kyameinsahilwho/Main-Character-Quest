"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Plus, Trash2, X, Pencil } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Task, Subtask } from "@/lib/types"

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  dueDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEditTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => void;
}

export function EditTaskDialog({ isOpen, onClose, task, onEditTask }: EditTaskDialogProps) {
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState(false);

  const initialViewportHeight = useRef<number>(0);

  // Mobile keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    const isMobile = 'ontouchstart' in window && window.innerWidth < 768;
    if (!isMobile) return;

    // Store initial height when dialog opens
    if (window.visualViewport) {
      initialViewportHeight.current = window.visualViewport.height;
    } else {
      initialViewportHeight.current = window.innerHeight;
    }

    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialViewportHeight.current - currentHeight;
      
      // If viewport shrunk by more than 150px, keyboard is likely open
      const keyboardOpen = heightDiff > 150;
      setIsMobileKeyboardOpen(keyboardOpen);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
      };
    }
  }, [isOpen]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      dueDate: undefined,
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      });
      setSubtasks(task.subtasks);
    }
  }, [task, form]);


  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const justAddedSubtask = useRef(false);

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      justAddedSubtask.current = true;
      setTimeout(() => {
        justAddedSubtask.current = false;
      }, 500);

      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        text: subtaskInput.trim(),
        isCompleted: false,
      };
      setSubtasks([...subtasks, newSubtask]);
      setSubtaskInput("");
      // Keep focus to prevent keyboard from closing
      setTimeout(() => {
        subtaskInputRef.current?.focus();
      }, 0);
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((sub) => sub.id !== id));
  };


  function onSubmit(values: FormValues) {
    onEditTask({
      title: values.title,
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      subtasks: subtasks
    })
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => {
      // Prevent closing when mobile keyboard is open
      if (!newOpen && isMobileKeyboardOpen) {
        return;
      }
      if (!newOpen) {
        onClose();
      }
    }} modal={true}>
      <DialogContent
        className="sm:max-w-[425px] touch-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Check if input is focused before allowing ESC to close
          const activeElement = document.activeElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent any pointer events outside from closing
          e.preventDefault();
        }}
        onFocusOutside={(e) => {
          // Prevent focus events from closing dialog
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Quest</DialogTitle>
          <DialogDescription>
            Update the details of your quest.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Conquer the Dragon's Lair" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Sub-Quests</FormLabel>
              <div className="mt-2 space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <span className="flex-1 text-sm p-2 bg-muted/50 rounded-md">{subtask.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  ref={subtaskInputRef}
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Add a sub-quest..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">
                <Pencil className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
