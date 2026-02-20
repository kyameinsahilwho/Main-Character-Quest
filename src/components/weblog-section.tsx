"use client";

import { useState } from "react";
import { Plus, Search, Tag, X } from "lucide-react";
import { useWeblogs, Weblog } from "@/hooks/use-weblogs";
import { WeblogItem } from "./weblog-item";
import { WeblogEditor } from "./weblog-editor";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Doc } from "../../convex/_generated/dataModel";

interface WeblogSectionProps {
    initialWeblogs?: Doc<"weblogs">[];
}

export function WeblogSection({ initialWeblogs }: WeblogSectionProps) {
    const { weblogs, allTags, addWeblog, updateWeblog, deleteWeblog, togglePin } = useWeblogs(initialWeblogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingWeblog, setEditingWeblog] = useState<Weblog | null>(null);

    // Filter weblogs
    const filteredWeblogs = weblogs?.filter(log => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (log.title?.toLowerCase() || "").includes(searchLower) ||
            (log.content?.toLowerCase() || "").includes(searchLower) ||
            (log.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false);
        const matchesCategory = selectedCategory ? log.category === selectedCategory : true;
        const matchesTags = selectedTags.length === 0 || 
            selectedTags.every(tag => log.tags?.includes(tag));

        return matchesSearch && matchesCategory && matchesTags;
    }) || [];

    const handleCreateNew = () => {
        setEditingWeblog(null);
        setEditorOpen(true);
    };

    const handleEdit = (weblog: Weblog) => {
        setEditingWeblog(weblog);
        setEditorOpen(true);
    };

    const handleSave = async (data: any) => {
        if (data.id) {
            await updateWeblog(data.id, data);
        } else {
            await addWeblog(data);
        }
    };

    const toggleTagFilter = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedTags([]);
        setSearchQuery("");
    };

    const hasActiveFilters = selectedCategory || selectedTags.length > 0 || searchQuery;

    return (
        <div className="flex flex-col h-full gap-4 md:gap-6 pb-24 relative">

            {/* Header / Filter Bar */}
            <div className="flex flex-col gap-3 md:gap-4">
                {/* Search and Categories Row */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-start md:items-center">
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border-2 border-b-4 shrink-0 ${selectedCategory === null
                                ? "bg-slate-800 text-white border-slate-900"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            All
                        </button>
                        {[
                            { id: "journal", label: "Journal", icon: "📔", color: "rose" },
                            { id: "ideas", label: "Ideas", icon: "💡", color: "amber" },
                            { id: "learning", label: "Learning", icon: "📚", color: "cyan" },
                            { id: "personal", label: "Personal", icon: "📝", color: "violet" }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                                className={`px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wide transition-all border-2 border-b-4 flex items-center gap-1 md:gap-1.5 shrink-0 ${selectedCategory === cat.id
                                    ? `bg-${cat.color}-500 text-white border-${cat.color}-700`
                                    : `bg-white border-slate-200 text-slate-500 hover:bg-${cat.color}-50`
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span className="hidden sm:inline">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes..."
                            className="pl-9 bg-white border-2 border-slate-200 rounded-xl focus-visible:ring-0 focus-visible:border-slate-400 font-bold placeholder:font-normal h-9 md:h-10"
                        />
                    </div>
                </div>

                {/* Tags Filter Row */}
                {allTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1.5 flex-nowrap">
                            {allTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    onClick={() => toggleTagFilter(tag)}
                                    className={`cursor-pointer rounded-lg px-2 py-0.5 text-[10px] md:text-xs font-medium shrink-0 transition-all ${
                                        selectedTags.includes(tag)
                                            ? "bg-slate-800 text-white hover:bg-slate-700"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    }`}
                                >
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="ml-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 shrink-0"
                            >
                                <X className="w-3 h-3" />
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Note Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 auto-rows-max">
                {/* Create New Card */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNew}
                    className="flex flex-col items-center justify-center p-4 md:p-6 min-h-[120px] md:min-h-[160px] rounded-2xl border-4 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100 transition-all group cursor-pointer"
                >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-2 md:mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-slate-600" />
                    </div>
                    <span className="font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest text-xs md:text-sm">Create Note</span>
                </motion.button>

                <AnimatePresence mode="popLayout">
                    {filteredWeblogs.map((weblog) => (
                        <WeblogItem
                            key={weblog._id}
                            weblog={weblog}
                            onEdit={handleEdit}
                            onDelete={deleteWeblog}
                            onTogglePin={togglePin}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredWeblogs.length === 0 && (searchQuery || selectedCategory || selectedTags.length > 0) && (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center opacity-60">
                    <Search className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-slate-300" />
                    <p className="font-black text-slate-400 text-base md:text-lg">No matches found</p>
                    <button
                        onClick={clearFilters}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Full Editor Modal */}
            <WeblogEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                weblog={editingWeblog}
                onSave={handleSave}
                existingTags={allTags}
            />
        </div>
    );
}
