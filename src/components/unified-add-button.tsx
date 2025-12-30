"use client";

import { Plus, Sword, Flame, Folder, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTaskDialog } from "./add-task-dialog";
import { AddHabitDialog } from "./add-habit-dialog";
import { AddProjectDialog } from "./add-project-dialog";
import { AddReminderDialog } from "./add-reminder-dialog";
import { Project, Habit, Task, Reminder } from "@/lib/types";

interface UnifiedAddButtonProps {
  onAddTask: (taskData: any) => void;
  onAddHabit: (habitData: any) => void;
  onAddProject: (projectData: any) => void;
  onAddReminder: (reminderData: any) => void;
  projects: Project[];
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function UnifiedAddButton({ 
  onAddTask, 
  onAddHabit, 
  onAddProject,
  onAddReminder,
  projects, 
  className,
  side = "top",
  align = "center"
}: UnifiedAddButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className={className || "h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"}
          size="icon"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-56 p-2 gap-2">
        <AddHabitDialog onAddHabit={onAddHabit}>
          <div className="w-full" onSelect={(e: any) => e.preventDefault()}>
            <DropdownMenuItem 
              className="flex items-center gap-3 p-3 cursor-pointer focus:bg-indigo-50 focus:text-indigo-700 rounded-xl"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Flame className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">New Ritual</span>
                <span className="text-xs text-muted-foreground">Build a habit</span>
              </div>
            </DropdownMenuItem>
          </div>
        </AddHabitDialog>

        <AddTaskDialog onAddTask={onAddTask} projects={projects}>
          <div className="w-full" onSelect={(e: any) => e.preventDefault()}>
            <DropdownMenuItem 
              className="flex items-center gap-3 p-3 cursor-pointer focus:bg-green-50 focus:text-green-700 rounded-xl mt-1"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Sword className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">New Quest</span>
                <span className="text-xs text-muted-foreground">Add a task</span>
              </div>
            </DropdownMenuItem>
          </div>
        </AddTaskDialog>

        <AddProjectDialog onAddProject={onAddProject}>
          <div className="w-full" onSelect={(e: any) => e.preventDefault()}>
            <DropdownMenuItem 
              className="flex items-center gap-3 p-3 cursor-pointer focus:bg-blue-50 focus:text-blue-700 rounded-xl mt-1"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Folder className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">New Project</span>
                <span className="text-xs text-muted-foreground">Organize quests</span>
              </div>
            </DropdownMenuItem>
          </div>
        </AddProjectDialog>

        <AddReminderDialog onAddReminder={onAddReminder}>
          <div className="w-full" onSelect={(e: any) => e.preventDefault()}>
            <DropdownMenuItem 
              className="flex items-center gap-3 p-3 cursor-pointer focus:bg-yellow-50 focus:text-yellow-700 rounded-xl mt-1"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">New Reminder</span>
                <span className="text-xs text-muted-foreground">Set a notification</span>
              </div>
            </DropdownMenuItem>
          </div>
        </AddReminderDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
