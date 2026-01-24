# Clan Battle System - Setup Instructions

## Problem
The clan battle feature is showing "No battle ongoing" because the required database tables don't exist yet.

## Solution
You need to run the SQL script to create the clan battle tables in your Supabase database.

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to your Supabase project: https://supabase.com/dashboard
- Navigate to the **SQL Editor** section

### 2. Run the SQL Script
- Copy the entire content of `Setup_Clan_Battle_Tables.sql`
- Paste it into the SQL Editor
- Click **Run** to execute

### 3. Verify Tables Created
After running the script, verify these tables exist:
- ✅ `clan_battles` - Main battle records with status tracking
- ✅ `clan_battle_participants` - Players in each battle
- ✅ `clan_battle_problems` - Problems for each battle
- ✅ `clan_battle_submissions` - Code submissions
- ✅ `clan_battle_queue` - Matchmaking queue

### 4. Test the Feature
After the tables are created:
1. Refresh your application
2. As a clan leader, click "Clan Battle"
3. Select 2 members and start a battle
4. The matchmaking and battle system should now work

## What This Fixes:
- ✅ Ongoing battle detection will work
- ✅ Red dot indicator will show when battle is active
- ✅ Both leaders and members can join active battles
- ✅ Matchmaking queue will function
- ✅ Battle data persistence

## Table Structure:
- **clan_battles**: Tracks battle status (preparing, in_progress, completed)
- **Status values**:
  - `preparing` - Battle created, waiting to start
  - `in_progress` - Battle is active
  - `completed` - Battle ended
  - `cancelled` - Battle was cancelled

## Important Notes:
- The script includes Row Level Security (RLS) policies
- Users can only view/modify battles involving their clan
- The `end_clan_battle()` function automatically determines winners
- Indexes are created for better query performance

## If You Still See Errors:
1. Check browser console for specific error messages
2. Verify your Supabase connection is working
3. Make sure you're logged in with a user who has a clan
4. Check that the SQL script ran without errors

---
**File Location**: `src/Setup_Clan_Battle_Tables.sql`
