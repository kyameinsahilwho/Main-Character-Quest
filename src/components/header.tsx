"use client";

import { memo } from 'react';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Streaks } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface HeaderProps {
  stats?: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
  streaks?: Streaks;
  isInitialLoad?: boolean;
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

function Header({ stats, streaks, isInitialLoad }: HeaderProps) {
  const streakStyles = streaks ? getStreakStyles(streaks.current) : getStreakStyles(0);

  return (
    <header className="flex h-auto shrink-0 flex-col border-b-2 border-border px-4 md:px-6 py-4 gap-4 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="crown and sword">👑⚔️</span>
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Main Character Quest
          </h1>
        </div>

        {/* Stats on larger screens */}
        {stats && streaks && !isInitialLoad && (
          <div className="hidden lg:flex items-center gap-4">
            {/* Current Streak */}
            <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all border-2 border-border shadow-md", streakStyles.bg)}>
              <Flame className={cn("h-6 w-6", streakStyles.icon)} />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium leading-none">Streak</span>
                <span className="text-2xl font-bold font-headline leading-none mt-1">{streaks.current}</span>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40 border-2 border-border shadow-md">
              <Trophy className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium leading-none">Best</span>
                <span className="text-2xl font-bold font-headline leading-none mt-1">{streaks.longest}</span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="flex items-center gap-3 px-4 py-2.5 min-w-[200px] rounded-xl bg-muted/40 border-2 border-border shadow-md">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">Completion</span>
                  <span className="text-2xl font-bold font-headline">{stats.completionPercentage}%</span>
                </div>
                <Progress value={stats.completionPercentage} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {isInitialLoad && (
          <div className="hidden lg:flex items-center gap-4">
            <Skeleton className="h-14 w-28" />
            <Skeleton className="h-14 w-28" />
            <Skeleton className="h-14 w-40" />
          </div>
        )}
      </div>

      {/* Stats bar on mobile/tablet */}
      {stats && streaks && !isInitialLoad && (
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1">
          <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap border border-border", streakStyles.bg)}>
            <Flame className={cn("h-5 w-5", streakStyles.icon)} />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium leading-none">Streak</span>
              <span className="text-xl font-bold font-headline leading-none mt-1">{streaks.current}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 whitespace-nowrap border border-border">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium leading-none">Best</span>
              <span className="text-xl font-bold font-headline leading-none mt-1">{streaks.longest}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 flex-1 min-w-[160px] rounded-lg bg-muted/40 border border-border">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">Completion</span>
                <span className="text-xl font-bold font-headline">{stats.completionPercentage}%</span>
              </div>
              <Progress value={stats.completionPercentage} className="h-1.5" />
            </div>
          </div>
        </div>
      )}

      {isInitialLoad && (
        <div className="flex lg:hidden items-center gap-2">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 flex-1" />
        </div>
      )}
    </header>
  );
}

export default memo(Header);
