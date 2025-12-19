-- Rename is_automated to is_template in tasks table
ALTER TABLE public.tasks RENAME COLUMN is_automated TO is_template;

-- Rename the index as well
ALTER INDEX IF EXISTS idx_tasks_automated RENAME TO idx_tasks_template;
