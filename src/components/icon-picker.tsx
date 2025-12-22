"use client";

import { useState, memo, useCallback } from "react";
import { CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

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

  // Get background color from the color string
  const getColorClass = useCallback((colorString: string) => {
    return colorString.split(' ')[0];
  }, []);

  const handleEmojiSelect = useCallback((emoji: any) => {
    onSelectIcon(emoji.native);
    setOpen(false);
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
        className="w-auto p-0 border-none bg-transparent shadow-none"
        align="start"
        sideOffset={12}
      >
        <div className="emoji-picker-container">
          <Picker 
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            searchPosition="sticky"
            navPosition="none"
            perLine={8}
            maxFrequentRows={2}
            emojiSize={20}
            emojiButtonSize={32}
            autoFocus
            icons="outline"
            dynamicWidth
          />
        </div>
      </PopoverContent>
    </Popover>
  );
});

export function IconPicker(props: CompactIconPickerProps) {
  return <CompactIconPicker {...props} />;
}

