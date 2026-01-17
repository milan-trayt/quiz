# Quick Reference Guide

## 🚀 Starting The Application

```bash
# Terminal 1
npm run start

# Terminal 2
node socket-server.js
```

**URLs**:
- Host: http://localhost:3000/host
- Team: http://localhost:3000/team

---

## 🎮 Host Workflow

### 1. Setup Phase
**Dashboard**: `/quiz/[quizId]/host/setup`

```
1. Create teams
2. Create domains
3. Add questions to domains
4. Add buzzer questions
5. Edit questions as needed
```

### 2. Control Phase
**Dashboard**: `/quiz/[quizId]/host/control`

```
1. Click "Start Domain Round" or "Start Buzzer Round"
2. Monitor team progress
3. When answer shown → Click "Next Question"
4. Repeat until round complete
5. Use Pause/Resume as needed
```

---

## 🔘 Control Dashboard Buttons

| Button | When Visible | Action |
|--------|-------------|--------|
| **Start Domain Round** | Always | Starts domain round |
| **Start Buzzer Round** | Always | Starts buzzer round |
| **Next Question** ⚡ | showing_answer or showing_result | Advances to next question |
| **Pause** | During active round | Pauses quiz |
| **Resume** | When paused | Resumes quiz |
| **Reset** | Always | Resets entire quiz |

---

## 📊 Quiz Phases

### Domain Round:
```
selecting_domain → selecting_question → answering → showing_result
                                           ↑              ↓
                                           └──────────────┘
                                        (manual: Next Question)
```

### Buzzer Round:
```
buzzing → answering → showing_answer
    ↑                        ↓
    └────────────────────────┘
      (manual: Next Question)
```

---

## ⏱️ Timers

| Phase | Timer | Control |
|-------|-------|---------|
| **selecting_domain** | None | Team selects |
| **selecting_question** | None | Team selects |
| **answering** (domain) | 60s | Auto-timeout |
| **answering** (buzzer) | 20s | Auto-timeout |
| **buzzing** | 10s | Auto-timeout |
| **showing_result** | **None** | **Manual** ⚡ |
| **showing_answer** | **None** | **Manual** ⚡ |

---

## 🐛 Troubleshooting

### "Next Question" button not showing?
- Check quiz phase (must be showing_answer or showing_result)
- Refresh the page
- Check browser console for errors

### Changes not syncing?
- Verify Socket.IO server is running (port 4000)
- Check browser console for socket connection
- Refresh all open tabs

### Quiz stuck?
- Use Pause → Resume
- Check current phase in Game Status
- Use Reset if needed (clears all progress)

---

## 🔑 Key Features

### ✅ Real-Time Sync
All changes sync instantly across:
- Setup Dashboard
- Control Dashboard
- Team Interfaces
- Spectator View

### ✅ Manual Control
Host controls progression:
- No auto-advance after answers
- Click "Next Question" when ready
- Full control over pacing

### ✅ Separated Dashboards
- **Setup**: Content management
- **Control**: Game control

---

## 📱 Multi-Device Setup

### Recommended Setup:
```
Device 1: Control Dashboard (host)
Device 2: Spectator View (projector/screen)
Device 3+: Team Interfaces (participants)
```

### Alternative Setup:
```
Device 1: Control Dashboard + Setup Dashboard (host)
Device 2: Spectator View (projector/screen)
Phones: Team Interfaces (participants)
```

---

## 💡 Pro Tips

1. **Pre-game**: Use Setup Dashboard to prepare all content
2. **During game**: Keep Control Dashboard open
3. **Spectator View**: Open in separate window/screen
4. **Pacing**: Take your time on showing phases
5. **Engagement**: Discuss answers before clicking "Next Question"
6. **Backup**: Keep Setup Dashboard open in another tab

---

## 🎯 Common Scenarios

### Scenario 1: Wrong Answer Shown
```
1. Note the issue
2. Continue with quiz
3. After round, go to Setup Dashboard
4. Edit the question
5. Changes sync immediately
```

### Scenario 2: Need to Add Question Mid-Game
```
1. Keep Control Dashboard open
2. Open Setup Dashboard in new tab
3. Add question
4. Return to Control Dashboard
5. Question available immediately
```

### Scenario 3: Technical Issue
```
1. Click Pause
2. Fix the issue
3. Click Resume
4. Continue from where you left off
```

---

## 📞 Quick Help

**App not loading?**
- Check both servers are running
- Check ports 3000 and 4000 are free

**Real-time not working?**
- Restart Socket.IO server
- Refresh all browser tabs

**Quiz behaving oddly?**
- Use Reset button
- Start fresh quiz session

---

## 🎉 That's It!

You're ready to host an amazing quiz experience with full control and real-time synchronization!

**Remember**: The "Next Question" button is your friend - use it when you're ready to move forward! ⚡
