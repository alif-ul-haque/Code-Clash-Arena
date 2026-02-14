# Global Battle Matchmaking - Bug Fixes

## 🐛 Problems Identified

### 1. **No Data in matchmaking_queue Table**
- **Symptom**: Table remained empty despite clicking Global Battle
- **Root Cause**: `currentUser` was undefined in `1v1_global_page.jsx`
- **Why**: Navigation from playmode page didn't pass user data

### 2. **Matchmaking Never Started**
- **Symptom**: Stuck on "SEARCHING..." screen indefinitely
- **Root Cause**: Code had conditional check `if (currentUser)` that always failed
- **Impact**: Entire matchmaking logic never executed

### 3. **Missing User Data Flow**
- **Problem**: When clicking "GLOBAL BATTLE" button:
  - No state passed to `/1v1-global` route
  - `location.state` was `null`
  - `currentUser` was `undefined`
  - Matchmaking never initialized

---

## 🔧 Fixes Applied

### Fix 1: Updated `1v1_playmode_page.jsx`
**Location**: Lines 107-128

**Before**:
```jsx
<div className="battle-card" onClick={() => navigate('/1v1-global')}>
```

**After**:
```jsx
<div className="battle-card" onClick={() => {
    const currentUser = localStorage.getItem('loggedInUser');
    if (!currentUser) {
        alert('Please log in first');
        navigate('/login');
        return;
    }
    localStorage.setItem('currentUser', currentUser);
    navigate('/1v1-global', {
        state: {
            currentUser: currentUser,
            playerRating: userData.rating
        }
    });
}}>
```

**What it does**:
- ✅ Gets logged-in user from localStorage
- ✅ Stores in `currentUser` key for backup
- ✅ Passes data via `location.state`
- ✅ Includes rating for matchmaking
- ✅ Redirects to login if not logged in

---

### Fix 2: Updated `1v1_global_page.jsx`
**Location**: Lines 15-45

**Added Fallback Logic**:
```jsx
// Get currentUser from state or localStorage
let currentUser = stateCurrentUser;
if (!currentUser) {
    currentUser = localStorage.getItem('currentUser');
    console.log('Retrieved currentUser from localStorage:', currentUser);
}

if (!currentUser) {
    console.error('No currentUser found! Redirecting...');
    setSearchStatus('User not found. Redirecting...');
    setTimeout(() => navigate('/playmode1v1'), 2000);
    return;
}
```

**What it does**:
- ✅ Tries to get user from `location.state` first (preferred)
- ✅ Falls back to localStorage if state is missing (backup)
- ✅ Shows clear error if no user found
- ✅ Redirects gracefully instead of hanging

---

### Fix 3: Improved Error Handling
**Location**: Lines 30-60 in `1v1_global_page.jsx`

**Added**:
```jsx
const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, cf_handle, rating')
    .eq('cf_handle', currentUser)
    .single();

if (userError) {
    console.error('Error fetching user:', userError);
    setSearchStatus('Error loading user data');
    setTimeout(() => navigate('/playmode1v1'), 3000);
    return;
}

if (!userData) {
    console.error('User not found in database');
    setSearchStatus('User not found');
    setTimeout(() => navigate('/playmode1v1'), 3000);
    return;
}
```

**What it does**:
- ✅ Validates database response
- ✅ Shows specific error messages
- ✅ Updates UI with error status
- ✅ Auto-redirects on failure

---

### Fix 4: Enhanced Logging in `globalMatchmaking.js`
**Location**: Lines 15-50

**Added Debug Logs**:
```jsx
console.log('joinMatchmakingQueue called with:', { userId, cfHandle, rating });
console.log('Inserting into matchmaking_queue...');
console.log('✓ Successfully joined matchmaking queue:', data);
```

**Improved Error Handling**:
```jsx
const { data: existing, error: checkError } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'searching')
    .maybeSingle(); // Changed from .single()

if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking existing queue:', checkError);
    throw checkError;
}
```

**What it does**:
- ✅ Uses `.maybeSingle()` instead of `.single()` to avoid errors when no row exists
- ✅ Ignores "PGRST116" (row not found) error which is expected
- ✅ Logs every step for debugging
- ✅ Better error messages

---

### Fix 5: Removed Broken Conditional
**Location**: Line 124 in `1v1_global_page.jsx`

**Before**:
```jsx
if (currentUser) {
    startMatchmaking();
}
```

**After**:
```jsx
// Start matchmaking immediately
startMatchmaking();
```

**Why**:
- The `if (currentUser)` check captured `currentUser` from outer scope
- But we now get `currentUser` INSIDE `startMatchmaking()`
- This check would always see `undefined` and never run
- **Solution**: Remove the check, let function handle validation

---

## ✅ Testing Checklist

After these fixes, verify:
- [ ] Click "GLOBAL BATTLE" button
- [ ] Check console logs show: "joinMatchmakingQueue called with..."
- [ ] Check Supabase `matchmaking_queue` table has new row
- [ ] Status shows: "Joining matchmaking queue..." → "Searching for opponent..."
- [ ] If two users search, they get matched
- [ ] On match, both navigate to battle page

---

## 🔍 How to Debug

### Check if user data is passed:
```javascript
// In browser console on global page:
console.log(window.localStorage.getItem('currentUser'));
console.log(window.localStorage.getItem('loggedInUser'));
```

### Check database insertion:
1. Open Supabase dashboard
2. Go to `matchmaking_queue` table
3. Should see row with:
   - `user_id`: UUID
   - `cf_handle`: Your username
   - `rating`: Your rating
   - `status`: 'searching'

### Check console logs:
Look for these messages in order:
```
Starting matchmaking for: <username>
joinMatchmakingQueue called with: { userId: ..., cfHandle: ..., rating: ... }
Inserting into matchmaking_queue...
✓ Successfully joined matchmaking queue: { ... }
✓ Joined queue: { ... }
🔍 Starting matchmaking... User: <username>, Rating: <rating>
```

---

## 🎯 Root Cause Summary

**The Chain of Failures**:
1. Click "GLOBAL BATTLE" → No data passed
2. `location.state` is `null` → `currentUser` is `undefined`
3. `if (currentUser)` check fails → Matchmaking never starts
4. Nothing inserted into database → Queue stays empty
5. No match can be found → Stuck on "Searching..."

**The Fix Chain**:
1. Pass `currentUser` via `location.state` ✅
2. Add localStorage fallback ✅
3. Remove conditional check ✅
4. Add proper error handling ✅
5. Enhance logging for debugging ✅

---

## 🚀 Expected Behavior Now

1. User clicks "GLOBAL BATTLE"
2. Page loads, shows "Joining matchmaking queue..."
3. User added to database (visible in Supabase)
4. Status changes to "Searching for opponent..."
5. Every 2 seconds, checks for valid matches
6. When match found: "Found opponent! Creating battle..."
7. Both players navigate to battle page
8. Game begins!
