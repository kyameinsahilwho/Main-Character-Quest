-- Add Google Sync fields to tasks and projects
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_task_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS google_task_list_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;

-- Create indexes for Google IDs
CREATE INDEX IF NOT EXISTS idx_tasks_google_task_id ON public.tasks(google_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON public.tasks(google_event_id);
CREATE INDEX IF NOT EXISTS idx_projects_google_task_list_id ON public.projects(google_task_list_id);
CREATE INDEX IF NOT EXISTS idx_projects_google_calendar_id ON public.projects(google_calendar_id);
