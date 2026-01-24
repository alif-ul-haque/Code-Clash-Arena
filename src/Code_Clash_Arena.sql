-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.battle_invitations (
  invitation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  battle_id uuid,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT battle_invitations_pkey PRIMARY KEY (invitation_id),
  CONSTRAINT battle_invitations_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.onevonebattles(onevone_battle_id),
  CONSTRAINT battle_invitations_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT battle_invitations_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
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
CREATE TABLE public.clan_battle_participants (
  participant_id uuid NOT NULL DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL,
  user_id uuid NOT NULL,
  clan_id uuid NOT NULL,
  problems_solved integer DEFAULT 0,
  total_time integer DEFAULT 0,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clan_battle_participants_pkey PRIMARY KEY (participant_id),
  CONSTRAINT clan_battle_participants_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.clan_battles(battle_id),
  CONSTRAINT clan_battle_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT clan_battle_participants_clan_id_fkey FOREIGN KEY (clan_id) REFERENCES public.clans(clan_id)
);
CREATE TABLE public.clan_battle_problems (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL,
  problem_index integer NOT NULL,
  problem_title text NOT NULL,
  problem_description text NOT NULL,
  difficulty text NOT NULL,
  test_cases jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clan_battle_problems_pkey PRIMARY KEY (id),
  CONSTRAINT clan_battle_problems_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.clan_battles(battle_id)
);
CREATE TABLE public.clan_battle_queue (
  queue_id uuid NOT NULL DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL UNIQUE,
  leader_id uuid NOT NULL,
  selected_members jsonb NOT NULL,
  status text DEFAULT 'searching'::text,
  matched_with_clan_id uuid,
  queue_time timestamp with time zone DEFAULT now(),
  CONSTRAINT clan_battle_queue_pkey PRIMARY KEY (queue_id),
  CONSTRAINT clan_battle_queue_clan_id_fkey FOREIGN KEY (clan_id) REFERENCES public.clans(clan_id),
  CONSTRAINT clan_battle_queue_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id),
  CONSTRAINT clan_battle_queue_matched_with_clan_id_fkey FOREIGN KEY (matched_with_clan_id) REFERENCES public.clans(clan_id)
);
CREATE TABLE public.clan_battle_submissions (
  submission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL,
  user_id uuid NOT NULL,
  problem_index integer NOT NULL,
  code text NOT NULL,
  language text NOT NULL,
  verdict text DEFAULT 'pending'::text,
  execution_time integer,
  submitted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clan_battle_submissions_pkey PRIMARY KEY (submission_id),
  CONSTRAINT clan_battle_submissions_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.clan_battles(battle_id),
  CONSTRAINT clan_battle_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.clan_battles (
  battle_id uuid NOT NULL DEFAULT gen_random_uuid(),
  clan1_id uuid NOT NULL,
  clan2_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'preparing'::text,
  winner_clan_id uuid,
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  duration_seconds integer DEFAULT 3600,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clan_battles_pkey PRIMARY KEY (battle_id),
  CONSTRAINT clan_battles_clan1_id_fkey FOREIGN KEY (clan1_id) REFERENCES public.clans(clan_id),
  CONSTRAINT clan_battles_clan2_id_fkey FOREIGN KEY (clan2_id) REFERENCES public.clans(clan_id),
  CONSTRAINT clan_battles_winner_clan_id_fkey FOREIGN KEY (winner_clan_id) REFERENCES public.clans(clan_id)
);
CREATE TABLE public.clan_join_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  clan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  CONSTRAINT clan_join_requests_pkey PRIMARY KEY (id),
  CONSTRAINT clan_join_requests_clan_id_fkey FOREIGN KEY (clan_id) REFERENCES public.clans(clan_id),
  CONSTRAINT clan_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  level smallint NOT NULL DEFAULT '1'::smallint,
  is_searching_for_battle boolean DEFAULT false,
  searching_updated_at timestamp with time zone DEFAULT now(),
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
  is_private boolean DEFAULT false,
  invited_player_id uuid,
  CONSTRAINT onevonebattles_pkey PRIMARY KEY (onevone_battle_id),
  CONSTRAINT onevonebattles_invited_player_id_fkey FOREIGN KEY (invited_player_id) REFERENCES public.users(id)
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
  is_searching_for_battle boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_clan_id_fkey FOREIGN KEY (clan_id) REFERENCES public.clans(clan_id)
);