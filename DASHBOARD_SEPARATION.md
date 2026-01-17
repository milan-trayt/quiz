# Dashboard Separation Guide

## Overview
The host dashboard has been separated into two distinct dashboards with clear responsibilities and **full real-time synchronization**.

### 1. Setup Dashboard (`/quiz/[quizId]/host/setup`)
**Purpose:** Quiz configuration and content management

**Features:**
- ✅ Create, edit, and delete teams
- ✅ Create, edit, and delete domains
- ✅ Full question management with editability:
  - Add new domain questions
  - Edit existing questions (text, options, correct answer)
  - Delete questions
  - View all questions with their options
  - Mark questions as multiple choice (options default)
- ✅ Full buzzer question management:
  - Add new buzzer questions
  - Edit existing buzzer questions (text and answer)
  - Delete buzzer questions
  - View all buzzer questions
- ✅ Navigation link to Control Dashboard
- ✅ **Real-time updates** - Changes reflect instantly across all dashboards

**What's NOT included:**
- ❌ Player management (kicking players)
- ❌ Quiz controls (start/pause/resume/reset)
- ❌ Live game status
- ❌ Leaderboard

### 2. Control Dashboard (`/quiz/[quizId]/host/control`)
**Purpose:** Live quiz control and player management

**Features:**
- ✅ View all teams (read-only, cannot add/delete)
- ✅ Kick players from teams
- ✅ Quiz controls:
  - Start Domain Round
  - Start Buzzer Round
  - Pause/Resume Quiz
  - Reset Quiz
- ✅ Live game status display
- ✅ Game statistics
- ✅ Real-time leaderboard
- ✅ Spectator view link
- ✅ Snapshot manager integration
- ✅ Navigation link to Setup Dashboard
- ✅ **Real-time updates** - Player joins, score changes, and game state updates instantly

**What's NOT included:**
- ❌ Team creation/deletion
- ❌ Question management
- ❌ Domain management

## Real-Time Synchronization

Both dashboards are fully synchronized in real-time using WebSocket connections:

### How It Works:
1. **Socket Connection**: Each dashboard connects to the Socket.IO server on mount
2. **Room Joining**: Dashboards join a quiz-specific room (`quiz-${quizId}`)
3. **Event Emission**: All database changes trigger `quiz-update` events
4. **Auto-Refresh**: Connected clients receive updates and refresh their data automatically

### What Updates in Real-Time:
- ✅ Team creation/deletion/updates (visible in both dashboards)
- ✅ Player joins/disconnects (visible in Control Dashboard)
- ✅ Question additions/edits/deletions (visible in Setup Dashboard)
- ✅ Domain changes (visible in Setup Dashboard)
- ✅ Score updates (visible in Control Dashboard leaderboard)
- ✅ Game state changes (status, round, phase)
- ✅ Quiz controls (start/pause/resume)

### Implementation Details:
- **Hook**: `useSocket(quizId)` in both components
- **Server Actions**: All actions call `emitUpdate(quizId)` after database changes
- **Path Revalidation**: `revalidateQuizPaths()` revalidates all quiz-related routes:
  - `/quiz/${quizId}/host`
  - `/quiz/${quizId}/host/setup`
  - `/quiz/${quizId}/host/control`
  - `/quiz/${quizId}/team`
- **Socket Server**: Standalone server on port 4000 handles WebSocket connections
- **Event Flow**: Database Change → `emitUpdate()` → Socket.IO → All Connected Clients → `router.refresh()`

## Navigation Flow

```
/host (Session Manager)
  ├─ Create New Session → /quiz/[quizId]/host/setup
  └─ Existing Sessions:
      ├─ Setup Button → /quiz/[quizId]/host/setup
      └─ Control Button → /quiz/[quizId]/host/control

/quiz/[quizId]/host → Redirects to /quiz/[quizId]/host/setup

Setup Dashboard ⟷ Control Dashboard (bidirectional navigation)
```

## Typical Workflow

1. **Pre-Game Setup:**
   - Host creates a new quiz session
   - Lands on Setup Dashboard
   - Creates teams (updates visible in Control Dashboard in real-time)
   - Creates domains
   - Adds and edits questions
   - Adds and edits buzzer questions

2. **Game Time:**
   - Host switches to Control Dashboard
   - Players join teams (visible immediately in Control Dashboard)
   - Host can kick players if needed
   - Host starts rounds and controls game flow
   - Leaderboard updates in real-time as scores change
   - All changes sync to spectator view and team interfaces

3. **Post-Game or Adjustments:**
   - Host can switch back to Setup Dashboard
   - Edit questions, add more content (changes sync immediately)
   - Return to Control Dashboard to continue

## File Structure

```
src/
├── components/
│   ├── SetupDashboard.tsx       # Setup dashboard component (with useSocket)
│   ├── ControlDashboard.tsx     # Control dashboard component (with useSocket)
│   ├── HostDashboard.tsx        # (Legacy - can be removed)
│   └── HostSessionManager.tsx   # Session list with Setup/Control buttons
├── hooks/
│   └── useSocket.ts             # WebSocket hook for real-time updates
├── lib/
│   └── actions.ts               # Server actions with emitUpdate() calls
└── app/
    └── quiz/
        └── [quizId]/
            └── host/
                ├── page.tsx           # Redirects to setup
                ├── setup/
                │   └── page.tsx       # Setup dashboard route
                └── control/
                    └── page.tsx       # Control dashboard route (with SnapshotManager)
```

## Benefits of Separation

1. **Clear Responsibilities:** Each dashboard has a focused purpose
2. **Better UX:** Hosts don't get overwhelmed with too many controls
3. **Safer Operations:** Setup changes are separate from live game controls
4. **Improved Performance:** Each dashboard loads only what it needs
5. **Easier Maintenance:** Changes to one dashboard don't affect the other
6. **Flexible Workflow:** Hosts can switch between setup and control as needed
7. **Real-Time Sync:** All changes propagate instantly across all connected clients
8. **Multi-Host Support:** Multiple hosts can work simultaneously on different dashboards
