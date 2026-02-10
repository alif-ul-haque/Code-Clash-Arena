-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.matchmaking_queue (
  queue_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cf_handle character varying NOT NULL,
  rating integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'searching',
  battle_id uuid,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  matched_at timestamp with time zone,
  CONSTRAINT matchmaking_queue_pkey PRIMARY KEY (queue_id),
  CONSTRAINT matchmaking_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT matchmaking_queue_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.onevonebattles(onevone_battle_id)
);

-- Index for faster status-based queries
CREATE INDEX idx_matchmaking_queue_status ON public.matchmaking_queue(status);

-- Index for faster user lookups
CREATE INDEX idx_matchmaking_queue_user_id ON public.matchmaking_queue(user_id);

CREATE TABLE public.battle_table_clan (
  battle_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  clan_1_id uuid NOT NULL,
  clan_2_id uuid NOT NULL,
  win uuid,
  CONSTRAINT battle_table_clan_pkey PRIMARY KEY (battle_id, clan_1_id, clan_2_id),
  CONSTRAINT battle_table_clan_clan_1_id_fkey FOREIGN KEY (clan_1_id) REFERENCES public.clans(clan_id),
  CONSTRAINT battle_table_clan_clan_2_id_fkey FOREIGN KEY (clan_2_id) REFERENCES public.clans(clan_id),
  CONSTRAINT battle_table_clan_win_fkey FOREIGN KEY (win) REFERENCES public.clans(clan_id)
);
CREATE TABLE public.clan_members (
  user_id uuid NOT NULL,
  clan_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  battle_played smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT clan_members_pkey PRIMARY KEY (user_id, clan_id),
  CONSTRAINT clan_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT clan_members_clan_id_fkey FOREIGN KEY (clan_id) REFERENCES public.clans(clan_id)
);
CREATE TABLE public.clans (
  clan_id uuid NOT NULL DEFAULT gen_random_uuid(),
  clan_name text NOT NULL,
  leader_id uuid,
  type text,
  location text,
  war_frequency text,
  id text NOT NULL DEFAULT generate_custom_clan_id() UNIQUE,
  min_trophy smallint NOT NULL DEFAULT '0'::smallint,
  max_trophy smallint NOT NULL DEFAULT '0'::smallint,
  war_won smallint NOT NULL DEFAULT '0'::smallint,
  total_points smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT clans_pkey PRIMARY KEY (clan_id),
  CONSTRAINT fk_leader FOREIGN KEY (leader_id) REFERENCES public.users(id)
);
CREATE TABLE public.demo_table (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  CF_handle character varying NOT NULL,
  CONSTRAINT demo_table_pkey PRIMARY KEY (id)
);
CREATE TABLE public.friends (
  u_id uuid NOT NULL,
  f_id uuid NOT NULL,
  status text DEFAULT 'pending'::text,
  CONSTRAINT friends_pkey PRIMARY KEY (u_id, f_id),
  CONSTRAINT friends_u_id_fkey FOREIGN KEY (u_id) REFERENCES public.users(id),
  CONSTRAINT friends_f_id_fkey FOREIGN KEY (f_id) REFERENCES public.users(id)
);
CREATE TABLE public.onevone_participants (
  onevone_battle_id uuid NOT NULL,
  player_id uuid NOT NULL,
  problem_solved integer DEFAULT 0,
  time_taken integer DEFAULT 0,
  CONSTRAINT onevone_participants_pkey PRIMARY KEY (onevone_battle_id, player_id),
  CONSTRAINT onevone_participants_onevone_battle_id_fkey FOREIGN KEY (onevone_battle_id) REFERENCES public.onevonebattles(onevone_battle_id),
  CONSTRAINT onevone_participants_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id)
);
CREATE TABLE public.onevonebattles (
  onevone_battle_id uuid NOT NULL DEFAULT gen_random_uuid(),
  battlefield character varying,
  battle_mode character varying,
  problem_count integer,
  status character varying NOT NULL,
  trophy_reward integer,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  CONSTRAINT onevonebattles_pkey PRIMARY KEY (onevone_battle_id)
);
CREATE TABLE public.problem (
  sub_id uuid NOT NULL DEFAULT gen_random_uuid(),
  problem_id uuid,
  user_id uuid,
  status_id text,
  CONSTRAINT problem_pkey PRIMARY KEY (sub_id),
  CONSTRAINT problem_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problem_set(problem_id),
  CONSTRAINT problem_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.problem_set (
  battle_id uuid,
  problem_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT problem_set_pkey PRIMARY KEY (problem_id),
  CONSTRAINT problem_set_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.battle_table_clan(battle_id)
);
CREATE TABLE public.submission (
  submission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  problem_id uuid,
  user_id uuid,
  status text DEFAULT 'pending'::text,
  CONSTRAINT submission_pkey PRIMARY KEY (submission_id),
  CONSTRAINT submission_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problem_set(problem_id),
  CONSTRAINT submission_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  cf_handle character varying NOT NULL UNIQUE,
  xp numeric NOT NULL DEFAULT 0.00,
  rating integer NOT NULL DEFAULT 0,
  clan_id uuid,
  user_id text NOT NULL DEFAULT generate_custom_user_id() UNIQUE,
  level integer NOT NULL DEFAULT 1,
  problem_solved smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_clan_id_fkey FOREIGN KEY (clan_id) REFERENCES public.clans(clan_id)
);

-- Remove duplicates
DELETE FROM matchmaking_queue
WHERE queue_id NOT IN (
    SELECT queue_id FROM (
        SELECT queue_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY joined_at DESC) as rn
        FROM matchmaking_queue
    ) t WHERE t.rn = 1
);

-- Add UNIQUE constraint
ALTER TABLE matchmaking_queue ADD CONSTRAINT matchmaking_queue_user_id_unique UNIQUE (user_id);

-- Add indexes for performance
CREATE INDEX idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX idx_matchmaking_queue_user_id ON matchmaking_queue(user_id);


ALTER TABLE onevonebattles
ADD COLUMN IF NOT EXISTS problem_name TEXT,
ADD COLUMN IF NOT EXISTS problem_contest_id INTEGER,
ADD COLUMN IF NOT EXISTS problem_index TEXT,
ADD COLUMN IF NOT EXISTS problem_rating INTEGER,
ADD COLUMN IF NOT EXISTS problem_tags TEXT;

CREATE INDEX IF NOT EXISTS idx_onevonebattles_problem 
ON onevonebattles(problem_contest_id, problem_index);