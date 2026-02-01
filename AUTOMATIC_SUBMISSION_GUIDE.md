# 🎮 Automatic Codeforces Submission - Complete Guide

## 📖 What Changed?

### **Before (Manual Submission):**
1. Click SUBMIT button
2. New Codeforces tab opens
3. You manually paste code
4. You manually select language
5. You manually click submit
6. We poll for verdict

### **Now (Automatic Submission like vjudge):**
1. Click SUBMIT button
2. ✨ **Code submits automatically** (no popup!)
3. Verdict appears in 2-3 seconds
4. Database updates automatically
5. Battle ends instantly

---

## 🔧 How It Works (Technical Explanation)

### Architecture:
```
Frontend (React)  ←→  Backend Server  ←→  Codeforces
                   (Port 3001)
```

### The Flow:

#### **Step 1: Backend Login**
- Server logs into Codeforces with your credentials
- Stores session cookies (like browser cookies)
- Session lasts 24 hours

#### **Step 2: Code Submission**
When you click SUBMIT:
```javascript
// Frontend sends code to backend
submitToCodeforces({
  handle: 'tourist',
  contestId: 2185,
  problemIndex: 'A',
  code: 'your code here',
  language: 'PYTHON'
})

// Backend does this:
1. Get CSRF token from Codeforces
2. Create form data with code
3. POST to Codeforces submit endpoint
4. Return success/failure
```

#### **Step 3: Verdict Polling**
```javascript
// Frontend polls Codeforces API
pollForVerdict('tourist', 2185, 'A', 40, 3000)
// Checks every 3 seconds, max 40 attempts (2 minutes)

// When verdict is "OK" (Accepted):
1. Update onevone_participants
2. Update onevonebattles
3. Update users table
4. Navigate to result page
```

---

## 💾 Database Changes Explained

### Tables Affected:

#### **1. `onevone_participants`**
Tracks individual player progress in a battle.

**Columns Updated:**
- `problem_solved` - Set to `1` when accepted
- `time_taken` - Seconds from battle start to acceptance

**Example:**
```sql
-- Before submission
| battle_id  | player_id | problem_solved | time_taken |
|------------|-----------|----------------|------------|
| battle_001 | user_123  | 0              | NULL       |

-- After ACCEPTED verdict
| battle_id  | player_id | problem_solved | time_taken |
|------------|-----------|----------------|------------|
| battle_001 | user_123  | 1              | 145        |  ← 145 seconds to solve
```

#### **2. `onevonebattles`**
Tracks overall battle status.

**Columns Updated:**
- `status` - Changed from `'active'` to `'completed'`
- `end_time` - Set to current timestamp

**Example:**
```sql
-- Before
| battle_id  | status | start_time          | end_time |
|------------|--------|---------------------|----------|
| battle_001 | active | 2026-02-01 10:00:00 | NULL     |

-- After
| battle_id  | status    | start_time          | end_time            |
|------------|-----------|---------------------|---------------------|
| battle_001 | completed | 2026-02-01 10:00:00 | 2026-02-01 10:02:25 |
```

#### **3. `users`**
Updates winner's stats.

**Columns Updated:**
- `rating` - Increases by `+115` (trophy points)
- `xp` - Increases by `+5` (experience points)
- `problem_solved` - Increases by `+1`

**Example:**
```sql
-- Before win
| id       | cf_handle | rating | xp  | problem_solved |
|----------|-----------|--------|-----|----------------|
| user_123 | tourist   | 2500   | 150 | 42             |

-- After win
| id       | cf_handle | rating | xp  | problem_solved |
|----------|-----------|--------|-----|----------------|
| user_123 | tourist   | 2615   | 155 | 43             |
                       (+115)  (+5)  (+1)
```

### Why These Tables?

- **`onevone_participants`** - Needed to track who solved first (determines winner)
- **`onevonebattles`** - Marks battle as finished (prevents duplicate submissions)
- **`users`** - Rewards winner with points (shown in profile/leaderboard)

---

## 🚀 Setup Instructions

### **Step 1: Install Dependencies**

Open terminal in project folder:
```bash
cd f:\Projects\Code-Clash-Arena\server
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Allows frontend (port 5173) to call backend (port 3001)
- `axios` - Makes HTTP requests to Codeforces
- `form-data` - Formats submission data

### **Step 2: Start Backend Server**

```bash
npm start
```

You should see:
```
🚀 Codeforces Submit Server running on http://localhost:3001
📝 Endpoints:
   POST /api/codeforces/login - Login to Codeforces
   POST /api/codeforces/submit - Submit code
   GET  /api/codeforces/check-session/:handle - Check session
   POST /api/codeforces/logout - Logout
```

**Keep this terminal running!** The server must be active for automatic submission to work.

### **Step 3: Start Frontend (if not running)**

Open new terminal:
```bash
cd f:\Projects\Code-Clash-Arena
npm run dev
```

### **Step 4: Login to Codeforces**

When you start a battle, you'll see a login modal:

```
┌─────────────────────────────────────┐
│  🔐 Codeforces Login Required       │
│                                     │
│  Handle: tourist                    │
│  Password: ********                 │
│                                     │
│  [LOGIN]                            │
└─────────────────────────────────────┘
```

Enter your Codeforces password. Session lasts 24 hours.

### **Step 5: Battle!**

Now when you click SUBMIT:
1. ✅ Code submits automatically
2. ✅ Status shows real-time updates
3. ✅ Verdict appears in 2-3 seconds
4. ✅ Database updates automatically
5. ✅ Winner screen appears

---

## 🔍 What Happens Behind the Scenes

### When You Click SUBMIT:

```javascript
// 1. Check if backend has your session
setSubmitMessage('🔍 Checking session...');
const session = await checkSession(currentUser);
// → Calls: GET http://localhost:3001/api/codeforces/check-session/tourist

// 2. Submit code via backend
setSubmitMessage('✓ Session active. Submitting code...');
const result = await submitToCodeforces({
  handle: currentUser,
  contestId: 2185,
  problemIndex: 'A',
  code: 'your code',
  language: 'PYTHON'
});
// → Calls: POST http://localhost:3001/api/codeforces/submit
// Backend logs into Codeforces and submits

// 3. Wait for Codeforces to process
await new Promise(resolve => setTimeout(resolve, 3000));
setSubmitMessage('✅ Code submitted! Waiting for verdict...');

// 4. Poll for verdict
setSubmitMessage('⏳ Checking verdict...');
const submission = await pollForVerdict(
  currentUser,      // 'tourist'
  2185,            // Contest ID
  'A',             // Problem index
  40,              // Max 40 attempts
  3000             // Every 3 seconds
);
// → Calls Codeforces API: /api/user.status?handle=tourist

// 5. Check if accepted
if (submission.verdict === 'OK') {
  setSubmitMessage('Verdict: Accepted ✅');
  
  // 6. Update database
  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
  
  // Update participants
  await supabase
    .from('onevone_participants')
    .update({
      problem_solved: 1,
      time_taken: timeTaken  // e.g., 145 seconds
    })
    .eq('onevone_battle_id', battleId)
    .eq('player_id', currentUserId);
  
  // Update battle
  await supabase
    .from('onevonebattles')
    .update({
      status: 'completed',
      end_time: new Date().toISOString()
    })
    .eq('onevone_battle_id', battleId);
  
  // Update user stats
  await supabase
    .from('users')
    .update({
      rating: rating + 115,
      xp: xp + 5,
      problem_solved: problem_solved + 1
    })
    .eq('id', currentUserId);
  
  // 7. Show result
  navigate('/submit-page-real', {
    won: true,
    trophyChange: '+115'
  });
}
```

---

## 📊 Status Messages Explained

| Message | What's Happening |
|---------|------------------|
| 🔍 Checking session... | Verifying backend has your login |
| ✓ Session active. Submitting code... | Sending code to backend |
| ✅ Code submitted! Waiting for verdict... | Codeforces received submission |
| ⏳ Checking verdict... | Polling for result |
| Verdict: Accepted ✅ | Code passed all tests! |
| Verdict: Wrong Answer ❌ | Code failed some test |
| Verdict: Time Limit Exceeded ⏱️ | Code too slow |

---

## ❓ FAQ

### **Q: Why do I need a backend server?**
A: Codeforces doesn't have a public submission API. The backend acts like vjudge - it logs in and submits on your behalf.

### **Q: Is my password safe?**
A: Passwords are sent only to the backend (never stored), which uses them to get session cookies. Session expires after 24 hours.

### **Q: What if the backend crashes?**
A: Sessions are lost. Just restart the server and login again.

### **Q: Can I use this in production?**
A: For production:
- Use Redis for session storage (not memory)
- Use HTTPS for password transmission
- Store passwords encrypted in database
- Add rate limiting

### **Q: Why 24-hour sessions?**
A: Codeforces sessions expire. 24 hours balances security and convenience.

### **Q: What if submission fails?**
A: Possible reasons:
- Backend not running → Start server
- Session expired → Login again
- Wrong language ID → Check language mapping
- Duplicate submission → Codeforces prevents identical code

---

## 🐛 Troubleshooting

### "Failed to connect to submission server"
```bash
# Make sure backend is running
cd f:\Projects\Code-Clash-Arena\server
npm start

# Check if port 3001 is free
netstat -ano | findstr :3001
```

### "Not logged in to submit server"
```
→ Enter your Codeforces password in the login modal
→ Session lasts 24 hours
→ If expired, login again
```

### "Submission failed"
```
Possible causes:
✓ Problem doesn't exist on Codeforces
✓ Language not supported
✓ Code has syntax errors
✓ Duplicate submission (same code already submitted)
```

### Backend logs show errors
```bash
# Check backend console for details
# Common issues:
- CORS error → Check frontend URL in server code
- CSRF token error → Codeforces changed their form
- Network error → Check internet connection
```

---

## 🎯 Comparison with vjudge

| Feature | vjudge | Our System |
|---------|--------|------------|
| Backend server | ✅ Yes | ✅ Yes |
| Auto submission | ✅ Yes | ✅ Yes |
| Session management | ✅ Yes | ✅ Yes (24h) |
| Verdict polling | ✅ Yes | ✅ Yes (3s interval) |
| Database integration | ❌ No | ✅ Yes |
| Battle tracking | ❌ No | ✅ Yes |
| Real-time updates | ❌ No | ✅ Yes |

---

## 📁 Files Created/Modified

### **New Files:**
```
server/
  ├── codeforcesSubmitServer.js  ← Backend API server
  ├── package.json               ← Dependencies
  └── SETUP_GUIDE.md             ← Detailed guide

src/pvp_battle/
  ├── utilities/
  │   └── autoSubmitAPI.js       ← Frontend API client
  └── components/
      ├── CodeforcesLogin.jsx    ← Login modal
      └── CodeforcesLogin.css    ← Login styles
```

### **Modified Files:**
```
src/pvp_battle/pages/
  └── 1v1_coding_battle_page.jsx  ← Uses automatic submission
```

---

## 🚀 Quick Start

```bash
# 1. Install backend dependencies
cd f:\Projects\Code-Clash-Arena\server
npm install

# 2. Start backend
npm start
# Keep running! ←

# 3. Start frontend (new terminal)
cd f:\Projects\Code-Clash-Arena
npm run dev

# 4. Open battle page
# http://localhost:5173

# 5. Login when prompted
# Enter Codeforces password

# 6. Start battle and click SUBMIT
# Watch it submit automatically! 🎉
```

---

You're all set! Now your submissions work exactly like vjudge - fully automatic with real-time database updates! 🎮✨
