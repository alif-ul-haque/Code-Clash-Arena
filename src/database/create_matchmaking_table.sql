-- =====================================================
-- MATCHMAKING QUEUE TABLE FOR GLOBAL BATTLES
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create the matchmaking system

-- Create matchmaking_queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  queue_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cf_handle character varying NOT NULL,
  rating integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'searching',
  battle_id uuid,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  matched_at timestamp with time zone,
  CONSTRAINT matchmaking_queue_pkey PRIMARY KEY (queue_id),
  CONSTRAINT matchmaking_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT matchmaking_queue_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.onevonebattles(onevone_battle_id) ON DELETE SET NULL
);

-- Create index for faster matchmaking queries
CREATE INDEX IF NOT EXISTS idx_matchmaking_status_rating 
ON public.matchmaking_queue(status, rating) 
WHERE status = 'searching';

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_matchmaking_user 
ON public.matchmaking_queue(user_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own queue entries
CREATE POLICY "Users can view their own queue entries"
ON public.matchmaking_queue
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own queue entries
CREATE POLICY "Users can insert their own queue entries"
ON public.matchmaking_queue
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own queue entries
CREATE POLICY "Users can update their own queue entries"
ON public.matchmaking_queue
FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for matchmaking
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

-- Optional: Create function to auto-cleanup old queue entries (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_matchmaking_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.matchmaking_queue
  WHERE status IN ('searching', 'cancelled')
  AND joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-matchmaking', '*/5 * * * *', 'SELECT cleanup_old_matchmaking_entries();');

COMMENT ON TABLE public.matchmaking_queue IS 'Queue for global battle matchmaking - tracks players searching for opponents';
COMMENT ON COLUMN public.matchmaking_queue.status IS 'searching | matched | cancelled';
