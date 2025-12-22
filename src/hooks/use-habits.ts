"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from '@/lib/types';
import { startOfDay, parseISO, differenceInCalendarDays, isToday, isYesterday } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { XP_PER_RITUAL, STREAK_XP_BONUS, MAX_STREAK_BONUS } from '@/lib/level-system';

const HABITS_STORAGE_KEY = 'taskQuestHabits';
const SAVE_DEBOUNCE_MS = 500;

const calculateHabitXP = (completions: { completedAt: string }[], frequency: Habit['frequency'] = 'daily') => {
  const sortedCompletions = [...completions]
    .map(c => startOfDay(parseISO(c.completedAt)))
    .sort((a, b) => a.getTime() - b.getTime());

  const totalXP = completions.length * XP_PER_RITUAL;

  let streakBonusXP = 0;
  if (sortedCompletions.length > 0) {
    let tempStreak = 1;
    const maxGap = frequency === 'every_2_days' ? 2 : 
                   frequency === 'every_3_days' ? 3 : 
                   frequency === 'every_4_days' ? 4 : 1;

    for (let i = 1; i < sortedCompletions.length; i++) {
      const diff = differenceInCalendarDays(sortedCompletions[i], sortedCompletions[i-1]);
      if (diff <= maxGap) {
        tempStreak++;
        const bonus = Math.min(tempStreak * STREAK_XP_BONUS, MAX_STREAK_BONUS);
        streakBonusXP += bonus;
      } else {
        tempStreak = 1;
      }
    }
  }

  return totalXP + streakBonusXP;
};

export const useHabits = (user?: User | null) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Load habits from localStorage or Supabase
  useEffect(() => {
    const currentUserId = user?.id || null;
    if (lastUserIdRef.current !== currentUserId) {
      hasLoadedRef.current = false;
      lastUserIdRef.current = currentUserId;
    }
    
    if (hasLoadedRef.current) return;
    
    const loadHabits = async () => {
      try {
        if (user) {
          console.log('Loading habits from Supabase...');
          const { data: habitsData, error: habitsError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (habitsError) throw habitsError;

          const { data: completionsData, error: completionsError } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('user_id', user.id);

          if (completionsError) throw completionsError;

          const loadedHabits: Habit[] = (habitsData || []).map((dbHabit) => {
            const completions = (completionsData || [])
              .filter((c) => c.habit_id === dbHabit.id)
              .map((c) => ({
                id: c.id,
                habitId: c.habit_id,
                completedAt: c.completed_at,
              }));
            
            return {
              id: dbHabit.id,
              title: dbHabit.title,
              description: dbHabit.description,
              frequency: dbHabit.frequency,
              targetDays: dbHabit.target_days,
              currentStreak: dbHabit.current_streak,
              bestStreak: dbHabit.best_streak,
              color: dbHabit.color,
              icon: dbHabit.icon,
              createdAt: dbHabit.created_at,
              completions,
              xp: calculateHabitXP(completions, dbHabit.frequency),
            };
          });

          setHabits(loadedHabits);
          hasLoadedRef.current = true;
        } else {
          const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
          if (storedHabits) {
            const parsedHabits: Habit[] = JSON.parse(storedHabits);
            // Ensure XP is calculated for local habits too
            const habitsWithXP = parsedHabits.map(habit => ({
              ...habit,
              xp: calculateHabitXP(habit.completions || [], habit.frequency)
            }));
            setHabits(habitsWithXP);
          }
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to load habits", error);
        const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
        if (storedHabits) {
          const parsedHabits: Habit[] = JSON.parse(storedHabits);
          const habitsWithXP = parsedHabits.map(habit => ({
            ...habit,
            xp: calculateHabitXP(habit.completions || [], habit.frequency)
          }));
          setHabits(habitsWithXP);
        }
        hasLoadedRef.current = true;
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadHabits();
  }, [user, supabase]);

  // Save habits to localStorage
  useEffect(() => {
    if (!isInitialLoad) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
      }, SAVE_DEBOUNCE_MS);

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [habits, isInitialLoad]);

  const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: crypto.randomUUID(),
      currentStreak: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString(),
      completions: [],
    };
    
    setHabits(prev => [newHabit, ...prev]);

    if (user) {
      try {
        const { error } = await supabase
          .from('habits')
          .insert({
            id: newHabit.id,
            user_id: user.id,
            title: newHabit.title,
            description: newHabit.description,
            frequency: newHabit.frequency,
            target_days: newHabit.targetDays,
            current_streak: newHabit.currentStreak,
            best_streak: newHabit.bestStreak,
            color: newHabit.color,
            icon: newHabit.icon,
            created_at: newHabit.createdAt,
          });
        if (error) throw error;
      } catch (error) {
        console.error('Error syncing habit to Supabase:', error);
      }
    }
  }, [user, supabase]);

  const toggleHabitCompletion = useCallback(async (habitId: string, date: string) => {
    const targetDate = startOfDay(parseISO(date)).toISOString();
    
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const existingCompletionIndex = habit.completions.findIndex(c => 
          startOfDay(parseISO(c.completedAt)).getTime() === startOfDay(parseISO(targetDate)).getTime()
        );

        let newCompletions = [...habit.completions];
        if (existingCompletionIndex >= 0) {
          const completionToRemove = newCompletions[existingCompletionIndex];
          newCompletions.splice(existingCompletionIndex, 1);
          
          if (user) {
            supabase.from('habit_completions')
              .delete()
              .eq('id', completionToRemove.id)
              .then(({ error }) => {
                if (error) console.error('Error removing habit completion:', error);
              });
          }
        } else {
          const newCompletion = {
            id: crypto.randomUUID(),
            habitId,
            completedAt: targetDate,
          };
          newCompletions.push(newCompletion);

          if (user) {
            supabase.from('habit_completions')
              .insert({
                id: newCompletion.id,
                habit_id: habitId,
                user_id: user.id,
                completed_at: targetDate,
              })
              .then(({ error }) => {
                if (error) console.error('Error adding habit completion:', error);
              });
          }
        }
        
        // Recalculate streak and XP
        const sortedCompletions = [...newCompletions]
          .map(c => startOfDay(parseISO(c.completedAt)))
          .sort((a, b) => a.getTime() - b.getTime());

        let currentStreak = 0;
        let bestStreak = habit.bestStreak;

        if (sortedCompletions.length > 0) {
          const lastCompletion = sortedCompletions[sortedCompletions.length - 1];
          const maxGap = habit.frequency === 'every_2_days' ? 2 : 
                         habit.frequency === 'every_3_days' ? 3 : 
                         habit.frequency === 'every_4_days' ? 4 : 1;
          
          if (differenceInCalendarDays(new Date(), lastCompletion) <= maxGap) {
            currentStreak = 1;
            for (let i = sortedCompletions.length - 2; i >= 0; i--) {
              const diff = differenceInCalendarDays(sortedCompletions[i+1], sortedCompletions[i]);
              if (diff <= maxGap) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
        }

        bestStreak = Math.max(bestStreak, currentStreak);
        
        // Calculate XP: Base reward + streak bonus
        const finalXP = calculateHabitXP(newCompletions, habit.frequency);

        if (user) {
          supabase.from('habits')
            .update({ 
              current_streak: currentStreak, 
              best_streak: bestStreak,
            })
            .eq('id', habitId)
            .then(({ error }) => {
              if (error) console.error('Error updating habit streak:', error);
            });
        }
        
        return { 
          ...habit, 
          completions: newCompletions, 
          currentStreak, 
          bestStreak,
          xp: finalXP
        };
      }
      return habit;
    }));
  }, [user, supabase]);

  const deleteHabit = useCallback(async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (user) {
      try {
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting habit from Supabase:', error);
      }
    }
  }, [user, supabase]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completions'>>) => {
    setHabits(prev => prev.map(habit => habit.id === id ? { ...habit, ...updates } : habit));

    if (user) {
      try {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
        if (updates.targetDays !== undefined) dbUpdates.target_days = updates.targetDays;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;

        const { error } = await supabase
          .from('habits')
          .update(dbUpdates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating habit in Supabase:', error);
      }
    }
  }, [user, supabase]);

  return {
    habits,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    deleteHabit,
    isInitialLoad,
  };
};
