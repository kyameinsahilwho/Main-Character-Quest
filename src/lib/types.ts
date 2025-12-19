export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  subtasks: Subtask[];
  createdAt: string;
  isTemplate?: boolean;
  xp?: number;
  projectId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface Streaks {
  current: number;
  longest: number;
}

// Database types for Supabase
export interface DbSubtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string | null;
  reward_xp?: number;
  is_completed: boolean;
  is_template: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  project_id?: string | null;
}

export interface DbUserSettings {
  user_id: string;
  total_xp: number;
  level: number;
  tasks_completed: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  created_at: string;
  updated_at: string;
}

// Helper functions to convert between DB and App types
export function dbTaskToTask(dbTask: DbTask, subtasks: DbSubtask[]): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    dueDate: null, // Can be extended later
    isCompleted: dbTask.is_completed,
    completedAt: dbTask.completed_at || null,
    subtasks: subtasks.map(dbSubtaskToSubtask),
    createdAt: dbTask.created_at,
    isTemplate: dbTask.is_template,
    projectId: dbTask.project_id,
  };
}

export function dbProjectToProject(dbProject: DbProject): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description,
    color: dbProject.color,
    icon: dbProject.icon,
    createdAt: dbProject.created_at,
  };
}

export function dbSubtaskToSubtask(dbSubtask: DbSubtask): Subtask {
  return {
    id: dbSubtask.id,
    text: dbSubtask.title,
    isCompleted: dbSubtask.is_completed,
  };
}

export function taskToDbTask(task: Omit<Task, 'subtasks'>, userId: string): Omit<DbTask, 'created_at' | 'updated_at'> {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    is_completed: task.isCompleted,
    is_template: task.isTemplate || false,
    completed_at: task.completedAt,
    project_id: task.projectId,
  };
}

export function subtaskToDbSubtask(subtask: Subtask, taskId: string): Omit<DbSubtask, 'created_at' | 'updated_at'> {
  return {
    id: subtask.id,
    task_id: taskId,
    title: subtask.text,
    is_completed: subtask.isCompleted,
  };
}
