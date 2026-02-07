# 🚀 Automatic Codeforces Submission Setup

## How It Works (Similar to vjudge)

### The Problem:
Codeforces doesn't have a public API for code submission. Manual submission is slow and interrupts the battle flow.

### The Solution:
We created a **backend server** that acts like vjudge:
1. Server logs into Codeforces with your credentials
2. Server submits your code automatically
3. Frontend polls for verdict
4. Database updates on success

---

## 📋 Setup Steps

### Step 1: Install Backend Dependencies

```bash
cd f:\Projects\Code-Clash-Arena\server
npm install
```

This installs:
- `express` - Web server
- `cors` - Allow frontend to connect
- `axios` - HTTP requests to Codeforces
- `form-data` - Submit forms to Codeforces

### Step 2: Start the Submit Server

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

### Step 3: Login Your Codeforces Account

You need to login once (session lasts 24 hours). Use this API call:

**Using Postman/Thunder Client:**
```
POST http://localhost:3001/api/codeforces/login
Content-Type: application/json

{
  "handle": "your_codeforces_username",
  "password": "your_codeforces_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "handle": "your_username"
}
```

### Step 4: Test Submission

Now when you click **SUBMIT** in the battle page:
- ✅ Code submits automatically (no browser popup!)
- ✅ Verdict appears in 2-3 seconds
- ✅ Database updates automatically
- ✅ Battle ends with winner

---

## 🔄 What Happens in Database

### When Code is ACCEPTED:

#### 1. `onevone_participants` Table:
```sql
UPDATE onevone_participants
SET problem_solved = 1,
    time_taken = 145  -- seconds from battle start
WHERE onevone_battle_id = 'battle123'
  AND player_id = 'user456';
```

#### 2. `onevonebattles` Table:
```sql
UPDATE onevonebattles
SET status = 'completed',
    end_time = '2026-02-01T14:30:00Z'
WHERE onevone_battle_id = 'battle123';
```

#### 3. `users` Table:
```sql
UPDATE users
SET rating = rating + 115,        -- Trophy increase
    xp = xp + 5,                  -- Experience points
    problem_solved = problem_solved + 1
WHERE id = 'user456';
```

### Example Database State:

**Before Submission:**
```
onevone_participants:
| battle_id | player_id | problem_solved | time_taken |
|-----------|-----------|----------------|------------|
| battle123 | user456   | 0              | NULL       |
| battle123 | user789   | 0              | NULL       |

users:
| id      | cf_handle | rating | xp  | problem_solved |
|---------|-----------|--------|-----|----------------|
| user456 | tourist   | 2500   | 150 | 42             |
```

**After Submission (ACCEPTED):**
```
onevone_participants:
| battle_id | player_id | problem_solved | time_taken |
|-----------|-----------|----------------|------------|
| battle123 | user456   | 1              | 145        |  ← UPDATED!
| battle123 | user789   | 0              | NULL       |

users:
| id      | cf_handle | rating | xp  | problem_solved |
|---------|-----------|--------|-----|----------------|
| user456 | tourist   | 2615   | 155 | 43             |  ← UPDATED!
                      (+115)  (+5) (+1)
```

---

## 🔒 Security Notes

**Session Storage:**
- Sessions stored in server memory (lost on restart)
- Session expires after 24 hours
- For production: Use Redis or database

**Password Handling:**
- Passwords sent over HTTPS only
- Never stored, only used for login
- Backend holds session cookies

**CORS:**
- Only allows localhost:5173 (your frontend)
- In production: Configure proper domains

---

## 🐛 Troubleshooting

### "Not logged in to submit server"
→ Run login API first (see Step 3)

### "Failed to connect to submission server"
→ Make sure backend is running on port 3001

### "Submission failed"
→ Check if:
  - Problem exists on Codeforces
  - Language is correct
  - Code has no syntax errors

### "Session expired"
→ Login again (happens after 24 hours)

---

## 📊 Submission Flow Diagram

```
User Clicks SUBMIT
        ↓
Frontend: Check session with backend
        ↓
Backend: Has session? → YES
        ↓
Frontend: Send code to backend
        ↓
Backend: Login to Codeforces → Submit code
        ↓
Frontend: Poll for verdict (every 3s, max 2min)
        ↓
Got verdict: "Accepted"
        ↓
Frontend: Update database
  • onevone_participants: problem_solved = 1
  • onevonebattles: status = 'completed'
  • users: rating +115, xp +5, problems +1
        ↓
Navigate to result page: "🎉 YOU WON!"
```

---

## 🎯 Differences from Manual Submission

| Feature | Manual (Old) | Automatic (New) |
|---------|-------------|-----------------|
| Browser popup | ✅ Opens new tab | ❌ No popup |
| User action needed | ✅ Paste & submit | ❌ Fully automatic |
| Time to submit | ~10-15 seconds | ~2-3 seconds |
| Like vjudge | ❌ No | ✅ Yes |

---

## 🚀 Quick Start Commands

```bash
# Terminal 1 - Backend Server
cd f:\Projects\Code-Clash-Arena\server
npm install
npm start

# Terminal 2 - Frontend (if not running)
cd f:\Projects\Code-Clash-Arena
npm run dev

# Terminal 3 - Login to Codeforces
curl -X POST http://localhost:3001/api/codeforces/login \
  -H "Content-Type: application/json" \
  -d '{"handle":"your_handle","password":"your_password"}'
```

Now you're ready to battle! 🎮
