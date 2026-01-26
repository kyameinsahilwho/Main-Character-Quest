"use client";

import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MobileBottomNavProps {
    activeTab: string;
    isQuickAddOpen: boolean;
    onToggleQuickAdd: () => void;
}

export function MobileBottomNav({
    activeTab,
    isQuickAddOpen,
    onToggleQuickAdd
}: MobileBottomNavProps) {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 bg-card/95 border-t-2 border-border backdrop-blur-md pb-safe">
            <div className="flex flex-col">
                <TabsList className="grid w-full grid-cols-5 p-2 h-auto bg-transparent border-0 rounded-none gap-1 relative">
                    <TabsTrigger
                        value="today"
                        className="relative rounded-xl data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-none transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90 group-data-[state=active]:[font-variation-settings:'FILL'_1]">swords</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="habits"
                        className="relative rounded-xl data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90 group-data-[state=active]:[font-variation-settings:'FILL'_1]">water_drop</span>
                    </TabsTrigger>

                    {/* Center Quick Add Button */}
                    <div className="flex items-center justify-center relative">
                        <button
                            onClick={onToggleQuickAdd}
                            className={`h-14 w-14 rounded-2xl text-white transition-all duration-200 flex items-center justify-center border-b-[5px] active:border-b-0 active:translate-y-[5px] mb-2 ${isQuickAddOpen
                                ? 'bg-red-500 border-red-600'
                                : 'bg-green-500 border-green-600'
                                }`}
                        >
                            <motion.div
                                animate={{ rotate: isQuickAddOpen ? 45 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Plus className="h-8 w-8 stroke-[4px]" />
                            </motion.div>
                        </button>
                    </div>

                    <TabsTrigger
                        value="projects"
                        className="relative rounded-xl data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-500 data-[state=active]:shadow-none transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90 group-data-[state=active]:[font-variation-settings:'FILL'_1]">folder_open</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="social"
                        className="relative rounded-xl data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-none transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90 group-data-[state=active]:[font-variation-settings:'FILL'_1]">group</span>
                    </TabsTrigger>
                </TabsList>
            </div>
        </nav >
    );
}
