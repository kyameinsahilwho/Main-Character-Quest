"use client";

import { useTaskQuest } from '@/context/task-quest-context';
import { HabitTracker } from '@/components/habit-tracker';

export default function HabitsPage() {
  const {
    habits,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    deleteHabit
  } = useTaskQuest();

  return (
    <HabitTracker
      habits={habits}
      onAddHabit={addHabit}
      onUpdateHabit={updateHabit}
      onToggleHabit={toggleHabitCompletion}
      onDeleteHabit={deleteHabit}
    />
  );
}
