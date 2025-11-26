-- Migration to backfill XP and Level based on completed tasks
-- Each task is worth 10 XP
-- Level 1 -> 2: 100 XP
-- Level 2 -> 3: 120 XP
-- Level n -> n+1: 100 + (n-1) * 20 XP (capped increment at level 100)

DO $$
DECLARE
    user_record RECORD;
    task_count INTEGER;
    calculated_xp INTEGER;
    calculated_level INTEGER;
    remaining_xp INTEGER;
    xp_for_next INTEGER;
    current_lvl INTEGER;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Count completed tasks
        SELECT COUNT(*) INTO task_count 
        FROM public.tasks 
        WHERE user_id = user_record.id AND is_completed = TRUE;

        -- Calculate Total XP
        calculated_xp := task_count * 10;

        -- Calculate Level
        current_lvl := 1;
        remaining_xp := calculated_xp;
        
        LOOP
            -- XP needed for current_lvl -> current_lvl + 1
            -- Formula: 100 + (min(lvl, 100) - 1) * 20
            IF current_lvl >= 100 THEN
                xp_for_next := 100 + (99 * 20); -- Cap at level 100 requirement (2080 XP)
            ELSE
                xp_for_next := 100 + (current_lvl - 1) * 20;
            END IF;

            EXIT WHEN remaining_xp < xp_for_next;

            remaining_xp := remaining_xp - xp_for_next;
            current_lvl := current_lvl + 1;
        END LOOP;

        calculated_level := current_lvl;

        -- Update user_settings
        -- Ensure user_settings exists for the user
        INSERT INTO public.user_settings (user_id, total_xp, level, tasks_completed)
        VALUES (user_record.id, calculated_xp, calculated_level, task_count)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            total_xp = EXCLUDED.total_xp,
            level = EXCLUDED.level,
            tasks_completed = EXCLUDED.tasks_completed;
            
    END LOOP;
END $$;
