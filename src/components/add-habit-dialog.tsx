"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import { CompactIconPicker } from "./icon-picker";

interface AddHabitDialogProps {
  children: React.ReactNode;
  onAddHabit: (habitData: Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>) => void;
}

const COLORS = [
  "bg-blue-600/20 border-blue-600/30",
  "bg-purple-600/20 border-purple-600/30",
  "bg-cyan-600/20 border-cyan-600/30",
  "bg-rose-600/20 border-rose-600/30",
  "bg-amber-600/20 border-amber-600/30",
  "bg-indigo-600/20 border-indigo-600/30",
];

export function AddHabitDialog({ children, onAddHabit }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'every_2_days' | 'every_3_days' | 'every_4_days' | 'specific_days'>('daily');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [customDays, setCustomDays] = useState<number[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedIcon) return;

    onAddHabit({
      title,
      frequency,
      customDays: frequency === 'specific_days' ? customDays : undefined,
      color: selectedColor,
      icon: selectedIcon,
    });

    setTitle("");
    setFrequency('daily');
    setSelectedIcon("");
    setCustomDays([]);
    setOpen(false);
  };

  const toggleDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[600px] bg-white border-2 border-b-8 border-[#CBD5E1] text-[#1E293B] rounded-[2rem] shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">Create New Ritual</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F1F4F9] border-2 border-b-4 border-[#CBD5E1] flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#1E293B] stroke-[3]" />
            </div>
            <h2 className="text-lg font-black font-headline uppercase tracking-tight text-[#1E293B]">New Ritual</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Icon Avatar + Ritual Name Row */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Ritual Name & Icon</Label>
              <div className="flex items-center gap-3">
                <CompactIconPicker
                  selectedIcon={selectedIcon}
                  onSelectIcon={setSelectedIcon}
                  selectedColor={selectedColor}
                  onSelectColor={setSelectedColor}
                  colors={COLORS}
                />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Read for 30 mins"
                  autoFocus
                  className="flex-1 bg-white border-2 border-b-4 border-[#E2E8F0] focus-visible:border-[#CBD5E1] focus-visible:ring-0 h-14 rounded-lg text-sm font-bold text-[#1E293B] placeholder:text-[#CBD5E1] transition-all"
                />
              </div>
            </div>

            {/* Ritual Aura Color Picker */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Ritual Aura</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-9 h-9 rounded-full border-3 transition-all shadow-sm active:scale-90 cursor-pointer",
                      color.split(' ')[0],
                      selectedColor === color ? "scale-125 border-[#1E293B] shadow-md" : "border-transparent hover:scale-110"
                    )}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Frequency</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger className="bg-white border-2 border-b-4 border-[#E2E8F0] h-11 rounded-lg text-xs font-bold text-[#1E293B] focus:ring-0 focus:border-[#CBD5E1]">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-[#E2E8F0] rounded-lg">
                    <SelectItem value="daily" className="font-bold text-xs">Daily</SelectItem>
                    <SelectItem value="weekly" className="font-bold text-xs">Weekly</SelectItem>
                    <SelectItem value="monthly" className="font-bold text-xs">Monthly</SelectItem>
                    <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#64748B]/50">Interval</div>
                    <SelectItem value="every_2_days" className="font-bold text-xs">Every 2nd Day</SelectItem>
                    <SelectItem value="every_3_days" className="font-bold text-xs">Every 3rd Day</SelectItem>
                    <SelectItem value="every_4_days" className="font-bold text-xs">Every 4th Day</SelectItem>
                    <SelectItem value="specific_days" className="font-bold text-xs">Specific Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {frequency === 'specific_days' && (
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Select Days</Label>
                <div className="flex justify-between gap-1">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-xs font-bold border-2 border-b-4 transition-all active:translate-y-[1px] active:border-b-2",
                        customDays.includes(index)
                          ? "bg-[#6366f1] border-[#4f46e5] text-white"
                          : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Button */}
        <div className="border-t border-[#E2E8F0] px-6 py-4 bg-white flex-shrink-0">
          <Button 
            type="submit" 
            disabled={!title.trim() || !selectedIcon}
            onClick={handleSubmit}
            className="w-full h-14 rounded-2xl bg-[#6366f1] border-2 border-b-[6px] border-[#4f46e5] text-white hover:bg-[#818cf8] hover:border-[#6366f1] font-black text-lg uppercase tracking-wider active:translate-y-[2px] active:border-b-[4px] transition-all shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-white/40 z-10 pointer-events-none" />
            Start Ritual
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
