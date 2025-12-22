"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { CircleDashed, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import data from "@emoji-mart/data";

const emojiData = data as any;
const { ALL_EMOJIS, INITIAL_EMOJIS } = (() => {
  const allEmojis: any[] = [];
  const initialEmojis: any[] = [];
  const seen = new Set<string>();
  
  emojiData.categories.forEach((category: any) => {
    let categoryCount = 0;
    category.emojis.forEach((id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      
      const emoji = emojiData.emojis[id];
      if (emoji) {
        const emojiObj = {
          id,
          native: emoji.skins[0].native,
          name: emoji.name,
          keywords: emoji.keywords || []
        };
        
        allEmojis.push(emojiObj);
        
        if (categoryCount < 20) {
          initialEmojis.push(emojiObj);
          categoryCount++;
        }
      }
    });
  });
  
  return { ALL_EMOJIS: allEmojis, INITIAL_EMOJIS: initialEmojis };
})();

interface CompactIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

export const CompactIconPicker = memo(function CompactIconPicker({
  selectedIcon,
  onSelectIcon,
  selectedColor,
}: CompactIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get background color from the color string
  const getColorClass = useCallback((colorString: string) => {
    return colorString.split(' ')[0];
  }, []);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) {
      return INITIAL_EMOJIS; // Show 20 from each category by default
    }
    const term = search.toLowerCase();
    return ALL_EMOJIS.filter((e: any) => 
      e.name.toLowerCase().includes(term) || 
      e.keywords.some((k: string) => k.includes(term))
    ).slice(0, 100); // Limit results for performance
  }, [search]);

  const handleSelect = useCallback((emoji: string) => {
    onSelectIcon(emoji);
    setOpen(false);
    setSearch("");
  }, [onSelectIcon]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-b-4 transition-transform",
            selectedIcon
              ? `${getColorClass(selectedColor)} border-[#1E293B]/20 border-b-[#1E293B]/40 shadow-sm hover:scale-105 active:scale-95 active:border-b-2`
              : "bg-[#F1F4F9] border-[#E2E8F0] border-b-[#CBD5E1] hover:border-[#CBD5E1] hover:border-b-[#94A3B8]"
          )}
          title="Click to select icon"
        >
          {selectedIcon || <CircleDashed className="w-8 h-8 text-[#CBD5E1] stroke-[2]" />}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0 border-2 border-b-8 border-[#CBD5E1] rounded-[2rem] overflow-hidden shadow-2xl bg-white"
        align="start"
        sideOffset={12}
      >
        <div className="flex flex-col h-[350px]">
          <div className="p-3 border-b border-[#E2E8F0] bg-white z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="pl-9 h-10 bg-[#F1F4F9] border-transparent focus:bg-white focus:border-[#CBD5E1] rounded-xl text-sm font-bold text-[#1E293B] placeholder:text-[#94A3B8]"
                autoFocus
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#E2E8F0] rounded-full text-[#94A3B8]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-white">
            <div className="p-2 grid grid-cols-7 gap-1">
              {filteredEmojis.map((emoji: any) => (
                <button
                  key={emoji.id}
                  onClick={() => handleSelect(emoji.native)}
                  className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-[#F1F4F9] hover:scale-110 active:scale-95 transition-all cursor-pointer select-none"
                  title={emoji.name}
                >
                  {emoji.native}
                </button>
              ))}
              {filteredEmojis.length === 0 && (
                <div className="col-span-7 py-8 text-center text-sm font-bold text-[#94A3B8]">
                  No icons found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
});

export function IconPicker(props: CompactIconPickerProps) {
  return <CompactIconPicker {...props} />;
}

