"use client";

import { Flame, Trophy, Percent, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Streaks } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

interface StatsPanelProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
  streaks: Streaks;
  isInitialLoad: boolean;
}

const StatCard = ({ icon, title, value, unit, description, isInitialLoad }: { icon: React.ReactNode, title: string, value: string | number, unit?: string, description?: string, isInitialLoad: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isInitialLoad ? <Skeleton className="h-8 w-24" /> : (
        <div className="text-2xl font-bold font-headline">
          {value}{unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export default function StatsPanel({ stats, streaks, isInitialLoad }: StatsPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-headline text-lg font-semibold text-foreground">Your Progress</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Current Streak"
          value={streaks.current}
          unit=" days"
          icon={<Flame className="h-4 w-4 text-muted-foreground" />}
          description={streaks.current > 0 ? "Keep it up!" : "Complete a task today!"}
          isInitialLoad={isInitialLoad}
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
