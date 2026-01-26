"use client";

import { useState } from "react";
import { Habit, Task } from "@/lib/types";
import { Input } from "./ui/input";
import { Search, Archive, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { format } from "date-fns";
import TaskList from "./task-list";

interface ArchiveViewProps {
  habits: Habit[];
  tasks: Task[];
  onUnarchiveHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (id: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => any;
  setCelebrating: (val: boolean) => void;
}

export function ArchiveView({
  habits,
  tasks,
  onUnarchiveHabit,
  onDeleteHabit,
  onDeleteTask,
  onToggleTask,
  onEditTask,
  onAddSubtask,
  onToggleSubtask,
  setCelebrating
}: ArchiveViewProps) {
  const [search, setSearch] = useState("");

  const archivedHabits = habits.filter(h => h.archived);
  const completedTasks = tasks.filter(t => t.isCompleted);

  const filteredHabits = archivedHabits.filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTasks = completedTasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search archive..."
          className="pl-9 h-12 rounded-xl border-2 border-border font-bold"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black uppercase tracking-wide text-muted-foreground">Archived Rituals</h3>
        {filteredHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-bold">No archived rituals found</div>
        ) : (
          <div className="grid gap-4">
            {filteredHabits.map(habit => (
              <Card key={habit.id} className="border-2 border-border rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                      <span className="text-xl">{habit.icon || "🔥"}</span>
                    </div>
                    <div>
                      <h4 className="font-bold">{habit.title}</h4>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        {habit.frequency.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnarchiveHabit(habit.id)}
                      className="font-bold"
                    >
                      Unarchive
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="font-bold"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black uppercase tracking-wide text-muted-foreground">Completed Quests</h3>
        <TaskList
          tasks={filteredTasks}
          listType="completed"
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          setCelebrating={setCelebrating}
        />
      </div>
    </div>
  );
}
