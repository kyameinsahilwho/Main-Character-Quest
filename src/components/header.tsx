"use client";

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Flame, Trophy, TrendingUp, LogOut, User as UserIcon, LogIn, Star, Bell, BellOff, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { User } from '@/lib/types';
import { useSocial } from "@/hooks/use-social";
import { NotificationItem } from "@/components/notification-item";

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
  isAuthenticated?: boolean;
  notificationState?: {
    permission: NotificationPermission;
    isSupported: boolean;
    subscription: PushSubscription | null;
    subscribeToPush: () => Promise<void>;
    unsubscribeFromPush: () => Promise<void>;
  };
}

function Header({ stats, streaks, isInitialLoad, user, onSignOut, isSyncing, notificationState, isAuthenticated }: HeaderProps) {

  const [showNotifications, setShowNotifications] = useState(false);
  const social = useSocial();

  const handleMarkAllRead = async () => {
    await social.markNotificationsAsSeen();
  };

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 px-4 py-3 md:px-8 md:py-4 bg-background/80 backdrop-blur-md">
      <div className="w-full flex items-center justify-between bg-card rounded-2xl p-1.5 md:p-3 border-2 border-border shadow-sm max-w-6xl mx-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 ml-2">
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
          <span className="font-black text-xl text-foreground tracking-tight hidden xs:inline-block">Pollytasks</span>
        </div>

        {/* Stats & Actions */}
        <div className="flex gap-2 md:gap-6 ml-auto items-center">
          {/* Streak */}
          {stats && streaks && !isInitialLoad && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-card border-2 border-border rounded-2xl shadow-3d group hover:translate-y-[1px] hover:shadow-none transition-all cursor-default">
                <span className="material-symbols-outlined text-orange-500 text-xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase hidden sm:block">Streak</span>
                  <span className="font-black text-sm md:text-base text-foreground">{streaks.current}</span>
                </div>
              </div>

              {/* Level & XP Bar (Matching Reference) */}
              {stats.levelInfo && (
                <div className="relative h-11 md:h-12 flex items-center bg-[#E1F5FE] border-2 border-[#B3E5FC] rounded-2xl overflow-hidden min-w-[120px] md:min-w-[150px] shadow-sm group">
                  {/* Progress Fill */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(25, stats.levelInfo.progress)}%` }}
                    className="absolute inset-y-0 left-0 bg-[#81D4FA] transition-all duration-1000 ease-out"
                  />

                  {/* Content Overlay */}
                  <div className="relative flex items-center w-full px-2 md:px-3 gap-2">
                    <div className="flex-shrink-0 relative z-10 w-6 h-6 flex items-center justify-center">
                      <Star className="h-5 w-5 fill-[#0288D1] text-[#0288D1] drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="flex flex-col items-start leading-none z-10">
                      <span className="text-[10px] font-black text-[#546E7A] uppercase tracking-wide">
                        LEVEL {stats.levelInfo.level}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-base md:text-lg text-[#263238]">
                          {Math.floor(stats.levelInfo.currentLevelXP)}
                        </span>
                        <span className="text-[11px] font-bold text-[#546E7A]/70">
                          / {stats.levelInfo.nextLevelXP} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isInitialLoad && (
            <div className="flex items-center gap-2 md:gap-3">
              <Skeleton className="h-8 w-16 md:h-10 md:w-24 rounded-xl" />
              <Skeleton className="h-8 w-16 md:h-10 md:w-24 rounded-xl" />
            </div>
          )}

          {/* Notification Bell - Always visible, clickable */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Bell className={cn(
                "w-6 h-6 transition-colors",
                social.unreadCount > 0 ? "text-violet-500" : "text-muted-foreground"
              )} />
              {social.unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {social.unreadCount > 9 ? "9+" : social.unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute right-0 top-12 w-80 max-h-96 bg-card border-2 border-border border-b-4 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      {social.unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-violet-500 hover:text-violet-600 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-72 overflow-auto">
                      {social.notifications.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        social.notifications.map((notification: any) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onMarkRead={() => social.markNotificationsAsSeen([notification._id])}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Auth Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full border-2 border-border bg-card hover:bg-muted transition-all p-0 overflow-hidden ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs md:text-sm">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl border-2 border-border shadow-xl p-1.5" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-2 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">Signed in</p>
                    <p className="text-xs leading-none text-muted-foreground truncate font-medium">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border my-1" />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600 focus:text-red-600 cursor-pointer font-bold focus:bg-red-50 rounded-xl px-2 py-2">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAuthenticated ? (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted animate-pulse"></div>
          ) : (
            <Link href="/login">
              <button className="bg-primary hover:brightness-110 text-white font-bold text-[10px] md:text-xs uppercase tracking-wide py-2 px-3 md:py-2.5 md:px-6 rounded-xl shadow-3d-active active:shadow-none active:translate-y-1 transition-all">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
