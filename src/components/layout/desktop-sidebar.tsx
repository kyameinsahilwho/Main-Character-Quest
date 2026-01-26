"use client";

import Image from 'next/image';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroStatsCard } from './hero-stats-card';

interface DesktopSidebarProps {
    levelInfo: {
        level: number;
        currentLevelXP: number;
        nextLevelXP: number;
        progress: number;
    };
    completionPercentage: number;
}

export function DesktopSidebar({
    levelInfo,
    completionPercentage
}: DesktopSidebarProps) {
    return (
        <aside className="w-64 md:w-72 flex-col h-full shrink-0 overflow-y-auto z-20 hidden lg:flex p-6">
            {/* Logo */}
            <div className="mb-10 flex items-center gap-4 px-2">
                <Image
                    src="/favicon.ico"
                    alt="Logo"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain hover:scale-110 transition-transform duration-300 drop-shadow-sm"
                    quality={100}
                />
                <h1 className="text-2xl font-black tracking-tight text-foreground">Pollytasks</h1>
            </div>

            <div className="flex flex-col gap-6 h-full">
                {/* Navigation */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">Navigation</h3>



                    <TabsList className="flex flex-col h-auto bg-transparent border-0 p-0 gap-3 w-full">
                        <TabsTrigger
                            value="today"
                            className="sidebar-item flex items-center gap-3 px-4 py-3 rounded-2xl w-full justify-start mb-2
                bg-transparent hover:bg-muted text-muted-foreground border-2 border-transparent 
                transition-all duration-200 group relative overflow-hidden
                data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:border-green-600 data-[state=active]:border-b-[5px] data-[state=active]:shadow-none
                data-[state=active]:active:border-b-0 data-[state=active]:active:translate-y-[5px]"
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold z-10">swords</span>
                            <span className="text-sm font-extrabold uppercase tracking-wide z-10">Quests</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="habits"
                            className="sidebar-item flex items-center gap-3 px-4 py-3 rounded-2xl w-full justify-start mb-2
                bg-transparent hover:bg-muted text-muted-foreground border-2 border-transparent 
                transition-all duration-200 group relative overflow-hidden
                data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=active]:border-b-[5px] data-[state=active]:shadow-none
                data-[state=active]:active:border-b-0 data-[state=active]:active:translate-y-[5px]"
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold z-10">water_drop</span>
                            <span className="text-sm font-extrabold uppercase tracking-wide z-10">Rituals</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="projects"
                            className="sidebar-item flex items-center gap-3 px-4 py-3 rounded-2xl w-full justify-start mb-2
                bg-transparent hover:bg-muted text-muted-foreground border-2 border-transparent 
                transition-all duration-200 group relative overflow-hidden
                data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-600 data-[state=active]:border-b-[5px] data-[state=active]:shadow-none
                data-[state=active]:active:border-b-0 data-[state=active]:active:translate-y-[5px]"
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold z-10">folder_open</span>
                            <span className="text-sm font-extrabold uppercase tracking-wide z-10">Projects</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="social"
                            className="sidebar-item flex items-center gap-3 px-4 py-3 rounded-2xl w-full justify-start mb-2
                bg-transparent hover:bg-muted text-muted-foreground border-2 border-transparent 
                transition-all duration-200 group relative overflow-hidden
                data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=active]:border-b-[5px] data-[state=active]:shadow-none
                data-[state=active]:active:border-b-0 data-[state=active]:active:translate-y-[5px]"
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold z-10">group</span>
                            <span className="text-sm font-extrabold uppercase tracking-wide z-10">Squad</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="archive"
                            className="sidebar-item flex items-center gap-3 px-4 py-3 rounded-2xl w-full justify-start mb-2
                bg-transparent hover:bg-slate-100 text-slate-400 border-2 border-transparent 
                transition-all duration-200 group relative overflow-hidden
                data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:border-b-[5px] data-[state=active]:shadow-none
                data-[state=active]:active:border-b-0 data-[state=active]:active:translate-y-[5px]"
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold z-10">archive</span>
                            <span className="text-sm font-extrabold uppercase tracking-wide z-10">Archive</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Hero Stats */}
                <div className="mt-auto">
                    <HeroStatsCard levelInfo={levelInfo} completionPercentage={completionPercentage} />
                </div>
            </div>
        </aside>
    );
}
