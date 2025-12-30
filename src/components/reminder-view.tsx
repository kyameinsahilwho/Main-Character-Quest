"use client"

import { useState } from "react"
import { Bell, Trash2, Clock, Calendar as CalendarIcon, RefreshCw, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Reminder } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ReminderViewProps {
  reminders: Reminder[]
  onDeleteReminder: (id: string) => void
  onToggleActive: (id: string) => void
  onEditReminder: (reminder: Reminder) => void
}

function ReminderItem({ 
  reminder, 
  onDeleteReminder, 
  onToggleActive, 
  onEditReminder 
}: { 
  reminder: Reminder, 
  onDeleteReminder: (id: string) => void, 
  onToggleActive: (id: string) => void, 
  onEditReminder: (reminder: Reminder) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group relative flex flex-col p-3 sm:p-4 rounded-2xl border-2 border-b-[6px] transition-all duration-200",
        reminder.isActive 
          ? "bg-card border-yellow-500/50 hover:border-yellow-500 shadow-sm" 
          : "bg-muted/30 border-border opacity-60 grayscale-[0.5]",
        isExpanded && "border-b-[8px] shadow-md"
      )}
    >
      <div 
        className="flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border-2 text-xl sm:text-2xl",
          reminder.isActive ? "bg-yellow-100 border-yellow-200" : "bg-muted border-border"
        )}>
          {reminder.icon || "🔔"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm sm:text-base truncate flex items-center gap-2">
              {reminder.title}
              {isExpanded ? <ChevronUp className="h-3 w-3 opacity-40" /> : <ChevronDown className="h-3 w-3 opacity-40" />}
            </h3>
            {reminder.type === 'ongoing' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[9px] sm:text-[10px] px-1.5 py-0 h-4">
                <RefreshCw className="h-2.5 w-2.5 mr-1" />
                {reminder.intervalValue} {reminder.intervalUnit}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(parseISO(reminder.remindAt), "MMM d")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(reminder.remindAt), "p")}
            </div>
            {reminder.description && (
              <p className="truncate max-w-[120px] sm:max-w-[300px] italic opacity-80">— {reminder.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <Switch 
            checked={reminder.isActive} 
            onCheckedChange={() => onToggleActive(reminder.id)}
            className="data-[state=checked]:bg-yellow-500 scale-90 sm:scale-100"
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-4 mt-3 border-t-2 border-[#F1F4F9]">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-10 rounded-xl border-2 border-b-4 border-[#E2E8F0] font-black uppercase tracking-widest text-[10px] hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 active:translate-y-0.5 active:border-b-0 transition-all"
                onClick={() => onEditReminder(reminder)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 rounded-xl border-2 border-b-4 border-rose-100 bg-rose-50 text-rose-300 font-black uppercase tracking-widest text-[10px] hover:bg-rose-100 hover:text-rose-500 active:translate-y-0.5 active:border-b-0 transition-all"
                onClick={() => onDeleteReminder(reminder.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ReminderView({ reminders, onDeleteReminder, onToggleActive, onEditReminder }: ReminderViewProps) {
  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <Bell className="h-12 w-12 mb-4 opacity-20" />
        <p>No reminders set yet.</p>
        <p className="text-sm">Add one to stay on top of your journey!</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-250px)] pr-4">
      <div className="space-y-3 pb-20 md:pb-0">
        <AnimatePresence mode="popLayout">
          {reminders.map((reminder) => (
            <ReminderItem 
              key={reminder.id}
              reminder={reminder}
              onDeleteReminder={onDeleteReminder}
              onToggleActive={onToggleActive}
              onEditReminder={onEditReminder}
            />
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  )
}
