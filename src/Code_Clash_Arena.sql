-- 1. clans table
create table clans (
  clan_id uuid primary key default gen_random_uuid(),
  clan_name text not null,
  leader_id uuid,                -- FK add later after users created
  type text,
  location text,
  war_frequency text
);

-- 2. users table
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  cf_handle varchar(50) not null,
  xp numeric(10,2) default 0.00,
  trophy integer default 0,
  clan_id uuid references clans(clan_id)   -- FK to clans
);

-- 3. update clans to add FK to users (leader_id)
alter table clans
  add constraint fk_leader foreign key (leader_id) references users(id);

-- 4. friends table
create table friends (
  u_id uuid references users(id) on delete cascade,
  f_id uuid references users(id) on delete cascade,
  status text default 'pending',
  primary key (u_id, f_id)
);

-- 5. battle_table_clan
create table battle_table_clan (
  battle_id uuid default gen_random_uuid(),
  clan_1_id uuid references clans(clan_id),
  clan_2_id uuid references clans(clan_id),
  win uuid references clans(clan_id),
  primary key (battle_id, clan_1_id, clan_2_id)
);

alter table battle_table_clan
 add constraint unique_battle_id unique (battle_id);

-- 6. problem_set
create table problem_set (
  battle_id uuid references battle_table_clan(battle_id),
  problem_id uuid primary key default gen_random_uuid()
);

-- 7. submission
create table submission (
  submission_id uuid primary key default gen_random_uuid(),
  problem_id uuid references problem_set(problem_id),
  user_id uuid references users(id),
  status text default 'pending'
);

-- 8. problem
create table problem (
  sub_id uuid primary key default gen_random_uuid(),
  problem_id uuid references problem_set(problem_id),
  user_id uuid references users(id),
  status_id text
);

-- Insert sample data into users table
insert into users (email, password, cf_handle, xp, trophy, clan_id)
values (
  'alifulhaque19@gmail.com',
  '1234',  -- hashed password
  'alif19',
  100.50,
  50,
  null
);

select current_database();

CREATE table onevonebattles (
  onevone_battle_id UUID PRIMARY KEY default gen_random_uuid(),
  battlefield VARCHAR(100),
  battle_mode VARCHAR(100),
  problem_count INTEGER,
  status VARCHAR(20) NOT NULL,
  trophy_reward INTEGER, 
  start_time TIMESTAMP,
  end_time TIMESTAMP
);

create table onevone_participants (
  onevone_battle_id UUID REFERENCES onevonebattles(onevone_battle_id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_solved INTEGER DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  PRIMARY KEY (onevone_battle_id, player_id)
);


insert into users (email, cf_handle, xp, trophy, clan_id)
values ('alifulhaque19@gmail.com', 'alif_uL_haQue', 50.25, 1500, null);

insert into users (email, cf_handle, xp, trophy, clan_id)
values ('ibnatmatin.com', 'Matin008', 70.25, 1900, null);

insert into users (email, cf_handle, xp, trophy, clan_id)
values ('takli@gmail.com', 'takli096', 66.25, 1650, null);

insert into users (email, cf_handle, xp, trophy, clan_id)
values ('than@gmail.com', 'than_007', 63.75, 1350, null);

insert into users (email, cf_handle, xp, trophy, clan_id)
values ('sambani@gmail.com', 'sambani129', 69.50, 1700, null);


insert into friends (u_id, f_id, status)
select 
  (select id from users where cf_handle = 'alif19') as u_id,
  id as f_id,
  'accepted' as status
from users
where cf_handle <> 'alif19';