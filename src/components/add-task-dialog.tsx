"use client"

import { useState, useEffect } from "react"
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
import type { Task, Subtask } from "@/lib/types"
import { playAddTaskSound } from "@/lib/sounds"

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  dueDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddTaskDialogProps {
  children: React.ReactNode
  onAddTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => void
}

export function AddTaskDialog({ children, onAddTask }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<{ text: string }[]>([]);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Detect keyboard open/close on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      // If height decreases significantly, keyboard is likely open
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setIsKeyboardOpen(viewportHeight < windowHeight * 0.75);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      dueDate: new Date(),
    },
  })

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, { text: subtaskInput.trim() }]);
      setSubtaskInput("");
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
        subtasks: finalSubtasks
      })
      form.reset()
      setSubtasks([])
      setIsAdding(false);
      setOpen(false)
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing when keyboard is open
      if (!newOpen && isKeyboardOpen) {
        return;
      }
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Always prevent closing on outside interaction
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
