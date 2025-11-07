"use client"

import { useState } from "react"
import { ListPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "./ui/checkbox"
import type { Task } from "@/lib/types"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"

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

  const handleToggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(tasks.map(task => task.id))
    }
  }

  const handleAddTasks = () => {
    onAddTasks(selectedTaskIds)
    setSelectedTaskIds([])
    setOpen(false)
  }

  const allSelected = selectedTaskIds.length === tasks.length && tasks.length > 0;
  const someSelected = selectedTaskIds.length > 0 && !allSelected;

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

        <Separator />

        {tasks.length > 0 && (
            <div
                className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent transition-colors cursor-pointer mx-4 mt-2"
                onClick={handleToggleSelectAll}
            >
                <Checkbox
                    id="select-all-automated"
                    checked={allSelected}
                    data-state={someSelected ? "indeterminate" : (allSelected ? "checked" : "unchecked")}
                    onCheckedChange={handleToggleSelectAll}
                />
                <label
                    htmlFor="select-all-automated"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                    Select All
                </label>
            </div>
        )}

        <ScrollArea className="h-64">
            <div className="p-4 pt-2 space-y-2">
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
