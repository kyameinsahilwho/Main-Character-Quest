"use client";

import { useTaskQuest } from '@/context/task-quest-context';
import { TaskView } from '@/components/task-view';

export default function HomePage() {
  const {
    tasks,
    toggleHabitCompletion,
    updateHabit,
    deleteHabit,
    handleToggleTask,
    deleteTask,
    setTaskToEdit,
    addSubtask,
    toggleSubtaskCompletion,
    setCelebrating
  } = useTaskQuest();

  return (
    <TaskView
      habits={[]}
      tasks={tasks}
      onToggleHabit={toggleHabitCompletion}
      onUpdateHabit={updateHabit}
      onDeleteHabit={deleteHabit}
      onToggleTask={handleToggleTask}
      onDeleteTask={deleteTask}
      onEditTask={setTaskToEdit}
      onAddSubtask={addSubtask}
      onToggleSubtask={toggleSubtaskCompletion}
      setCelebrating={setCelebrating}
    />
  );
}
