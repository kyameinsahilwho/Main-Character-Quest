-- Drop Google Sync fields from tasks and projects
ALTER TABLE public.tasks DROP COLUMN IF EXISTS google_task_id;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS google_event_id;
ALTER TABLE public.projects DROP COLUMN IF EXISTS google_task_list_id;
ALTER TABLE public.projects DROP COLUMN IF EXISTS google_calendar_id;

-- Drop indexes for Google IDs
DROP INDEX IF EXISTS idx_tasks_google_task_id;
DROP INDEX IF EXISTS idx_tasks_google_event_id;
DROP INDEX IF EXISTS idx_projects_google_task_list_id;
DROP INDEX IF EXISTS idx_projects_google_calendar_id;
