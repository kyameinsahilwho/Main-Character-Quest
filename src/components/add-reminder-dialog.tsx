"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Bell, CalendarIcon, Clock, X, Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Reminder } from "@/lib/types"
import { CompactIconPicker } from "./icon-picker"

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required."),
  type: z.enum(["one-time", "ongoing"]),
  intervalUnit: z.enum(["hours", "days", "weeks", "months"]).optional(),
  intervalValue: z.coerce.number().min(1).optional(),
  remindAtDate: z.date({
    required_error: "A date is required.",
  }),
  remindAtTime: z.string().min(1, "A time is required."),
})

type FormValues = z.infer<typeof formSchema>

interface AddReminderDialogProps {
  children: React.ReactNode
  onAddReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'isActive'>) => void
}

const REMINDER_COLOR = "bg-yellow-500/20 border-yellow-500/30";

export function AddReminderDialog({ children, onAddReminder }: AddReminderDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "🔔",
      type: "one-time",
      intervalUnit: "days",
      intervalValue: 1,
      remindAtDate: new Date(),
      remindAtTime: format(new Date(), "HH:mm"),
    },
  })

  const reminderType = form.watch("type")

  function onSubmit(values: FormValues) {
    const [hours, minutes] = values.remindAtTime.split(":").map(Number)
    const remindAt = new Date(values.remindAtDate)
    remindAt.setHours(hours, minutes, 0, 0)

    onAddReminder({
      title: values.title,
      description: values.description,
      icon: values.icon,
      type: values.type,
      intervalUnit: values.type === "ongoing" ? values.intervalUnit : undefined,
      intervalValue: values.type === "ongoing" ? values.intervalValue : undefined,
      remindAt: remindAt.toISOString(),
    })

    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] bg-white border-2 border-b-8 border-[#CBD5E1] text-[#1E293B] rounded-[2rem] shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">Add New Reminder</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E2E8F0] bg-white flex-shrink-0 pr-12">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-50 flex items-center justify-center border-2 border-b-4 border-yellow-200">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 stroke-[3]" />
            </div>
            <h2 className="text-base sm:text-lg font-black font-headline uppercase tracking-tight text-[#1E293B]">New Reminder</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem className="flex-shrink-0">
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Icon</FormLabel>
                      <FormControl>
                        <CompactIconPicker
                          selectedIcon={field.value}
                          onSelectIcon={field.onChange}
                          selectedColor={REMINDER_COLOR}
                          onSelectColor={() => {}}
                          colors={[REMINDER_COLOR]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What should I remind you?" 
                          {...field} 
                          className="h-14 bg-[#F1F4F9] border-2 border-transparent focus:bg-white focus:border-[#CBD5E1] rounded-2xl text-base font-bold text-[#1E293B] placeholder:text-[#94A3B8] transition-all" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Description (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Add more details..." 
                        {...field} 
                        className="h-12 bg-[#F1F4F9] border-2 border-transparent focus:bg-white focus:border-[#CBD5E1] rounded-xl text-sm font-bold text-[#1E293B] placeholder:text-[#94A3B8] transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-[#F1F4F9] border-2 border-transparent focus:bg-white focus:border-[#CBD5E1] rounded-xl font-bold text-[#1E293B]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2 border-[#CBD5E1] shadow-xl">
                          <SelectItem value="one-time" className="font-bold">One-time</SelectItem>
                          <SelectItem value="ongoing" className="font-bold">Ongoing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {reminderType === "ongoing" && (
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="intervalValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Every</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              className="h-12 bg-[#F1F4F9] border-2 border-transparent focus:bg-white focus:border-[#CBD5E1] rounded-xl font-bold text-[#1E293B]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="intervalUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-[#F1F4F9] border-2 border-transparent focus:bg-white focus:border-[#CBD5E1] rounded-xl font-bold text-[#1E293B]">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-2 border-[#CBD5E1] shadow-xl">
                              <SelectItem value="hours" className="font-bold">Hours</SelectItem>
                              <SelectItem value="days" className="font-bold">Days</SelectItem>
                              <SelectItem value="weeks" className="font-bold">Weeks</SelectItem>
                              <SelectItem value="months" className="font-bold">Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-4">
                <FormField
                  control={form.control}
                  name="remindAtDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-12 bg-[#F1F4F9] border-2 border-transparent hover:bg-[#E2E8F0] rounded-xl font-bold text-[#1E293B] justify-start px-4 w-full",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-[#64748B]" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-2 border-[#CBD5E1] rounded-2xl shadow-2xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remindAtTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Time</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] group-focus-within:text-yellow-500 transition-colors" />
                          <Input 
                            type="time" 
                            {...field} 
                            className="h-12 pl-11 bg-[#F1F4F9] border-2 border-transparent focus:bg-white focus:border-yellow-500/30 rounded-xl font-bold text-[#1E293B] transition-all hover:bg-[#E2E8F0] cursor-pointer"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black uppercase tracking-wider bg-yellow-500 hover:bg-yellow-600 text-white border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all rounded-2xl shadow-lg"
              >
                Add Reminder
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
