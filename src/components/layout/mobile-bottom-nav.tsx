"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MobileBottomNavProps {
    activeTab: string;
    isQuickAddOpen: boolean;
    onToggleQuickAdd: () => void;
    onTabChange: (tab: string) => void;
}

export function MobileBottomNav({
    activeTab,
    isQuickAddOpen,
    onToggleQuickAdd,
    onTabChange
}: MobileBottomNavProps) {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const isMoreActive = activeTab === 'projects' || activeTab === 'archive';

    const handleMoreMenuItemClick = (tab: string) => {
        onTabChange(tab);
        setShowMoreMenu(false);
    };

    return (
        <>
            {/* More Menu Overlay */}
            <AnimatePresence>
                {showMoreMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-black/40 z-40"
                            onClick={() => setShowMoreMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="lg:hidden fixed bottom-24 right-4 z-50 bg-card rounded-2xl border-2 border-border shadow-2xl overflow-hidden min-w-[160px]"
                        >
                            <button
                                onClick={() => handleMoreMenuItemClick('projects')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none border-b border-border/50 ${
                                    activeTab === 'projects' 
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500' 
                                        : 'text-muted-foreground'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${activeTab === 'projects' ? "[font-variation-settings:'FILL'_1]" : ""}`}>folder_open</span>
                                <span className="font-bold text-sm">Projects</span>
                            </button>
                            <button
                                onClick={() => handleMoreMenuItemClick('archive')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none ${
                                    activeTab === 'archive' 
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400' 
                                        : 'text-muted-foreground'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${activeTab === 'archive' ? "[font-variation-settings:'FILL'_1]" : ""}`}>inventory_2</span>
                                <span className="font-bold text-sm">Archive</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                            value="weblog"
                            className="relative rounded-xl data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-none transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                        >
                            <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90 group-data-[state=active]:[font-variation-settings:'FILL'_1]">menu_book</span>
                        </TabsTrigger>

                        {/* More Menu Button */}
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`relative rounded-xl transition-all font-bold py-3 h-auto group transform transition-transform duration-75 flex items-center justify-center ${
                                isMoreActive 
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500' 
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90 ${isMoreActive ? "[font-variation-settings:'FILL'_1]" : ""}`}>
                                more_horiz
                            </span>
                        </button>
                    </TabsList>
                </div>
            </nav>
        </>
    );
}
