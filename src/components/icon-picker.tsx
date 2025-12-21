"use client";

import { useState, useMemo } from "react";
import { Search, CircleDashed } from "lucide-react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

interface CompactIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

const ICON_CATEGORIES = {
  "Self-Care": ["✨", "🧘", "🧘‍♂️", "💧", "🥗", "💤", "🚿", "🚶‍♀️", "🛁", "🧴", "🪥", "🪒", "🧖‍♀️", "🧖‍♂️", "🧼", "🧽"],
  "Fitness": ["💪", "🏃", "🚴‍♂️", "🏊‍♂️", "🧗", "🛹", "🏀", "⚽", "🎾", "🏐", "🥋", "🥊", "🎯", "🏋️‍♂️", "🤸‍♂️", "🚵‍♀️"],
  "Work": ["💻", "📚", "🧠", "✍️", "🎙️", "📸", "📱", "📞", "✉️", "📅", "⏳", "⌛", "⏰", "💡", "🔦", "🛠️", "🔨", "🔧", "🔩", "⚙️"],
  "Hobbies": ["🎨", "🎸", "🎹", "🎮", "🎬", "🎵", "🕺", "💃", "🧶", "🧵", "🪡", "📷", "🎭", "🎲", "🧩", "🧸"],
  "Food": ["🍎", "🥦", "🥛", "🍵", "☕", "🍳", "🥗", "🍕", "🍔", "🍣", "🌮", "🍜", "🍩", "🍪", "🍰", "🍒"],
  "Home": ["🏠", "🏡", "🏢", "🏫", "🏪", "🛒", "🛍️", "🎁", "🧹", "🧺", "🌱", "🚿", "🛋️", "🛌", "🗝️", "🔒"]
};

const ICON_KEYWORDS: Record<string, string> = {
  "✨": "sparkles magic shine",
  "🧘": "yoga meditation zen peace",
  "🧘‍♂️": "yoga meditation zen peace man",
  "💧": "water hydrate drink",
  "🥗": "salad healthy food eat",
  "💤": "sleep rest nap",
  "🚿": "shower clean wash",
  "🚶‍♀️": "walk exercise move",
  "🛁": "bath relax soak",
  "🧴": "lotion skin care",
  "🪥": "brush teeth dental",
  "🪒": "shave razor",
  "🧖‍♀️": "sauna spa relax",
  "🧖‍♂️": "sauna spa relax man",
  "🧼": "soap clean wash",
  "🧽": "sponge clean wash",
  "💪": "workout gym fitness strength muscle",
  "🏃": "run exercise cardio",
  "🚴‍♂️": "bike cycle exercise",
  "🏊‍♂️": "swim exercise water",
  "🧗": "climb mountain exercise",
  "🛹": "skate board hobby",
  "🏀": "basketball sports ball",
  "⚽": "soccer football sports ball",
  "🎾": "tennis sports ball",
  "🏐": "volleyball sports ball",
  "🥋": "karate martial arts",
  "🥊": "boxing fight",
  "🎯": "target goal focus",
  "🏋️‍♂️": "weight lift gym",
  "🤸‍♂️": "gymnastics flip",
  "🚵‍♀️": "mountain bike cycle",
  "💻": "work laptop computer code",
  "📚": "read book study learn",
  "🧠": "brain think learn",
  "✍️": "write note pen",
  "🎙️": "podcast record mic",
  "📸": "photo camera picture",
  "📱": "phone mobile tech",
  "📞": "call phone talk",
  "✉️": "mail email letter",
  "📅": "calendar date schedule",
  "⏳": "time wait sand",
  "⌛": "time end sand",
  "⏰": "alarm clock time",
  "💡": "idea light bulb",
  "🔦": "light torch",
  "🛠️": "tools fix repair",
  "🔨": "hammer build",
  "🔧": "wrench fix",
  "🔩": "bolt nut fix",
  "⚙️": "gear settings",
  "🎨": "art paint draw creative",
  "🎸": "guitar music instrument",
  "🎹": "piano music instrument",
  "🎮": "game play video",
  "🎬": "movie film video",
  "🎵": "music note song",
  "🕺": "dance man party",
  "💃": "dance woman party",
  "🧶": "yarn knit hobby",
  "🧵": "thread sew hobby",
  "🪡": "needle sew hobby",
  "📷": "camera photo picture",
  "🎭": "theater drama act",
  "🎲": "dice game play",
  "🧩": "puzzle game play",
  "🧸": "toy bear play",
  "🍎": "apple food fruit healthy",
  "🥦": "broccoli food vegetable healthy",
  "🥛": "milk drink",
  "🍵": "tea drink",
  "☕": "coffee drink caffeine",
  "🍳": "egg cook breakfast",
  "🍕": "pizza food eat",
  "🍔": "burger food eat",
  "🍣": "sushi food eat",
  "🌮": "taco food eat",
  "🍜": "noodles food eat",
  "🍩": "donut food eat",
  "🍪": "cookie food eat",
  "🍰": "cake food eat",
  "🍒": "cherry food fruit",
  "🏠": "home house",
  "🏡": "home house garden",
  "🏢": "office building work",
  "🏫": "school learn",
  "🏪": "store shop",
  "🛒": "cart shop",
  "🛍️": "bags shop",
  "🎁": "gift present",
  "🧹": "broom clean",
  "🧺": "basket laundry",
  "🌱": "plant grow garden",
  "🛋️": "sofa relax home",
  "🛌": "bed sleep home",
  "🗝️": "key lock home",
  "🔒": "lock secure",
};

const ALL_ICONS = Array.from(new Set(Object.values(ICON_CATEGORIES).flat()));

export function IconPicker({ 
  selectedIcon, 
  onSelectIcon, 
  selectedColor, 
  onSelectColor,
  colors 
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Self-Care");

  const handleIconSelect = (icon: string) => {
    onSelectIcon(icon);
  };

  const filteredIcons = useMemo(() => {
    if (!searchQuery) {
      return ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES] || [];
    }
    const query = searchQuery.toLowerCase();
    return ALL_ICONS.filter(icon => {
      const keywords = ICON_KEYWORDS[icon] || "";
      return keywords.toLowerCase().includes(query) || 
             Object.entries(ICON_CATEGORIES).some(([cat, icons]) => 
               cat.toLowerCase().includes(query) && icons.includes(icon)
             );
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search and Category Chips */}
      <div className="space-y-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#334155] transition-colors" />
          <Input
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#F1F4F9] border-2 border-[#E2E8F0] focus:border-[#CBD5E1] focus:ring-0 h-10 rounded-lg text-sm font-medium"
          />
        </div>

        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {Object.keys(ICON_CATEGORIES).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all",
                  activeCategory === category
                    ? "bg-[#334155] text-white border-[#1E293B]"
                    : "bg-white border-[#E2E8F0] text-[#1E293B] hover:border-[#CBD5E1]"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Single Row Icon Grid with Horizontal Scroll */}
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-1">
            {filteredIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleIconSelect(icon)}
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 border-2",
                  selectedIcon === icon
                    ? "bg-[#F1F4F9] border-[#94A3B8] scale-110"
                    : "bg-white border-[#F1F4F9] hover:border-[#E2E8F0]"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Color Picker */}
        {selectedIcon && (
          <div className="flex-shrink-0 flex gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onSelectColor(color)}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all shadow-sm active:scale-90",
                  color.split(' ')[0],
                  selectedColor === color ? "scale-125 border-[#1E293B] shadow-md" : "border-transparent"
                )}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Avatar-Style Icon Picker with Popover
 * Displays as a circular avatar next to the input field,
 * opens a floating mini-card on click.
 */
export function CompactIconPicker({ 
  selectedIcon, 
  onSelectIcon, 
  selectedColor, 
  onSelectColor,
  colors 
}: CompactIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Self-Care");
  const [isOpen, setIsOpen] = useState(false);

  const handleIconSelect = (icon: string) => {
    onSelectIcon(icon);
    // Keep popover open to allow color selection
  };

  const filteredIcons = useMemo(() => {
    if (!searchQuery) {
      return ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES] || [];
    }
    const query = searchQuery.toLowerCase();
    return ALL_ICONS.filter(icon => {
      const keywords = ICON_KEYWORDS[icon] || "";
      return keywords.toLowerCase().includes(query) || 
             Object.entries(ICON_CATEGORIES).some(([cat, icons]) => 
               cat.toLowerCase().includes(query) && icons.includes(icon)
             );
    });
  }, [searchQuery, activeCategory]);

  // Get background color from the color string
  const getColorClass = (colorString: string) => {
    return colorString.split(' ')[0]; // e.g., "bg-blue-600/20 border-blue-600/30" -> "bg-blue-600/20"
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all border-2 border-b-4",
            selectedIcon
              ? `${getColorClass(selectedColor)} border-[#1E293B]/30 border-b-[#1E293B] shadow-md hover:scale-105 active:scale-95 active:border-b-2`
              : "bg-[#F1F4F9] border-[#CBD5E1] border-b-[#CBD5E1] hover:border-[#94A3B8] hover:border-b-[#94A3B8]"
          )}
          title="Click to select icon and color"
        >
          {selectedIcon || <CircleDashed className="w-8 h-8 text-[#CBD5E1] stroke-[2]" />}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-white border-2 border-[#E2E8F0] rounded-xl shadow-xl p-4 space-y-3"
        align="start"
      >
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#334155] transition-colors" />
          <Input
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#F1F4F9] border-2 border-[#E2E8F0] focus:border-[#CBD5E1] focus:ring-0 h-9 rounded-lg text-sm font-medium"
          />
        </div>

        {/* Category Chips */}
        {!searchQuery && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {Object.keys(ICON_CATEGORIES).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
                className={cn(
                  "px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all flex-shrink-0",
                  activeCategory === category
                    ? "bg-[#334155] text-white border-[#1E293B]"
                    : "bg-white border-[#E2E8F0] text-[#1E293B] hover:border-[#CBD5E1]"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Icon Grid - 3x4 in popover */}
        <div className="grid grid-cols-4 gap-2">
          {filteredIcons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => {
                handleIconSelect(icon);
              }}
              className={cn(
                "w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 border-2",
                selectedIcon === icon
                  ? "bg-[#F1F4F9] border-[#94A3B8] scale-110"
                  : "bg-white border-[#F1F4F9] hover:border-[#E2E8F0]"
              )}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        {selectedIcon && (
          <div className="pt-2 border-t border-[#E2E8F0]">
            <div className="text-[8px] font-black uppercase tracking-widest text-[#64748B] mb-2">
              Ritual Aura
            </div>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-3 transition-all shadow-sm active:scale-90 cursor-pointer",
                    color.split(' ')[0],
                    selectedColor === color ? "scale-125 border-[#1E293B] shadow-md" : "border-transparent hover:scale-110"
                  )}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
