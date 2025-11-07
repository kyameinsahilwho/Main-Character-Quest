export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  subtasks: Subtask[];
  createdAt: string;
}

export interface Streaks {
  current: number;
  longest: number;
}
