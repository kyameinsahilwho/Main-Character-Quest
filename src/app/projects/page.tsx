"use client";

import { useState } from 'react';
import { useTaskQuest } from '@/context/task-quest-context';
import ProjectSection from '@/components/project-section';

export default function ProjectsPage() {
  const {
    projects,
    tasks,
    addProject,
    updateProject,
    deleteProject,
    handleToggleTask,
    deleteTask,
    setTaskToEdit,
    addSubtask,
    toggleSubtaskCompletion,
    addTask,
    setCelebrating
  } = useTaskQuest();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <ProjectSection
      projects={projects}
      tasks={tasks}
      onAddProject={addProject}
      onUpdateProject={updateProject}
      onDeleteProject={deleteProject}
      onToggleTask={handleToggleTask}
      onDeleteTask={deleteTask}
      onEditTask={setTaskToEdit}
      onAddSubtask={addSubtask}
      onToggleSubtask={toggleSubtaskCompletion}
      onAddTask={addTask}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
      setCelebrating={setCelebrating}
    />
  );
}
