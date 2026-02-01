"use client";

import { useTaskQuest } from '@/context/task-quest-context';
import { ArchiveView } from '@/components/archive-view';

export default function ArchivePage() {
  const {
    habits,
    tasks,
    updateHabit,
    deleteHabit,
    deleteTask,
    handleToggleTask,
    setTaskToEdit,
    addSubtask,
    toggleSubtaskCompletion,
    setCelebrating
  } = useTaskQuest();

  return (
    <ArchiveView
      habits={habits}
      tasks={tasks}
      onUnarchiveHabit={(id) => updateHabit(id, { archived: false })}
      onDeleteHabit={deleteHabit}
      onDeleteTask={deleteTask}
      onToggleTask={handleToggleTask}
      onEditTask={setTaskToEdit}
      onAddSubtask={addSubtask}
      onToggleSubtask={toggleSubtaskCompletion}
      setCelebrating={setCelebrating}
    />
  );
}
