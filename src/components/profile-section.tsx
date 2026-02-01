"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Star,
    Flame,
    Trophy,
    Target,
    CheckCircle2,
    Calendar,
    Zap,
    Bell,
    BellOff,
    Moon,
    Sun,
    LogOut,
    TrendingUp,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { useTaskQuest } from "@/context/task-quest-context";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ProfileSectionProps {
    className?: string;
}

export function ProfileSection({ className }: ProfileSectionProps) {
    const {
        user,
        stats,
        streaks,
        levelInfo,
        tasks,
        habits,
        signOut,
        notificationState
    } = useTaskQuest();

    const userData = useQuery(api.users.viewer);

    // Local dark mode state using document class
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    const [showSignOutDialog, setShowSignOutDialog] = useState(false);

    // Calculate additional stats
    const totalTasksCompleted = userData?.tasksCompleted ?? stats.completedTasks;
    const totalXP = levelInfo.totalXP;
    const currentLevel = levelInfo.level;
    const currentStreak = streaks.current;
    const longestStreak = userData?.longestStreak ?? streaks.longest;

    // Calculate achievement count (milestones)
    const achievementCount = Math.floor(totalTasksCompleted / 10) +
        (currentStreak >= 7 ? 1 : 0) +
        (currentStreak >= 30 ? 1 : 0) +
        (currentLevel >= 5 ? 1 : 0) +
        (currentLevel >= 10 ? 1 : 0);

    // Calculate account age (days since creation)
    const memberSince = userData?._creationTime
        ? new Date(userData._creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Recently';

    // Active habits count
    const activeHabits = habits.filter(h => !h.archived).length;

    // Today's completed tasks
    const todaysCompletedTasks = tasks.filter(t => {
        if (!t.isCompleted || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt).toDateString();
        return completedDate === new Date().toDateString();
    }).length;

    const handleThemeToggle = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* Profile Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl border-2 border-violet-400/50 p-6 text-white"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-xl">
                            {user?.image ? (
                                <img src={user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl md:text-4xl font-black">
                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                                </span>
                            )}
                        </div>
                        {/* Level Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 text-xs font-black px-2.5 py-1 rounded-xl border-2 border-amber-500 shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {currentLevel}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-black truncate">
                            {user?.name || "Adventurer"}
                        </h1>
                        <p className="text-sm text-white/70 font-medium truncate mb-3">
                            {user?.email}
                        </p>

                        {/* XP Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-white/70">Level {currentLevel}</span>
                                <span className="text-white/90">{levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP</span>
                            </div>
                            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${levelInfo.progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="relative grid grid-cols-3 gap-3 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <Flame className="w-5 h-5 mx-auto mb-1 text-orange-300" />
                        <p className="text-lg font-black">{currentStreak}</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">Day Streak</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                        <p className="text-lg font-black">{totalXP.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">Total XP</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-300" />
                        <p className="text-lg font-black">{achievementCount}</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">Badges</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                    Statistics
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                        label="Tasks Completed"
                        value={totalTasksCompleted}
                        color="green"
                    />
                    <StatCard
                        icon={<Target className="w-5 h-5 text-blue-500" />}
                        label="Active Habits"
                        value={activeHabits}
                        color="blue"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
                        label="Longest Streak"
                        value={`${longestStreak} days`}
                        color="orange"
                    />
                    <StatCard
                        icon={<Sparkles className="w-5 h-5 text-purple-500" />}
                        label="Today's Progress"
                        value={`${todaysCompletedTasks} tasks`}
                        color="purple"
                    />
                </div>
            </div>

            {/* Achievements Showcase */}
            <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                    Achievements
                </h2>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card border-2 border-border border-b-4 rounded-2xl p-4"
                >
                    <div className="grid grid-cols-4 gap-3">
                        <AchievementBadge
                            unlocked={totalTasksCompleted >= 10}
                            icon={<CheckCircle2 className="w-6 h-6" />}
                            label="First 10"
                            description="Complete 10 tasks"
                        />
                        <AchievementBadge
                            unlocked={currentStreak >= 7}
                            icon={<Flame className="w-6 h-6" />}
                            label="Week Warrior"
                            description="7 day streak"
                        />
                        <AchievementBadge
                            unlocked={currentLevel >= 5}
                            icon={<Star className="w-6 h-6" />}
                            label="Rising Star"
                            description="Reach level 5"
                        />
                        <AchievementBadge
                            unlocked={currentStreak >= 30}
                            icon={<Trophy className="w-6 h-6" />}
                            label="Unstoppable"
                            description="30 day streak"
                        />
                    </div>
                    {achievementCount === 0 && (
                        <p className="text-center text-sm text-muted-foreground mt-4 font-medium">
                            Complete tasks and build streaks to unlock achievements!
                        </p>
                    )}
                </motion.div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                    Settings
                </h2>
                <div className="bg-card border-2 border-border border-b-4 rounded-2xl overflow-hidden">
                    {/* Theme Toggle */}
                    <SettingsItem
                        icon={isDarkMode ? <Moon className="w-5 h-5 text-violet-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                        label="Dark Mode"
                        description="Toggle dark/light theme"
                    >
                        <Switch
                            checked={isDarkMode}
                            onCheckedChange={handleThemeToggle}
                            className="data-[state=checked]:bg-violet-500"
                        />
                    </SettingsItem>

                    {/* Notifications */}
                    <SettingsItem
                        icon={notificationState.subscription ?
                            <Bell className="w-5 h-5 text-green-500" /> :
                            <BellOff className="w-5 h-5 text-muted-foreground" />
                        }
                        label="Push Notifications"
                        description={notificationState.subscription ? "Notifications enabled" : "Enable reminders"}
                    >
                        <Switch
                            checked={!!notificationState.subscription}
                            onCheckedChange={() => {
                                if (notificationState.subscription) {
                                    notificationState.unsubscribeFromPush();
                                } else {
                                    notificationState.subscribeToPush();
                                }
                            }}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </SettingsItem>

                    {/* Member Since */}
                    <SettingsItem
                        icon={<Calendar className="w-5 h-5 text-blue-500" />}
                        label="Member Since"
                        description={memberSince}
                        showDivider={false}
                    />
                </div>
            </div>

            {/* Sign Out */}
            <Button
                variant="outline"
                className="w-full gap-2 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold rounded-xl h-12"
                onClick={() => setShowSignOutDialog(true)}
            >
                <LogOut className="w-4 h-4" />
                Sign Out
            </Button>

            {/* Sign Out Confirmation Dialog */}
            <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <DialogContent className="sm:max-w-[350px] border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-3xl p-6">
                    <DialogHeader className="space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2 border-2 border-red-200 dark:border-red-800">
                            <LogOut className="w-8 h-8 text-red-500" />
                        </div>
                        <DialogTitle className="text-center text-xl font-black font-headline text-red-600 dark:text-red-400">
                            Sign Out?
                        </DialogTitle>
                        <DialogDescription className="text-center font-medium">
                            Are you sure you want to sign out? Your progress is safely saved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-xl border-b-[6px] border-red-700 hover:border-red-800 active:border-b-0 transition-all"
                            onClick={() => {
                                signOut();
                                setShowSignOutDialog(false);
                            }}
                        >
                            YES, SIGN OUT
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setShowSignOutDialog(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
}) {
    const bgColors: Record<string, string> = {
        green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
        blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
        purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
                "p-4 rounded-2xl border-2 transition-all",
                bgColors[color]
            )}
        >
            <div className="flex items-center gap-2 mb-2">
                {icon}
            </div>
            <p className="text-xl font-black text-foreground">{value}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
        </motion.div>
    );
}

// Achievement Badge Component
function AchievementBadge({ unlocked, icon, label, description }: {
    unlocked: boolean;
    icon: React.ReactNode;
    label: string;
    description: string;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative group"
        >
            <div className={cn(
                "w-full aspect-square rounded-2xl border-2 flex items-center justify-center transition-all",
                unlocked
                    ? "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                    : "bg-muted/50 border-border text-muted-foreground/50"
            )}>
                {icon}
                {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                            <span className="text-lg">🔒</span>
                        </div>
                    </div>
                )}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {unlocked ? label : description}
            </div>
        </motion.div>
    );
}

// Settings Item Component
function SettingsItem({ icon, label, description, children, showDivider = true }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    children?: React.ReactNode;
    showDivider?: boolean;
}) {
    return (
        <div className={cn(
            "flex items-center gap-4 p-4",
            showDivider && "border-b border-border"
        )}>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            {children}
        </div>
    );
}
