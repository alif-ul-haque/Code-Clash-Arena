-- Migration: Fix matchmaking_queue table
-- Date: 2026-02-09
-- Purpose: Add UNIQUE constraint on user_id and create indexes for better performance

-- Step 1: Clean up any duplicate entries (keep only the most recent for each user)
DELETE FROM public.matchmaking_queue
WHERE queue_id NOT IN (
    SELECT queue_id
    FROM (
        SELECT queue_id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY joined_at DESC) as rn
        FROM public.matchmaking_queue
    ) t
    WHERE t.rn = 1
);

-- Step 2: Add UNIQUE constraint on user_id (prevents duplicate queue entries)
ALTER TABLE public.matchmaking_queue
ADD CONSTRAINT matchmaking_queue_user_id_unique UNIQUE (user_id);

-- Step 3: Create index on status column for faster queries (status='searching')
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status 
ON public.matchmaking_queue(status);

-- Step 4: Create index on user_id for faster lookups (already has FK but index helps)
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_user_id 
ON public.matchmaking_queue(user_id);

-- Step 5: Add index on battle_id for faster battle-related queries
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_battle_id 
ON public.matchmaking_queue(battle_id);

-- Step 6: Clean up old/stale entries (older than 10 minutes with status='searching')
DELETE FROM public.matchmaking_queue
WHERE status = 'searching' 
  AND joined_at < NOW() - INTERVAL '10 minutes';

-- Verify changes
SELECT 
    'Unique users in queue:' as description,
    COUNT(DISTINCT user_id) as count
FROM public.matchmaking_queue
UNION ALL
SELECT 
    'Total queue entries:',
    COUNT(*) 
FROM public.matchmaking_queue;
