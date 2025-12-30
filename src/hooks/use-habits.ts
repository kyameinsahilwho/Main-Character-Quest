"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from '@/lib/types';
import { 
  startOfDay, 
  parseISO, 
  differenceInCalendarDays, 
  isToday, 
  isYesterday,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  eachWeekOfInterval,
  isSameWeek,
  eachMonthOfInterval,
  isSameMonth
} from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { XP_PER_RITUAL, STREAK_XP_BONUS, MAX_STREAK_BONUS } from '@/lib/level-system';

const HABITS_STORAGE_KEY = 'taskQuestHabits';
const SAVE_DEBOUNCE_MS = 500;

const calculateMaxGap = (frequency: Habit['frequency'], customDays?: number[]) => {
  if (frequency === 'every_2_days') return 2;
  if (frequency === 'every_3_days') return 3;
  if (frequency === 'every_4_days') return 4;
  if (frequency === 'weekly') return 7;
  if (frequency === 'monthly') return 31;
  
  if (frequency === 'specific_days' && customDays && customDays.length > 0) {
    const sortedDays = [...customDays].sort((a, b) => a - b);
    let maxGap = 0;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      maxGap = Math.max(maxGap, sortedDays[i+1] - sortedDays[i]);
    }
    // Check wrap around (e.g. Fri(5) to Mon(1) next week)
    maxGap = Math.max(maxGap, 7 - sortedDays[sortedDays.length - 1] + sortedDays[0]);
    return maxGap;
  }
  
  return 1; // daily
};

const calculateHabitXP = (completions: { completedAt: string }[], frequency: Habit['frequency'] = 'daily', customDays?: number[]) => {
  const sortedCompletions = [...completions]
    .map(c => startOfDay(parseISO(c.completedAt)))
    .sort((a, b) => a.getTime() - b.getTime());

  const totalXP = completions.length * XP_PER_RITUAL;

  let streakBonusXP = 0;
  if (sortedCompletions.length > 0) {
    let tempStreak = 1;
    const maxGap = calculateMaxGap(frequency, customDays);

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

const calculateYearlyStats = (
  completions: { completedAt: string }[], 
  frequency: Habit['frequency'], 
  createdAt: string, 
  customDays?: number[]
) => {
  const now = new Date();
  const year = now.getFullYear();
  const start = startOfYear(now);
  const end = endOfYear(now);
  
  let totalExpected = 0;
  let achieved = 0;

  const completionDates = completions.map(c => startOfDay(parseISO(c.completedAt)));
  const completionDateTimes = new Set(completionDates.map(d => d.getTime()));

  if (frequency === 'daily' || frequency === 'specific_days' || ['every_2_days', 'every_3_days', 'every_4_days'].includes(frequency)) {
    const days = eachDayOfInterval({ start, end });
    days.forEach(day => {
      let isScheduled = true;
      if (frequency === 'specific_days') {
        isScheduled = customDays?.includes(day.getDay()) ?? false;
      } else if (['every_2_days', 'every_3_days', 'every_4_days'].includes(frequency)) {
        const interval = parseInt(frequency.split('_')[1]);
        const startDate = startOfDay(parseISO(createdAt));
        const diffDays = differenceInCalendarDays(startOfDay(day), startDate);
        isScheduled = diffDays >= 0 && diffDays % interval === 0;
      }
      
      if (isScheduled) {
        totalExpected++;
        if (completionDateTimes.has(day.getTime())) {
          achieved++;
        }
      }
    });
  } else if (frequency === 'weekly') {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    totalExpected = weeks.length;
    weeks.forEach(week => {
      if (completions.some(c => isSameWeek(parseISO(c.completedAt), week, { weekStartsOn: 0 }))) {
        achieved++;
      }
    });
  } else if (frequency === 'monthly') {
    const months = eachMonthOfInterval({ start, end });
    totalExpected = months.length;
    months.forEach(month => {
      if (completions.some(c => isSameMonth(parseISO(c.completedAt), month))) {
        achieved++;
      }
    });
  }

  return { achieved, totalExpected, year };
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
            .order('created_at', { ascending: true });

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
            
            const now = new Date();
            const currentYear = now.getFullYear();
            const hasValidYearlyStats = dbHabit.stats_year === currentYear;

            return {
              id: dbHabit.id,
              title: dbHabit.title,
              description: dbHabit.description,
              frequency: dbHabit.frequency,
              currentStreak: dbHabit.current_streak,
              bestStreak: dbHabit.best_streak,
              color: dbHabit.color,
              icon: dbHabit.icon,
              createdAt: dbHabit.created_at,
              customDays: dbHabit.custom_days,
              completions,
              xp: calculateHabitXP(completions, dbHabit.frequency, dbHabit.custom_days),
              totalCompletions: dbHabit.total_completions ?? completions.length,
              yearlyStats: hasValidYearlyStats && dbHabit.yearly_achieved !== undefined && dbHabit.yearly_expected !== undefined
                ? { achieved: dbHabit.yearly_achieved, totalExpected: dbHabit.yearly_expected, year: dbHabit.stats_year! }
                : calculateYearlyStats(completions, dbHabit.frequency, dbHabit.created_at, dbHabit.custom_days),
            };
          });

          setHabits(loadedHabits);
          hasLoadedRef.current = true;
        } else {
          const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
          if (storedHabits) {
            const parsedHabits: Habit[] = JSON.parse(storedHabits);
            // Sort by createdAt ascending
            const sortedHabits = [...parsedHabits].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            // Ensure XP and stats are calculated/updated for local habits too
            const habitsWithStats = sortedHabits.map(habit => {
              const now = new Date();
              const needsYearlyUpdate = !habit.yearlyStats || habit.yearlyStats.year !== now.getFullYear();
              return {
                ...habit,
                xp: calculateHabitXP(habit.completions || [], habit.frequency, habit.customDays),
                totalCompletions: habit.completions.length,
                yearlyStats: needsYearlyUpdate 
                  ? calculateYearlyStats(habit.completions, habit.frequency, habit.createdAt, habit.customDays)
                  : habit.yearlyStats
              };
            });
            setHabits(habitsWithStats);
          }
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to load habits", error);
        const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
        if (storedHabits) {
          const parsedHabits: Habit[] = JSON.parse(storedHabits);
          // Sort by createdAt ascending
          const sortedHabits = [...parsedHabits].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const habitsWithStats = sortedHabits.map(habit => {
            const now = new Date();
            const needsYearlyUpdate = !habit.yearlyStats || habit.yearlyStats.year !== now.getFullYear();
            return {
              ...habit,
              xp: calculateHabitXP(habit.completions || [], habit.frequency, habit.customDays),
              totalCompletions: habit.completions.length,
              yearlyStats: needsYearlyUpdate 
                ? calculateYearlyStats(habit.completions, habit.frequency, habit.createdAt, habit.customDays)
                : habit.yearlyStats
            };
          });
          setHabits(habitsWithStats);
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
    const createdAt = new Date().toISOString();
    const yearlyStats = calculateYearlyStats([], habitData.frequency, createdAt, habitData.customDays);
    
    const newHabit: Habit = {
      ...habitData,
      id: crypto.randomUUID(),
      currentStreak: 0,
      bestStreak: 0,
      createdAt,
      completions: [],
      totalCompletions: 0,
      yearlyStats,
    };
    
    setHabits(prev => [...prev, newHabit]);

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
            current_streak: newHabit.currentStreak,
            best_streak: newHabit.bestStreak,
            color: newHabit.color,
            icon: newHabit.icon,
            created_at: newHabit.createdAt,
            custom_days: newHabit.customDays,
            total_completions: 0,
            yearly_achieved: yearlyStats.achieved,
            yearly_expected: yearlyStats.totalExpected,
            stats_year: yearlyStats.year,
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
          const maxGap = calculateMaxGap(habit.frequency, habit.customDays);
          
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
        const finalXP = calculateHabitXP(newCompletions, habit.frequency, habit.customDays);
        
        // Calculate yearly stats
        const yearlyStats = calculateYearlyStats(newCompletions, habit.frequency, habit.createdAt, habit.customDays);

        if (user) {
          supabase.from('habits')
            .update({ 
              current_streak: currentStreak, 
              best_streak: bestStreak,
              total_completions: newCompletions.length,
              yearly_achieved: yearlyStats.achieved,
              yearly_expected: yearlyStats.totalExpected,
              stats_year: yearlyStats.year,
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
          xp: finalXP,
          totalCompletions: newCompletions.length,
          yearlyStats
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
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const updatedHabit = { ...habit, ...updates };
        // If frequency or customDays changed, recalculate stats
        if (updates.frequency !== undefined || updates.customDays !== undefined) {
          updatedHabit.yearlyStats = calculateYearlyStats(
            habit.completions, 
            updatedHabit.frequency, 
            habit.createdAt, 
            updatedHabit.customDays
          );
          updatedHabit.xp = calculateHabitXP(habit.completions, updatedHabit.frequency, updatedHabit.customDays);
        }
        return updatedHabit;
      }
      return habit;
    }));

    if (user) {
      try {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.customDays !== undefined) dbUpdates.custom_days = updates.customDays;

        // If frequency or customDays changed, sync the new stats to DB
        if (updates.frequency !== undefined || updates.customDays !== undefined) {
          const habit = habits.find(h => h.id === id);
          if (habit) {
            const newYearlyStats = calculateYearlyStats(
              habit.completions, 
              updates.frequency || habit.frequency, 
              habit.createdAt, 
              updates.customDays || habit.customDays
            );
            dbUpdates.yearly_achieved = newYearlyStats.achieved;
            dbUpdates.yearly_expected = newYearlyStats.totalExpected;
            dbUpdates.stats_year = newYearlyStats.year;
          }
        }

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
