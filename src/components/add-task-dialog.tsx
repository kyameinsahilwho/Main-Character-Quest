"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Plus, Trash2, X } from "lucide-react"
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
  DialogTrigger,
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
import type { Task, Subtask, Project } from "@/lib/types"
import { playAddTaskSound } from "@/lib/sounds"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  dueDate: z.date().optional(),
  projectId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddTaskDialogProps {
  children: React.ReactNode
  onAddTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => void
  projects?: Project[]
}

export function AddTaskDialog({ children, onAddTask, projects = [] }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<{ text: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState(false);

  const initialViewportHeight = useRef<number>(0);
  const dialogJustOpened = useRef(false);

  // Mobile keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!open) {
      // Reset when dialog closes
      setIsMobileKeyboardOpen(false);
      dialogJustOpened.current = false;
      return;
    }

    const isMobile = 'ontouchstart' in window && window.innerWidth < 768;
    if (!isMobile) return;

    // Mark that dialog just opened
    dialogJustOpened.current = true;
    setTimeout(() => {
      dialogJustOpened.current = false;
    }, 1000);

    // Store initial height when dialog opens - use a slight delay to ensure we get the right value
    setTimeout(() => {
      if (window.visualViewport) {
        initialViewportHeight.current = window.visualViewport.height;
      } else {
        initialViewportHeight.current = window.innerHeight;
      }
    }, 100);

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
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      dueDate: new Date(),
    },
  })

  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const justAddedSubtask = useRef(false);

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      justAddedSubtask.current = true;
      setTimeout(() => {
        justAddedSubtask.current = false;
      }, 500);

      setSubtasks([...subtasks, { text: subtaskInput.trim() }]);
      setSubtaskInput("");
      // Keep focus to prevent keyboard from closing
      setTimeout(() => {
        subtaskInputRef.current?.focus();
      }, 0);
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };


  function onSubmit(values: FormValues) {
    const finalSubtasks = subtasks.map(st => ({
      id: crypto.randomUUID(),
      text: st.text,
      isCompleted: false
    }))

    setIsAdding(true);
    playAddTaskSound();

    setTimeout(() => {
      onAddTask({
        title: values.title,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        subtasks: finalSubtasks,
        projectId: values.projectId === "none" ? null : values.projectId
      })
      form.reset()
      setSubtasks([])
      setIsAdding(false);
      setOpen(false)
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing when mobile keyboard is open or dialog just opened
      if (!newOpen) {
        if (isMobileKeyboardOpen || dialogJustOpened.current) {
          return;
        }
      }
      setOpen(newOpen);
    }} modal={true}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px] touch-auto"
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
          <DialogTitle className="font-headline">Add a New Quest</DialogTitle>
          <DialogDescription>
            What challenge will you conquer next? Add details and sub-quests below.
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
                    <Input autoFocus placeholder="e.g., Conquer the Dragon's Lair" {...field} />
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
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Sub-Quests</FormLabel>
              <div className="mt-2 space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 text-sm p-2 bg-muted/50 rounded-md">{subtask.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => handleRemoveSubtask(index)}
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
              <Button
                type="submit"
                disabled={isAdding}
                className={cn(
                  "transition-all duration-200",
                  isAdding && "scale-95 opacity-70"
                )}
              >
                <Plus className={cn("mr-2 h-4 w-4", isAdding && "animate-spin")} />
                {isAdding ? "Adding..." : "Add Quest"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
