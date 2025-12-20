"use client";

import { useState, useEffect } from "react";
import { Habit } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditHabitDialogProps {
  children: React.ReactNode;
  habit: Habit;
  onUpdateHabit: (id: string, habitData: Partial<Omit<Habit, 'id' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'completions'>>) => void;
}

const COLORS = [
  "bg-blue-500/20 border-blue-500/30",
  "bg-purple-500/20 border-purple-500/30",
  "bg-cyan-500/20 border-cyan-500/30",
  "bg-rose-500/20 border-rose-500/30",
  "bg-amber-500/20 border-amber-500/30",
  "bg-indigo-500/20 border-indigo-500/30",
];

const ICONS = ["✨", "💪", "📚", "🧘", "💧", "🏃", "🥗", "💤", "🧠", "🎹"];

export function EditHabitDialog({ children, habit, onUpdateHabit }: EditHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(habit.frequency);
  const [targetDays, setTargetDays] = useState(habit.targetDays.toString());
  const [selectedColor, setSelectedColor] = useState(habit.color || COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(habit.icon || ICONS[0]);

  // Update local state when habit prop changes
  useEffect(() => {
    setTitle(habit.title);
    setFrequency(habit.frequency);
    setTargetDays(habit.targetDays.toString());
    setSelectedColor(habit.color || COLORS[0]);
    setSelectedIcon(habit.icon || ICONS[0]);
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onUpdateHabit(habit.id, {
      title,
      frequency,
      targetDays: parseInt(targetDays),
      color: selectedColor,
      icon: selectedIcon,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#faf7ed] border-2 border-b-8 border-[#e8e2c8] text-[#4a4a4a] rounded-[2rem] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-headline uppercase tracking-tight flex items-center gap-3 text-[#5c4d3c]">
            <div className="w-10 h-10 rounded-xl bg-[#e8e2c8] border-2 border-b-4 border-[#d6d3c9] flex items-center justify-center">
              <Edit2 className="w-6 h-6 text-[#5c4d3c] stroke-[3]" />
            </div>
            Edit Ritual
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-[#8c7b60]/60">Ritual Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read for 30 mins"
              className="bg-white border-2 border-b-4 border-[#e8e2c8] focus-visible:border-[#8c7b60] focus-visible:ring-0 focus:border-[#8c7b60] focus:ring-0 h-12 rounded-xl text-lg font-bold text-[#4a4a4a] placeholder:text-gray-200 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-[#8c7b60]/60">Frequency</Label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger className="bg-white border-2 border-b-4 border-[#e8e2c8] h-12 rounded-xl text-[#4a4a4a] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:border-[#8c7b60] focus-visible:border-[#8c7b60]">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent className="bg-[#faf7ed] border-2 border-[#e8e2c8]">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-[#8c7b60]/60">Target Days</Label>
              <Input
                type="number"
                min="1"
                max={frequency === 'daily' ? "7" : frequency === 'weekly' ? "7" : "31"}
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="bg-white border-2 border-b-4 border-[#e8e2c8] h-12 rounded-xl text-[#4a4a4a] focus-visible:border-[#8c7b60] focus-visible:ring-0 focus:border-[#8c7b60] focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-[#8c7b60]/60">Icon & Color</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border-2 border-b-4 active:border-b-2 active:translate-y-0.5",
                    selectedIcon === icon 
                      ? "bg-[#e8e2c8] border-[#d6d3c9] scale-105" 
                      : "bg-white border-[#faf7ed] hover:border-[#e8e2c8]"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all shadow-sm",
                    color,
                    selectedColor === color ? "scale-125 border-[#5c4d3c]" : "border-transparent"
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-[#5c4d3c] hover:bg-[#4a3e30] text-white font-black text-lg uppercase tracking-wider border-b-[6px] border-[#3e3428] active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-[#d6d3c9] relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/20 z-10 pointer-events-none" />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
