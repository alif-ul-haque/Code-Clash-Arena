# Fix "ERROR FINDING MATCH" - Database Permissions Check

## ✅ What I Fixed

### 1. **Cleaned Up Old Queue Entries**
The error was likely caused by old queue entries from previous sessions. When you tried to join again, the UNIQUE constraint on `user_id` prevented insertion.

**Fixed in `globalMatchmaking.js`**:
```javascript
// NOW: Delete old entries BEFORE inserting
await supabase.from('matchmaking_queue').delete().eq('user_id', userId);

// THEN: Insert fresh entry
await supabase.from('matchmaking_queue').insert({...});
```

### 2. **Better Cleanup on Exit**
Changed `leaveMatchmakingQueue` to DELETE entries instead of just updating status.

**Before**:
```javascript
// Just updated status (entry still exists)
.update({ status: 'cancelled' })
```

**After**:
```javascript
// Completely removes entry from table
.delete().eq('user_id', userId)
```

### 3. **Better Error Messages**
Added detailed error logging to help identify the exact issue:
```javascript
console.error('Error details:', {
    message: error.message,
    code: error.code,
    details: error.details
});
```

---

## 🔍 Check Supabase Permissions (If Error Persists)

The error might also be due to Row Level Security (RLS) policies blocking your database operations.

### Step 1: Check RLS Status

1. Go to **Supabase Dashboard**
2. Click **Table Editor** → Select `matchmaking_queue` table
3. Look for "RLS enabled" badge at the top

### Step 2: If RLS is Enabled, Add Policies

**Option A: Disable RLS (Quick Fix for Testing)**
```sql
ALTER TABLE matchmaking_queue DISABLE ROW LEVEL SECURITY;
```

**Option B: Add Proper Policies (Recommended)**
```sql
-- Allow users to insert their own queue entries
CREATE POLICY "Users can insert their own queue entry"
ON matchmaking_queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to read all queue entries (for matchmaking)
CREATE POLICY "Users can read all queue entries"
ON matchmaking_queue
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own queue entries
CREATE POLICY "Users can update their own queue entry"
ON matchmaking_queue
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own queue entries
CREATE POLICY "Users can delete their own queue entry"
ON matchmaking_queue
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### Step 3: Verify User Authentication

Make sure you're passing the correct `user_id` (the UUID from Supabase auth, NOT the Codeforces handle):

```javascript
// Check in browser console:
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated user ID:', user?.id);
```

---

## 🧪 Test Now

1. Clear your browser console (F12 → Console tab → Clear)
2. Click "GLOBAL BATTLE"
3. Watch for these logs:

**Success**:
```
joinMatchmakingQueue called with: {...}
Cleaning up old queue entries...
Inserting into matchmaking_queue...
✓ Successfully joined matchmaking queue: {...}
```

**If Error**:
```
❌ Insert error: {...}
Error details: {
  message: "...",  ← Read this!
  code: "...",
  details: "..."
}
```

Common error codes:
- `23505`: Duplicate key (UNIQUE constraint) - old entry not cleaned up
- `42501`: Permission denied - RLS policy blocking
- `23503`: Foreign key violation - user_id doesn't exist in users table

---

## 🔧 Quick Debug Commands

Run these in Supabase SQL Editor to check your data:

```sql
-- Check if you have old queue entries
SELECT * FROM matchmaking_queue WHERE cf_handle = 'YOUR_HANDLE';

-- Check if your user exists
SELECT id, cf_handle FROM users WHERE cf_handle = 'YOUR_HANDLE';

-- Clean up all old entries manually
DELETE FROM matchmaking_queue WHERE status IN ('searching', 'cancelled', 'creating');

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'matchmaking_queue';
```

---

## ✅ Expected Behavior After Fix

1. **First time joining**: Clean insert → Start searching
2. **Second time (without proper exit)**: Delete old entry → Clean insert → Start searching
3. **On exit**: Entry completely removed from table
4. **On match found**: Status updated to 'matched', then entry can be deleted after battle

The error should no longer occur! 🎮
