"use client";

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Flame, Trophy, TrendingUp, LogOut, User as UserIcon, LogIn, Star, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  notificationState?: {
    permission: NotificationPermission;
    isSupported: boolean;
    subscription: PushSubscription | null;
    subscribeToPush: () => Promise<void>;
    unsubscribeFromPush: () => Promise<void>;
  };
}

const getStreakStyles = (streak: number) => {
  if (streak >= 30) {
    return { 
      icon: "text-red-600 fill-red-600", 
      bg: "bg-red-500/10" 
    };
  }
  if (streak >= 14) {
    return { 
      icon: "text-orange-600 fill-orange-600", 
      bg: "bg-orange-500/10" 
    };
  }
  if (streak >= 7) {
    return { 
      icon: "text-orange-500 fill-orange-500", 
      bg: "bg-orange-500/10" 
    };
  }
  if (streak > 0) {
    return { 
      icon: "text-amber-500 fill-amber-500", 
      bg: "bg-amber-500/10" 
    };
  }
  return { icon: "text-muted-foreground", bg: "bg-muted/30" };
};

function Header({ stats, streaks, isInitialLoad, user, onSignOut, isSyncing, notificationState }: HeaderProps) {
  const streakStyles = streaks ? getStreakStyles(streaks.current) : getStreakStyles(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [prevXP, setPrevXP] = useState(0);

  useEffect(() => {
    if (stats?.levelInfo) {
      const currentXP = stats.levelInfo.totalXP;
      if (prevXP > 0 && currentXP > prevXP) {
        setXpGained(currentXP - prevXP);
        setShowXPAnimation(true);
        const timer = setTimeout(() => setShowXPAnimation(false), 2000);
        return () => clearTimeout(timer);
      }
      setPrevXP(currentXP);
    }
  }, [stats?.levelInfo?.totalXP]);

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="flex h-auto shrink-0 flex-col gap-2 md:gap-3 border-2 border-b-[6px] border-border bg-background/95 px-3 py-2 md:px-6 md:py-3 backdrop-blur-sm z-50 m-2 md:m-4 rounded-3xl md:mx-8 relative overflow-hidden shadow-lg">
      {/* 3D Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/50 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Image src="/favicon.ico" alt="Pollytasks Logo" width={64} height={64} className="w-14 h-14 md:w-16 md:h-16" />
            <h1 className="text-base md:text-xl font-black font-headline text-foreground tracking-tight hidden sm:block">
              Pollytasks
            </h1>
          </div>

          {isSyncing && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs text-blue-900 font-bold">Syncing...</span>
            </div>
          )}
        </div>

        {/* Mobile XP Bar / Completion */}
        {stats && !isInitialLoad && (
          <div className="flex md:hidden flex-1 mx-2">
            {stats.levelInfo ? (
              <div 
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 w-full rounded-2xl border-2 border-b-4 shadow-sm transition-all duration-500 relative overflow-hidden",
                  showXPAnimation ? "bg-primary/20 border-primary/30" : "bg-secondary/10 border-secondary/20"
                )}
              >
                <motion.div 
                  className={cn(
                    "absolute inset-y-0 left-0 transition-colors duration-500",
                    showXPAnimation ? "bg-primary/40" : "bg-secondary/30"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.levelInfo.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <div className="relative z-10">
                  <Star className={cn(
                    "h-4 w-4 stroke-[2.5px] animate-spin-slow transition-colors duration-500",
                    showXPAnimation ? "text-primary fill-primary" : "text-secondary fill-secondary"
                  )} />
                </div>
                <div className="flex flex-col relative z-10">
                  <span className="text-[10px] text-muted-foreground font-black leading-none uppercase">Level {stats.levelInfo.level}</span>
                  <span className="text-sm font-black font-headline leading-none mt-0.5">
                    {Math.floor(stats.levelInfo.currentLevelXP)}
                    <span className="text-[10px] text-muted-foreground ml-1 font-bold">/ {stats.levelInfo.nextLevelXP}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 w-full rounded-2xl border-2 border-b-4 border-primary/20 bg-primary/10 transition-all relative overflow-hidden"
              >
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-primary/30"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <div className="relative z-10">
                  <TrendingUp className="h-4 w-4 text-primary stroke-[2.5px]" />
                </div>
                <div className="flex flex-col relative z-10">
                  <span className="text-[10px] text-muted-foreground font-black leading-none uppercase">Completion</span>
                  <span className="text-sm font-black font-headline leading-none mt-0.5">{Math.round(stats.completionPercentage)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-4">
          {/* Notification Bell */}
          {notificationState?.isSupported && (
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-border bg-card hover:bg-accent transition-all"
              onClick={() => {
                if (notificationState.subscription) {
                  notificationState.unsubscribeFromPush();
                } else {
                  notificationState.subscribeToPush();
                }
              }}
              title={notificationState.subscription ? "Disable Push Notifications" : "Enable Push Notifications"}
            >
              {notificationState.subscription ? (
                <Bell className="h-5 w-5 text-primary fill-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              {notificationState.permission === 'granted' && !notificationState.subscription && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-amber-500 rounded-full border border-background" />
              )}
            </Button>
          )}

          {/* Auth Button/Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-border bg-card hover:bg-accent transition-all p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl border-2 border-border shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">Signed in</p>
                    <p className="text-xs leading-none text-muted-foreground truncate font-medium">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600 focus:text-red-600 cursor-pointer font-bold focus:bg-red-50 rounded-xl">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}

          {/* Stats on larger screens */}
          {stats && streaks && !isInitialLoad && (
            <div className="hidden lg:flex items-center gap-3">
              {/* Current Streak */}
              <div className={cn("flex items-center gap-2 px-4 py-2 rounded-2xl transition-all border-2 border-border bg-card shadow-sm hover:shadow-md relative overflow-hidden", streakStyles.bg)}>
                {/* Background Particles */}
                {streaks.current > 0 && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute bottom-[-4px] left-[10%] w-1 h-1 bg-orange-400/40 rounded-full animate-particle" style={{ animationDelay: '0s', animationDuration: '2s' }} />
                    <div className="absolute bottom-[-4px] left-[30%] w-1 h-1 bg-red-400/40 rounded-full animate-particle" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
                    <div className="absolute bottom-[-4px] left-[50%] w-1 h-1 bg-amber-400/40 rounded-full animate-particle" style={{ animationDelay: '1s', animationDuration: '2.2s' }} />
                    <div className="absolute bottom-[-4px] left-[70%] w-1 h-1 bg-orange-400/40 rounded-full animate-particle" style={{ animationDelay: '1.5s', animationDuration: '1.8s' }} />
                    <div className="absolute bottom-[-4px] left-[90%] w-1 h-1 bg-red-400/40 rounded-full animate-particle" style={{ animationDelay: '0.2s', animationDuration: '2.8s' }} />
                  </div>
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <Flame className={cn("h-5 w-5", streakStyles.icon)} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-black leading-none uppercase tracking-wider">Streak</span>
                    <span className="text-xl font-black font-headline leading-none mt-0.5 text-foreground">{streaks.current}</span>
                  </div>
                </div>
              </div>

              {/* Longest Streak */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border-2 border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="relative">
                  <Trophy className="h-5 w-5 text-amber-500 stroke-[3px]" />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-[10px] text-muted-foreground font-black leading-none uppercase tracking-wider">Best</span>
                  <span className="text-xl font-black font-headline leading-none mt-0.5 text-foreground">{streaks.longest}</span>
                </div>
              </div>

              {/* Level & XP */}
              {stats.levelInfo ? (
                <div className="relative group">
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 min-w-[220px] rounded-3xl border-2 border-b-4 shadow-sm hover:shadow-md transition-all duration-500 relative overflow-hidden",
                      showXPAnimation ? "bg-primary/20 border-primary/30" : "bg-secondary/10 border-secondary/20"
                    )}
                  >
                    <motion.div 
                      className={cn(
                        "absolute inset-y-0 left-0 transition-colors duration-500",
                        showXPAnimation ? "bg-primary/40" : "bg-secondary/30"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.levelInfo.progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    <div className="relative z-10">
                      <Star className={cn(
                        "h-6 w-6 stroke-[3px] drop-shadow-sm animate-spin-slow transition-colors duration-500",
                        showXPAnimation ? "text-primary fill-primary" : "text-secondary fill-secondary"
                      )} />
                    </div>
                    <div className="flex flex-col relative z-10">
                      <span className="text-xs text-muted-foreground font-black leading-none uppercase tracking-wider">Level {stats.levelInfo.level}</span>
                      <span className="text-2xl font-black font-headline leading-none mt-0.5 text-foreground">
                        {Math.floor(stats.levelInfo.currentLevelXP)}
                        <span className="text-sm text-muted-foreground ml-1 font-bold">/ {stats.levelInfo.nextLevelXP} XP</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-3 px-5 py-3 min-w-[200px] rounded-3xl border-b-4 border-primary/20 bg-primary/10 transition-all relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-primary/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.completionPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <div className="relative z-10">
                    <TrendingUp className="h-6 w-6 text-primary stroke-[3px] drop-shadow-sm" />
                  </div>
                  <div className="flex flex-col relative z-10">
                    <span className="text-xs text-muted-foreground font-black leading-none uppercase tracking-wider">Completion</span>
                    <span className="text-2xl font-black font-headline leading-none mt-0.5 text-foreground">{Math.round(stats.completionPercentage)}%</span>
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
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all whitespace-nowrap border-2 border-border bg-card shadow-sm relative overflow-hidden", streakStyles.bg)}>
            {/* Background Particles */}
            {streaks.current > 0 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute bottom-[-4px] left-[10%] w-0.5 h-0.5 bg-orange-400/40 rounded-full animate-particle" style={{ animationDelay: '0s', animationDuration: '2s' }} />
                <div className="absolute bottom-[-4px] left-[30%] w-0.5 h-0.5 bg-red-400/40 rounded-full animate-particle" style={{ animationDelay: '0.6s', animationDuration: '2.5s' }} />
                <div className="absolute bottom-[-4px] left-[50%] w-0.5 h-0.5 bg-amber-400/40 rounded-full animate-particle" style={{ animationDelay: '1.2s', animationDuration: '1.8s' }} />
                <div className="absolute bottom-[-4px] left-[70%] w-0.5 h-0.5 bg-orange-400/40 rounded-full animate-particle" style={{ animationDelay: '0.3s', animationDuration: '2.2s' }} />
                <div className="absolute bottom-[-4px] left-[90%] w-0.5 h-0.5 bg-red-400/40 rounded-full animate-particle" style={{ animationDelay: '0.8s', animationDuration: '2.7s' }} />
              </div>
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Flame className={cn("h-4 w-4", streakStyles.icon)} />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-black leading-none uppercase">Streak</span>
                <span className="text-base font-black font-headline leading-none mt-0.5">{streaks.current}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card whitespace-nowrap border-2 border-border shadow-sm transition-all relative overflow-hidden">
            <div className="relative">
              <Trophy className="h-4 w-4 text-amber-500 stroke-[2.5px]" />
            </div>
            <div className="flex flex-col relative">
              <span className="text-[10px] text-muted-foreground font-black leading-none uppercase">Best</span>
              <span className="text-base font-black font-headline leading-none mt-0.5">{streaks.longest}</span>
            </div>
          </div>

          {/* Level & XP - Hidden on mobile, shown on tablet */}
          {stats.levelInfo ? (
            <div className="relative hidden md:flex flex-1 min-w-[140px]">
              <div 
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 w-full rounded-2xl border-2 border-b-4 shadow-sm transition-all duration-500 relative overflow-hidden",
                  showXPAnimation ? "bg-primary/20 border-primary/30" : "bg-secondary/10 border-secondary/20"
                )}
              >
                <motion.div 
                  className={cn(
                    "absolute inset-y-0 left-0 transition-colors duration-500",
                    showXPAnimation ? "bg-primary/40" : "bg-secondary/30"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.levelInfo.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <div className="relative z-10">
                  <Star className={cn(
                    "h-4 w-4 stroke-[2.5px] animate-spin-slow transition-colors duration-500",
                    showXPAnimation ? "text-primary fill-primary" : "text-secondary fill-secondary"
                  )} />
                </div>
                <div className="flex flex-col relative z-10">
                  <span className="text-[10px] text-muted-foreground font-black leading-none uppercase">Level {stats.levelInfo.level}</span>
                  <span className="text-base font-black font-headline leading-none mt-0.5">
                    {Math.floor(stats.levelInfo.currentLevelXP)}
                    <span className="text-[10px] text-muted-foreground ml-1 font-bold">/ {stats.levelInfo.nextLevelXP}</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 flex-1 min-w-[140px] rounded-2xl border-2 border-b-4 border-primary/20 bg-primary/10 transition-all relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-y-0 left-0 bg-primary/30"
                initial={{ width: 0 }}
                animate={{ width: `${stats.completionPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <div className="relative z-10">
                <TrendingUp className="h-4 w-4 text-primary stroke-[2.5px]" />
              </div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] text-muted-foreground font-black leading-none uppercase">Completion</span>
                <span className="text-base font-black font-headline leading-none mt-0.5">{Math.round(stats.completionPercentage)}%</span>
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
