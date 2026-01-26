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
                        className="relative rounded-xl data-[state=active]:bg-transparent data-[state=active]:text-white transition-all font-bold py-3 h-auto group
              data-[state=inactive]:shadow-[0_4px_0_0_hsl(var(--border))] data-[state=inactive]:active:shadow-[0_1px_0_0_hsl(var(--border))] 
              data-[state=inactive]:active:translate-y-[3px] data-[state=inactive]:bg-card data-[state=inactive]:border data-[state=inactive]:border-border
              transform transition-transform duration-75"
                    >
                        {activeTab === 'today' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-x-0 inset-y-0 bg-green-500 rounded-xl shadow-none border-b-4 border-green-600 mb-1"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90">swords</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="habits"
                        className="relative rounded-xl data-[state=active]:bg-transparent data-[state=active]:text-white transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        {activeTab === 'habits' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-x-0 inset-y-0 bg-blue-500 rounded-xl shadow-none border-b-4 border-blue-600 mb-1"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90">water_drop</span>
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
                        className="relative rounded-xl data-[state=active]:bg-transparent data-[state=active]:text-white transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        {activeTab === 'projects' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-x-0 inset-y-0 bg-orange-500 rounded-xl shadow-none border-b-4 border-orange-600 mb-1"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90">folder_open</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="social"
                        className="relative rounded-xl data-[state=active]:bg-transparent data-[state=active]:text-white transition-all font-bold py-3 h-auto group
              data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
              transform transition-transform duration-75"
                    >
                        {activeTab === 'social' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-x-0 inset-y-0 bg-purple-500 rounded-xl shadow-none border-b-4 border-purple-600 mb-1"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="material-symbols-outlined text-2xl relative z-10 transition-transform duration-75 group-active:scale-90">group</span>
                    </TabsTrigger>
                </TabsList>
            </div>
        </nav >
    );
}
