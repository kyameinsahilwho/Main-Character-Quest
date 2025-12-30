"use client";

import { useState } from 'react';
import { Folder, Plus, MoreVertical, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { Project, Task } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import TaskList from './task-list';
import { AddTaskDialog } from './add-task-dialog';

interface ProjectSectionProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject: (id: string, project: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  onDeleteProject: (id: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => 'subtask' | 'main' | 'none' | Promise<'subtask' | 'main' | 'none'>;
  onAddTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => void;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  setCelebrating: (celebrating: boolean) => void;
}

export default function ProjectSection({
  projects,
  tasks,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  onToggleSubtask,
  onAddTask,
  selectedProjectId,
  onSelectProject,
  setCelebrating,
}: ProjectSectionProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleUpdateProject = () => {
    if (editingProject && editingProject.name.trim()) {
      onUpdateProject(editingProject.id, { name: editingProject.name.trim() });
      setEditingProject(null);
      setIsEditDialogOpen(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto w-full">
      {selectedProjectId ? (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => onSelectProject(null)}
              className="p-0 h-auto hover:bg-transparent font-bold text-muted-foreground hover:text-foreground"
            >
              Projects
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-black text-xl">{selectedProject?.name}</span>
          </div>
          
          <TaskList
            tasks={projectTasks}
            listType="active"
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            setCelebrating={setCelebrating}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-card/50 rounded-3xl border-2 border-dashed border-border">
              <Folder className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold">No projects yet</p>
              <p className="text-sm">Create your first project to organize your quests!</p>
            </div>
          ) : (
            projects.map((project) => {
              const taskCount = tasks.filter(t => t.projectId === project.id).length;
              const completedCount = tasks.filter(t => t.projectId === project.id && t.isCompleted).length;
              const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

              return (
                <Card 
                  key={project.id}
                  className="group relative overflow-hidden border-2 border-b-[6px] border-border hover:border-primary/50 transition-all cursor-pointer rounded-3xl"
                  onClick={() => onSelectProject(project.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <Folder className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-black">{project.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2 border-border">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(project);
                              setIsEditDialogOpen(true);
                            }}
                            className="font-bold"
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project.id);
                            }}
                            className="text-destructive font-bold"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-muted-foreground">{taskCount} Quests</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-[2rem] border-4 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-headline">Edit Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project Name"
              value={editingProject?.name || ''}
              onChange={(e) => setEditingProject(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="rounded-xl border-2 border-border h-12 font-bold"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateProject()}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl border-2 border-border font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProject}
              className="rounded-xl border-2 border-b-4 border-primary bg-primary text-primary-foreground font-bold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
