-- ============================================
-- CLAN BATTLE SYSTEM - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create clan_battles table (main battle records)
CREATE TABLE IF NOT EXISTS public.clan_battles (
    battle_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clan1_id uuid NOT NULL REFERENCES public.clans(clan_id) ON DELETE CASCADE,
    clan2_id uuid NOT NULL REFERENCES public.clans(clan_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'preparing', -- 'preparing', 'in_progress', 'completed', 'cancelled'
    winner_clan_id uuid REFERENCES public.clans(clan_id),
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    duration_seconds integer DEFAULT 3600, -- 1 hour default
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create clan_battle_participants table (who's in the battle)
CREATE TABLE IF NOT EXISTS public.clan_battle_participants (
    participant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id uuid NOT NULL REFERENCES public.clan_battles(battle_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    clan_id uuid NOT NULL REFERENCES public.clans(clan_id) ON DELETE CASCADE,
    problems_solved integer DEFAULT 0,
    total_time integer DEFAULT 0, -- in seconds
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(battle_id, user_id)
);

-- 3. Create clan_battle_problems table (problems for each battle)
CREATE TABLE IF NOT EXISTS public.clan_battle_problems (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id uuid NOT NULL REFERENCES public.clan_battles(battle_id) ON DELETE CASCADE,
    problem_index integer NOT NULL,
    problem_title text NOT NULL,
    problem_description text NOT NULL,
    difficulty text NOT NULL, -- 'Easy', 'Medium', 'Hard'
    test_cases jsonb,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(battle_id, problem_index)
);

-- 4. Create clan_battle_submissions table (code submissions)
CREATE TABLE IF NOT EXISTS public.clan_battle_submissions (
    submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id uuid NOT NULL REFERENCES public.clan_battles(battle_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_index integer NOT NULL,
    code text NOT NULL,
    language text NOT NULL,
    verdict text DEFAULT 'pending', -- 'pending', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit'
    execution_time integer, -- in milliseconds
    submitted_at timestamp with time zone DEFAULT now()
);

-- 5. Create clan_battle_queue table (matchmaking queue)
CREATE TABLE IF NOT EXISTS public.clan_battle_queue (
    queue_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id uuid NOT NULL REFERENCES public.clans(clan_id) ON DELETE CASCADE,
    leader_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selected_members jsonb NOT NULL, -- array of user_ids
    status text DEFAULT 'searching', -- 'searching', 'matched', 'cancelled'
    matched_with_clan_id uuid REFERENCES public.clans(clan_id),
    queue_time timestamp with time zone DEFAULT now(),
    UNIQUE(clan_id)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clan_battles_status ON public.clan_battles(status);
CREATE INDEX IF NOT EXISTS idx_clan_battles_clan1 ON public.clan_battles(clan1_id);
CREATE INDEX IF NOT EXISTS idx_clan_battles_clan2 ON public.clan_battles(clan2_id);
CREATE INDEX IF NOT EXISTS idx_clan_battle_participants_battle ON public.clan_battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_clan_battle_participants_user ON public.clan_battle_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_battle_queue_clan ON public.clan_battle_queue(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_battle_queue_status ON public.clan_battle_queue(status);

-- 7. Create function to end battle and determine winner
CREATE OR REPLACE FUNCTION end_clan_battle(p_battle_id uuid)
RETURNS void AS $$
DECLARE
    v_clan1_id uuid;
    v_clan2_id uuid;
    v_clan1_score integer;
    v_clan2_score integer;
    v_clan1_time integer;
    v_clan2_time integer;
    v_winner_id uuid;
BEGIN
    -- Get battle clans
    SELECT clan1_id, clan2_id INTO v_clan1_id, v_clan2_id
    FROM clan_battles
    WHERE battle_id = p_battle_id;

    -- Calculate clan 1 score and time
    SELECT 
        COALESCE(SUM(problems_solved), 0),
        COALESCE(SUM(total_time), 0)
    INTO v_clan1_score, v_clan1_time
    FROM clan_battle_participants
    WHERE battle_id = p_battle_id AND clan_id = v_clan1_id;

    -- Calculate clan 2 score and time
    SELECT 
        COALESCE(SUM(problems_solved), 0),
        COALESCE(SUM(total_time), 0)
    INTO v_clan2_score, v_clan2_time
    FROM clan_battle_participants
    WHERE battle_id = p_battle_id AND clan_id = v_clan2_id;

    -- Determine winner (more problems solved wins, if tie then less time wins)
    IF v_clan1_score > v_clan2_score THEN
        v_winner_id := v_clan1_id;
    ELSIF v_clan2_score > v_clan1_score THEN
        v_winner_id := v_clan2_id;
    ELSIF v_clan1_time < v_clan2_time THEN
        v_winner_id := v_clan1_id;
    ELSIF v_clan2_time < v_clan1_time THEN
        v_winner_id := v_clan2_id;
    ELSE
        v_winner_id := NULL; -- tie
    END IF;

    -- Update battle
    UPDATE clan_battles
    SET 
        status = 'completed',
        winner_clan_id = v_winner_id,
        end_time = now(),
        updated_at = now()
    WHERE battle_id = p_battle_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE public.clan_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_battle_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_battle_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_battle_queue ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (allow authenticated users to read/write their clan's battles)
CREATE POLICY "Users can view battles involving their clan" ON public.clan_battles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.clan_id = clan1_id OR users.clan_id = clan2_id)
        )
    );

CREATE POLICY "Users can insert battles for their clan" ON public.clan_battles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.clan_id = clan1_id OR users.clan_id = clan2_id)
        )
    );

CREATE POLICY "Users can update battles involving their clan" ON public.clan_battles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.clan_id = clan1_id OR users.clan_id = clan2_id)
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can view their battle participation" ON public.clan_battle_participants
    FOR ALL USING (true);

CREATE POLICY "Users can view battle problems" ON public.clan_battle_problems
    FOR ALL USING (true);

CREATE POLICY "Users can submit code" ON public.clan_battle_submissions
    FOR ALL USING (true);

CREATE POLICY "Users can view and manage queue" ON public.clan_battle_queue
    FOR ALL USING (true);

-- ============================================
-- DONE! Your clan battle tables are ready.
-- ============================================
