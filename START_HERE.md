# 🎯 START HERE - Quick Setup (2 Minutes)

## What You Need to Do:

### 1️⃣ Open Terminal 1 - Start Backend Server
```bash
cd f:\Projects\Code-Clash-Arena\server
npm install
npm start
```

**You'll see:**
```
🚀 Codeforces Submit Server running on http://localhost:3001
```

**✅ Leave this running!**

---

### 2️⃣ Open Terminal 2 - Start Frontend
```bash
cd f:\Projects\Code-Clash-Arena
npm run dev
```

**You'll see:**
```
Local: http://localhost:5173/
```

---

### 3️⃣ Test It!

1. Go to battle page
2. You'll see login modal (first time only)
3. Enter your Codeforces password
4. Click LOGIN
5. Write code
6. Click SUBMIT
7. ✨ **It submits automatically!** (no popup!)
8. Verdict appears in 2-3 seconds
9. Database updates automatically
10. Winner screen shows

---

## 🎬 What's Different Now?

### **BEFORE (Manual):**
```
Click SUBMIT
  ↓
New tab opens
  ↓
You paste code manually
  ↓
You select language manually
  ↓
You click submit manually
  ↓
Wait for verdict
  ↓
Database updates
```

### **NOW (Automatic like vjudge):**
```
Click SUBMIT
  ↓
✨ Automatic submission!
  ↓
Verdict in 2-3 seconds
  ↓
Database auto-updates
  ↓
Winner screen!
```

---

## 🔑 Key Points:

**Backend Server (Port 3001):**
- Logs into Codeforces with your credentials
- Submits code automatically
- Session lasts 24 hours
- **Must keep running!**

**Login Modal:**
- Appears only if not logged in
- Enter Codeforces password once
- Valid for 24 hours
- No manual submission needed!

**Database Updates:**
- `onevone_participants`: Sets `problem_solved = 1`, stores `time_taken`
- `onevonebattles`: Updates `status = 'completed'`, sets `end_time`
- `users`: Increases `rating +115`, `xp +5`, `problem_solved +1`

---

## 📋 Troubleshooting:

**"Failed to connect to submission server"**
→ Start backend: `cd server && npm start`

**"Not logged in to submit server"**
→ Enter password in login modal

**Backend shows errors**
→ Check console logs for details

---

## 📚 Documentation:

- **Full Guide:** `AUTOMATIC_SUBMISSION_GUIDE.md`
- **Server Details:** `server/SETUP_GUIDE.md`

---

## That's It! 🎉

Now your system works exactly like vjudge - fully automatic submission with real-time database tracking!
