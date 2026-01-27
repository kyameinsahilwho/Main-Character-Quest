"use client";

import { motion } from "framer-motion";
import { Edit2, Trash2, Pin, MoreVertical, Tag } from "lucide-react";
import { Weblog } from "@/hooks/use-weblogs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WeblogItemProps {
    weblog: Weblog;
    onEdit: (weblog: Weblog) => void;
    onDelete: (id: any) => void;
    onTogglePin: (id: any) => void;
}

export function WeblogItem({ weblog, onEdit, onDelete, onTogglePin }: WeblogItemProps) {
    // Strip HTML and markdown for preview
    const previewText = weblog.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[#*`_\[\]()]/g, '') // Remove basic markdown chars
        .slice(0, 100) + (weblog.content.length > 100 ? "..." : "");

    const stickyNoteStyle = "bg-[#FEF9C3] dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                "group relative flex flex-col p-4 md:p-5 rounded-2xl border-2 border-b-4 transition-all shadow-sm hover:shadow-md cursor-pointer min-h-[140px] md:min-h-[160px]",
                stickyNoteStyle
            )}
            onClick={() => onEdit(weblog)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/50 flex items-center justify-center text-lg md:text-xl shadow-sm border border-black/5 shrink-0">
                        {weblog.emoji || "📝"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className={cn(
                            "font-black text-base md:text-lg leading-tight truncate text-slate-800 dark:text-slate-100",
                            weblog.isPinned && "flex items-center gap-1.5"
                        )}>
                            {weblog.title || "Untitled Note"}
                            {weblog.isPinned && <Pin className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600 fill-amber-600 shrink-0 inline-block" />}
                        </h3>
                        <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-500/80 mt-0.5">
                            {weblog.category || "Uncategorized"} • {formatDistanceToNow(new Date(weblog.updatedAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-8 md:w-8 rounded-lg hover:bg-black/5 text-slate-500"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 md:w-40 rounded-xl font-bold border-2 border-slate-200">
                            <DropdownMenuItem onClick={() => onTogglePin(weblog._id)} className="cursor-pointer text-sm">
                                <Pin className="w-4 h-4 mr-2" />
                                {weblog.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(weblog)} className="cursor-pointer text-sm">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(weblog._id)}
                                className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 mb-2">
                <p className="text-xs md:text-sm font-medium text-slate-700/80 dark:text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed">
                    {previewText || <span className="italic opacity-50">Empty note...</span>}
                </p>
            </div>

            {/* Tags */}
            {weblog.tags && weblog.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-auto">
                    {weblog.tags.slice(0, 3).map(tag => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-white/60 text-slate-500 font-medium rounded-md px-1.5 py-0 text-[9px] md:text-[10px] border-0"
                        >
                            #{tag}
                        </Badge>
                    ))}
                    {weblog.tags.length > 3 && (
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                            +{weblog.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Corner Fold Effect */}
            <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 pointer-events-none overflow-hidden rounded-tr-xl">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] md:border-t-[32px] border-r-[24px] md:border-r-[32px] border-t-black/5 border-r-transparent transform rotate-90 scale-0 group-hover:scale-100 transition-transform origin-top-right"></div>
            </div>
        </motion.div>
    );
}
