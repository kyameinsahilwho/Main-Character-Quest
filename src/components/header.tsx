"use client";

import { memo } from 'react';
import { Flame, Trophy, TrendingUp, LogOut, User as UserIcon, LogIn, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Streaks } from '@/lib/types';
import type { LevelInfo } from '@/lib/level-system';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  stats?: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    levelInfo?: LevelInfo;
  };
  streaks?: Streaks;
  isInitialLoad?: boolean;
  user?: User | null;
  onSignOut?: () => void;
  isSyncing?: boolean;
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

function Header({ stats, streaks, isInitialLoad, user, onSignOut, isSyncing }: HeaderProps) {
  const streakStyles = streaks ? getStreakStyles(streaks.current) : getStreakStyles(0);

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="flex h-auto shrink-0 flex-col gap-2 md:gap-3 border-2 border-foreground bg-background/95 px-3 py-2 md:px-6 md:py-3 shadow-[3px_3px_0px_0px_hsl(var(--foreground))] backdrop-blur-sm z-50 m-2 md:m-4 rounded-xl md:mx-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl filter drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" role="img" aria-label="crown and sword">👑⚔️</span>
          <h1 className="text-base md:text-xl font-bold font-headline text-foreground drop-shadow-[1px_1px_0_rgba(255,255,255,0.5)] dark:drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
            Main Character Quest
          </h1>
          {isSyncing && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse border border-foreground" />
              <span className="text-xs text-blue-900 font-bold">Syncing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Auth Button/Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-foreground bg-card shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">Signed in</p>
                    <p className="text-xs leading-none text-muted-foreground truncate font-medium">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-foreground" />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600 focus:text-red-600 cursor-pointer font-bold focus:bg-red-100 focus:text-red-700 rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="gap-2 rounded-md border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] transition-all bg-primary text-primary-foreground font-bold">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}

          {/* Stats on larger screens */}
          {stats && streaks && !isInitialLoad && (
            <div className="hidden lg:flex items-center gap-3">
              {/* Current Streak */}
              <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] relative overflow-hidden bg-card", streakStyles.bg)}>
                <div className="relative">
                  <Flame className={cn("h-4 w-4 stroke-[3px]", streakStyles.icon)} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-[10px] text-muted-foreground font-bold leading-none uppercase tracking-wider">Streak</span>
                  <span className="text-lg font-black font-headline leading-none mt-0.5">{streaks.current}</span>
                </div>
              </div>

              {/* Longest Streak */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all relative overflow-hidden">
                <div className="relative">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-500 stroke-[3px]" />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-[10px] text-muted-foreground font-bold leading-none uppercase tracking-wider">Best</span>
                  <span className="text-lg font-black font-headline leading-none mt-0.5">{streaks.longest}</span>
                </div>
              </div>

              {/* Level & XP */}
              {stats.levelInfo ? (
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 min-w-[180px] rounded-xl border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, #60a5fa ${stats.levelInfo.progress}%, hsl(var(--card)) ${stats.levelInfo.progress}%)`
                  }}
                >
                  <div className="relative z-10">
                    <Star className="h-4 w-4 text-blue-800 dark:text-blue-900 stroke-[3px]" />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-foreground font-bold uppercase tracking-wider">Level {stats.levelInfo.level}</span>
                      <span className="text-[10px] text-foreground font-bold">{Math.floor(stats.levelInfo.currentLevelXP)}/{stats.levelInfo.nextLevelXP} XP</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 min-w-[160px] rounded-xl border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, #86efac ${stats.completionPercentage}%, hsl(var(--card)) ${stats.completionPercentage}%)`
                  }}
                >
                  <div className="relative z-10">
                    <TrendingUp className="h-4 w-4 text-green-800 dark:text-green-900 stroke-[3px]" />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-foreground font-bold uppercase tracking-wider">Completion</span>
                      <span className="text-lg font-black font-headline leading-none mt-0.5">{Math.round(stats.completionPercentage)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isInitialLoad && (
            <div className="hidden lg:flex items-center gap-3">
              <Skeleton className="h-10 w-24 rounded-xl border-2 border-foreground" />
              <Skeleton className="h-10 w-24 rounded-xl border-2 border-foreground" />
              <Skeleton className="h-10 w-32 rounded-xl border-2 border-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Stats bar on mobile/tablet */}
      {stats && streaks && !isInitialLoad && (
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <div className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] relative overflow-hidden bg-card", streakStyles.bg)}>
            <div className="relative">
              <Flame className={cn("h-3.5 w-3.5 stroke-[2.5px]", streakStyles.icon)} />
            </div>
            <div className="flex flex-col relative">
              <span className="text-[10px] text-muted-foreground font-bold leading-none uppercase">Streak</span>
              <span className="text-base font-black font-headline leading-none mt-0.5">{streaks.current}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-card whitespace-nowrap border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all relative overflow-hidden">
            <div className="relative">
              <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 stroke-[2.5px]" />
            </div>
            <div className="flex flex-col relative">
              <span className="text-[10px] text-muted-foreground font-bold leading-none uppercase">Best</span>
              <span className="text-base font-black font-headline leading-none mt-0.5">{streaks.longest}</span>
            </div>
          </div>

          {/* Level & XP */}
          {stats.levelInfo ? (
            <div 
              className="flex items-center gap-2 px-2.5 py-1.5 flex-1 min-w-[140px] rounded-xl border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, #60a5fa ${stats.levelInfo.progress}%, hsl(var(--card)) ${stats.levelInfo.progress}%)`
              }}
            >
              <div className="relative z-10">
                <Star className="h-3.5 w-3.5 text-blue-800 dark:text-blue-900 stroke-[2.5px]" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-foreground font-bold uppercase">Level {stats.levelInfo.level}</span>
                  <span className="text-[10px] text-foreground font-bold">{Math.floor(stats.levelInfo.currentLevelXP)}/{stats.levelInfo.nextLevelXP} XP</span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 px-2.5 py-1.5 flex-1 min-w-[140px] rounded-xl border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, #86efac ${stats.completionPercentage}%, hsl(var(--card)) ${stats.completionPercentage}%)`
              }}
            >
              <div className="relative z-10">
                <TrendingUp className="h-3.5 w-3.5 text-green-800 dark:text-green-900 stroke-[2.5px]" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-foreground font-bold uppercase">Completion</span>
                  <span className="text-base font-black font-headline">{stats.completionPercentage}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isInitialLoad && (
        <div className="flex lg:hidden items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 flex-1" />
        </div>
      )}
    </header>
  );
}

export default memo(Header);
