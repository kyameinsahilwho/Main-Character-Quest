"use client";

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface HeroStatsCardProps {
    levelInfo: {
        level: number;
        currentLevelXP: number;
        nextLevelXP: number;
        progress: number;
    };
    completionPercentage: number;
}

export function HeroStatsCard({ levelInfo, completionPercentage }: HeroStatsCardProps) {
    return (
        <div className="bg-card rounded-2xl p-5 border-2 border-border border-b-4 shadow-none">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Hero Stats</h3>
            <div className="flex flex-col gap-4">
                {/* Level Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-cyan-500">
                            <Star className="h-4 w-4 fill-cyan-500" />
                            <span className="text-xs font-black uppercase tracking-wide">Level {levelInfo.level}</span>
                        </div>
                        <span className="text-[11px] font-bold text-cyan-400">{Math.floor(levelInfo.currentLevelXP)} <span className="text-muted-foreground/40">/</span> {levelInfo.nextLevelXP} XP</span>
                    </div>
                    <div className="h-4 w-full bg-cyan-100/50 dark:bg-cyan-900/30 rounded-full cursor-pointer relative overflow-hidden ring-2 ring-cyan-100 dark:ring-cyan-900/40 ring-offset-0">
                        <div className="absolute top-1/4 left-2 right-2 h-1 bg-white/20 rounded-full z-10" />
                        <motion.div
                            className="h-full bg-cyan-400 rounded-full border-b-[3px] border-cyan-500 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(10, levelInfo.progress)}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                        >
                            <div className="absolute top-1 left-1 right-1 h-1 bg-white/20 rounded-full" />
                        </motion.div>
                    </div>
                </div>

                {/* Completion Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-green-500">
                            <div className="h-3.5 w-3.5 rounded-full border-4 border-green-500" />
                            <span className="text-xs font-black uppercase tracking-wide">Progress</span>
                        </div>
                        <span className="text-[11px] font-bold text-green-500">{Math.round(completionPercentage)}%</span>
                    </div>
                    <div className="h-4 w-full bg-green-100/50 dark:bg-green-900/30 rounded-full cursor-pointer relative overflow-hidden ring-2 ring-green-100 dark:ring-green-900/40 ring-offset-0">
                        <motion.div
                            className="h-full bg-green-500 rounded-full border-b-[3px] border-green-600 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                        >
                            <div className="absolute top-1 left-1 right-1 h-1 bg-white/20 rounded-full" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
