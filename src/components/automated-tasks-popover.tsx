"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, ListPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "./ui/checkbox"
import { Task } from "@/lib/types"
import { ScrollArea } from "./ui/scroll-area"

interface AutomatedTasksPopoverProps {
  children: React.ReactNode;
  tasks: Task[];
  onAddTasks: (taskIds: string[]) => void;
}

export function AutomatedTasksPopover({ children, tasks, onAddTasks }: AutomatedTasksPopoverProps) {
  const [open, setOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleAddTasks = () => {
    onAddTasks(selectedTaskIds)
    setSelectedTaskIds([])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <div className="p-4">
            <h4 className="font-medium leading-none">Add Automated Quests</h4>
            <p className="text-sm text-muted-foreground">
                Select quests to add to your list for today.
            </p>
        </div>

        <ScrollArea className="h-64">
            <div className="p-4 pt-0 space-y-2">
            {tasks.length > 0 ? (
                tasks.map(task => (
                <div
                    key={task.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleToggleTask(task.id)}
                >
                    <Checkbox
                    id={`auto-task-${task.id}`}
                    checked={selectedTaskIds.includes(task.id)}
                    onCheckedChange={() => handleToggleTask(task.id)}
                    />
                    <label
                    htmlFor={`auto-task-${task.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                    {task.title}
                    </label>
                </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No automated quests found.</p>
            )}
            </div>
        </ScrollArea>

        <div className="p-4 border-t">
            <Button onClick={handleAddTasks} className="w-full" disabled={selectedTaskIds.length === 0}>
                <ListPlus className="mr-2 h-4 w-4" />
                Add {selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'Quest' : 'Quests'}
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
