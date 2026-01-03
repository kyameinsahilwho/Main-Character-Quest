-- Add archived column to habits
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add reminder columns to habits
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_time TIME; -- Time of day for reminder
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;

-- Add reminder columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ; -- Specific date and time
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
