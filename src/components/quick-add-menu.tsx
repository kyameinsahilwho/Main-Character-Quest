"use client";

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { AddHabitDialog } from "@/components/add-habit-dialog";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { Task, Habit, Project } from "@/lib/types";

interface QuickAddMenuProps {
    projects: Project[];
    selectedProjectId: string | null;
    onAddTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'createdAt'>) => void;
    onAddHabit: (habitData: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>) => void;
    onAddProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export interface QuickAddMenuRef {
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const menuItems = [
    {
        id: 'quest',
        label: 'Quest',
        icon: 'swords',
        color: 'bg-primary',
        shadowColor: 'shadow-[0_4px_0_0_hsl(142,76%,30%)]',
        description: 'New task to complete'
    },
    {
        id: 'ritual',
        label: 'Ritual',
        icon: 'water_drop',
        color: 'bg-indigo-500',
        shadowColor: 'shadow-[0_4px_0_0_#4338ca]',
        description: 'Daily habit to track'
    },
    {
        id: 'project',
        label: 'Project',
        icon: 'folder_open',
        color: 'bg-blue-500',
        shadowColor: 'shadow-[0_4px_0_0_#1d4ed8]',
        description: 'Group related quests'
    },
];

export const QuickAddMenu = forwardRef<QuickAddMenuRef, QuickAddMenuProps>(function QuickAddMenu({
    projects,
    selectedProjectId,
    onAddTask,
    onAddHabit,
    onAddProject,
    isOpen: controlledIsOpen,
    onOpenChange,
}, ref) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [activeDialog, setActiveDialog] = useState<string | null>(null);

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const setIsOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === 'function' ? value(isOpen) : value;
        if (onOpenChange) {
            onOpenChange(newValue);
        } else {
            setInternalIsOpen(newValue);
        }
    }, [isOpen, onOpenChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
    }), [setIsOpen]);

    const toggleMenu = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, [setIsOpen]);

    const handleMenuItemClick = useCallback((itemId: string) => {
        setActiveDialog(itemId);
        setIsOpen(false);
    }, [setIsOpen]);

    const handleDialogClose = useCallback(() => {
        setActiveDialog(null);
    }, []);

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Menu Container - Full width bottom sheet style */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="fixed bottom-20 lg:bottom-24 left-4 right-4 lg:left-auto lg:right-8 lg:w-80 z-50"
                    >
                        <div className="bg-card border-2 border-border rounded-2xl shadow-xl overflow-hidden">
                            {menuItems.map((item, index) => (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleMenuItemClick(item.id)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/50 active:bg-muted transition-colors ${index !== menuItems.length - 1 ? 'border-b border-border' : ''
                                        }`}
                                >
                                    {/* Icon Circle */}
                                    <div className={`w-12 h-12 rounded-full ${item.color} ${item.shadowColor} text-white flex items-center justify-center shrink-0`}>
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                    </div>
                                    {/* Text Content */}
                                    <div className="flex-1 text-left">
                                        <span className="font-bold text-base text-foreground block">{item.label}</span>
                                        <span className="text-xs text-muted-foreground">{item.description}</span>
                                    </div>
                                    {/* Arrow */}
                                    <span className="material-symbols-outlined text-muted-foreground text-xl">chevron_right</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop-only Main FAB Button */}
            <div className="hidden lg:block fixed bottom-8 right-8 z-50">
                <motion.button
                    onClick={toggleMenu}
                    whileTap={{ scale: 0.95 }}
                    className={`w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center
            transition-all duration-200 ${isOpen
                            ? 'bg-red-500 hover:bg-red-600 shadow-[0_4px_0_0_#b91c1c]'
                            : 'bg-primary hover:brightness-110 shadow-[0_4px_0_0_hsl(142,76%,30%)]'
                        } active:shadow-none active:translate-y-1`}
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isOpen ? (
                            <X className="h-8 w-8 stroke-[3px]" />
                        ) : (
                            <Plus className="h-8 w-8 stroke-[3px]" />
                        )}
                    </motion.div>
                </motion.button>
            </div>

            {/* Dialogs */}
            {activeDialog === 'quest' && (
                <AddTaskDialog
                    onAddTask={(taskData) => {
                        onAddTask(taskData);
                        handleDialogClose();
                    }}
                    projects={projects}
                    defaultProjectId={selectedProjectId}
                    forceProject={!!selectedProjectId}
                    defaultOpen={true}
                    onOpenChange={(open: boolean) => !open && handleDialogClose()}
                >
                    <span className="hidden" />
                </AddTaskDialog>
            )}

            {activeDialog === 'ritual' && (
                <AddHabitDialog
                    onAddHabit={(habitData) => {
                        onAddHabit(habitData);
                        handleDialogClose();
                    }}
                    defaultOpen={true}
                    onOpenChange={(open: boolean) => !open && handleDialogClose()}
                >
                    <span className="hidden" />
                </AddHabitDialog>
            )}

            {activeDialog === 'project' && (
                <AddProjectDialog
                    onAddProject={(projectData) => {
                        onAddProject(projectData);
                        handleDialogClose();
                    }}
                    defaultOpen={true}
                    onOpenChange={(open: boolean) => !open && handleDialogClose()}
                >
                    <span className="hidden" />
                </AddProjectDialog>
            )}
        </>
    );
});
