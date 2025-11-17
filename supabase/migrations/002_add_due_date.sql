-- Add due_date column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Add index for due_date queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
