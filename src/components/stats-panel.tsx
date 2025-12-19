"use client";

import { Flame, Trophy, Percent, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Streaks } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
  streaks: Streaks;
  isInitialLoad: boolean;
}

const StatCard = ({ icon, title, value, unit, description, isInitialLoad, className }: { icon: React.ReactNode, title: string, value: string | number, unit?: string, description?: string, isInitialLoad: boolean, className?: string }) => (
  <Card className={cn("border-b-4", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isInitialLoad ? <Skeleton className="h-8 w-24" /> : (
        <div className="text-2xl font-black font-headline">
          {value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
        </div>
      )}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const getStreakStyles = (streak: number) => {
    if (streak >= 30) {
      return { container: "bg-red-500/10 border-red-500/30", icon: "text-red-500 animate-pulse-strong", text: "text-red-500" };
    }
    if (streak >= 14) {
      return { container: "bg-orange-500/10 border-orange-500/30", icon: "text-orange-500 animate-pulse-medium", text: "text-orange-500" };
    }
    if (streak >= 7) {
      return { container: "bg-amber-500/10 border-amber-500/30", icon: "text-amber-500 animate-pulse", text: "text-amber-500" };
    }
    if (streak > 0) {
        return { container: "bg-lime-500/10 border-lime-500/30", icon: "text-lime-500", text: "text-lime-500" };
    }
    return { container: "", icon: "text-muted-foreground", text: "" };
};

export default function StatsPanel({ stats, streaks, isInitialLoad }: StatsPanelProps) {
  const streakStyles = getStreakStyles(streaks.current);

  return (
    <div className="space-y-4">
      <h2 className="font-headline text-lg font-semibold text-foreground">Your Progress</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Current Streak"
          value={streaks.current}
          unit=" days"
          icon={<Flame className={cn("h-4 w-4", streakStyles.icon)} />}
          description={streaks.current > 0 ? "Keep the fire alive!" : "Complete a task today!"}
          isInitialLoad={isInitialLoad}
          className={cn("transition-all", streakStyles.container)}
        />
        <StatCard
          title="Longest Streak"
          value={streaks.longest}
          unit=" days"
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
          description="Your personal best"
          isInitialLoad={isInitialLoad}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>Completion Rate</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isInitialLoad ? (
            <div className='space-y-2'>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-headline">{stats.completionPercentage}</span>
                <span className="text-lg font-semibold text-muted-foreground">%</span>
              </div>
              <Progress value={stats.completionPercentage} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} quests completed.
              </p>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
