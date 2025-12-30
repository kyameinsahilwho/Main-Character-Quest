-- Add stats columns to habits table for performance
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS total_completions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_achieved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_expected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stats_year INTEGER;

-- Update existing habits with initial stats (optional, but good for consistency)
-- Note: Real backfill would require complex logic, better to let the app 
-- recalculate and save on first load/interaction.
