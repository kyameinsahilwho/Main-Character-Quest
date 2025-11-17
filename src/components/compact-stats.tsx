"use client";

import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Streaks } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface CompactStatsProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
  streaks: Streaks;
  isInitialLoad: boolean;
}

const getStreakStyles = (streak: number) => {
  if (streak >= 30) {
    return { icon: "text-red-500 animate-pulse", bg: "bg-red-500/10" };
  }
  if (streak >= 14) {
    return { icon: "text-orange-500 animate-pulse", bg: "bg-orange-500/10" };
  }
  if (streak >= 7) {
    return { icon: "text-amber-500 animate-pulse", bg: "bg-amber-500/10" };
  }
  if (streak > 0) {
    return { icon: "text-lime-500", bg: "bg-lime-500/10" };
  }
  return { icon: "text-muted-foreground", bg: "bg-muted/30" };
};

export default function CompactStats({ stats, streaks, isInitialLoad }: CompactStatsProps) {
  const streakStyles = getStreakStyles(streaks.current);

  if (isInitialLoad) {
    return (
      <div className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border-2 border-foreground">
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-12 flex-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-card/50 rounded-xl border-2 border-foreground shadow-lg">
      {/* Current Streak */}
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-all", streakStyles.bg)}>
        <Flame className={cn("h-5 w-5", streakStyles.icon)} />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Streak</span>
          <span className="text-lg font-bold font-headline leading-none">{streaks.current}</span>
        </div>
      </div>

      {/* Longest Streak */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
        <Trophy className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Best</span>
          <span className="text-lg font-bold font-headline leading-none">{streaks.longest}</span>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="flex-1 min-w-[200px] flex items-center gap-3 px-3 py-2">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">Completion</span>
            <span className="text-lg font-bold font-headline">{stats.completionPercentage}%</span>
          </div>
          <Progress value={stats.completionPercentage} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}
