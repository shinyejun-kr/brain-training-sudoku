# 🏗️ Architecture Documentation

## 📁 Project Structure

```
sudoku-game/
├── src/
│   ├── services/              # Backend abstraction layer
│   │   ├── types.ts          # ⭐ All TypeScript interfaces
│   │   ├── firebaseService.ts # ⭐ Firebase implementation
│   │   └── backendService.ts  # ⭐ Abstraction layer (easy to swap)
│   │
│   ├── core/                  # Game logic (framework-agnostic)
│   │   ├── sudokuGenerator.ts # Puzzle generation algorithm
│   │   ├── sudokuValidator.ts # Rule validation
│   │   └── sudokuSolver.ts    # Backtracking solver
│   │
│   ├── components/            # React UI components
│   │   ├── Cell.tsx           # Individual cell
│   │   ├── SudokuBoard.tsx    # Main game board
│   │   ├── Timer.tsx          # Timer display
│   │   ├── ModeSelector.tsx   # Game mode selection
│   │   └── RoomManager.tsx    # Online room UI
│   │
│   ├── hooks/                 # React custom hooks
│   │   ├── useSudokuGame.ts   # Solo game state
│   │   └── useOnlineRoom.ts   # Online room state
│   │
│   ├── App.tsx                # Main app component
│   ├── App.css                # Global styles
│   ├── main.tsx               # Entry point
│   └── firebase.config.ts     # Firebase initialization
│
├── public/                    # Static assets
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                  # User guide
└── ARCHITECTURE.md            # This file

```

## 🎯 Key Design Principles

### 1. **Backend Abstraction**

The most important architectural decision is the **abstraction layer** between UI and backend.

```typescript
// services/types.ts - Interface definition
export interface IBackendService {
  signInAnonymously(): Promise<string>;
  createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame>;
  createRoom(hostId: string, difficulty: Difficulty): Promise<OnlineRoom>;
  // ... more methods
}

// services/firebaseService.ts - Current implementation
class FirebaseService implements IBackendService { /* ... */ }

// services/backendService.ts - Factory pattern
const BACKEND_TYPE: BackendType = 'firebase'; // Easy to change!
export const backendService = createBackendService();
```

**Benefits:**
- ✅ Swap Firebase → REST API by changing 1 variable
- ✅ Easy testing with mock implementation
- ✅ Clear contract between frontend and backend
- ✅ No Firebase-specific code in components

### 2. **Separation of Concerns**

```
┌─────────────────────────────────────────┐
│            Components (UI)              │  ← React, presentation only
├─────────────────────────────────────────┤
│          Hooks (State Logic)            │  ← React hooks, no UI
├─────────────────────────────────────────┤
│       Backend Service (Abstraction)     │  ⭐ Swap point
├─────────────────────────────────────────┤
│    Firebase / REST API (Implementation) │  ← Actual backend
├─────────────────────────────────────────┤
│         Core Logic (Pure Functions)     │  ← Framework-agnostic
└─────────────────────────────────────────┘
```

### 3. **Type Safety**

All data structures are defined in `services/types.ts`:

```typescript
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Board = CellValue[][];
export interface SudokuPuzzle { /* ... */ }
export interface OnlineRoom { /* ... */ }
```

This ensures type safety across the entire app.

## 🔄 Data Flow

### Solo Mode

```
User Action
    ↓
Component (SudokuBoard)
    ↓
Hook (useSudokuGame)
    ↓
Core Logic (validator, generator)
    ↓
Backend Service
    ↓
Firebase / API
```

### Online Mode

```
User Action
    ↓
Component (SudokuBoard + RoomManager)
    ↓
Hook (useOnlineRoom)
    ↓
Backend Service
    ↓
Firebase / API
    ↓
Real-time subscription
    ↓
Hook updates
    ↓
Component re-renders
```

## 🚀 How to Switch to Your Own Backend

### Step 1: Implement REST API Service

Edit `services/backendService.ts`:

```typescript
class RestApiBackendService implements IBackendService {
  private apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  async signInAnonymously(): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/auth/anonymous`, {
      method: 'POST',
    });
    return response.json();
  }

  async createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame> {
    const response = await fetch(`${this.apiBaseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, difficulty }),
    });
    return response.json();
  }

  // ... implement all other methods from IBackendService
}
```

### Step 2: Update Backend Type

```typescript
const BACKEND_TYPE: BackendType = 'rest-api'; // Change this line
```

### Step 3: Add Environment Variables

```bash
# .env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_KEY=your_api_key
```

### Step 4: Done! 🎉

No other code changes needed. All components continue to work.

## 🧩 Algorithm Details

### Sudoku Generation

1. **Create Full Board**:
   - Fill first row with random [1-9]
   - Use backtracking solver to complete

2. **Remove Cells**:
   - Randomly remove cells based on difficulty
   - Ensure unique solution (for easy/normal)
   - Hard mode skips validation for speed

3. **Difficulty Settings**:
   ```typescript
   const CELLS_TO_REMOVE = {
     easy: 30,   // 51 hints
     normal: 45, // 36 hints
     hard: 55,   // 26 hints
   };
   ```

### Validation

- **Row Check**: No duplicates in same row
- **Column Check**: No duplicates in same column
- **Box Check**: No duplicates in 3x3 box

### Solver

Standard **backtracking algorithm**:
1. Find empty cell
2. Try numbers 1-9
3. Check if valid
4. Recursively solve
5. Backtrack if stuck

## 🎨 UI/UX Design

### Color System

```css
--color-bg-primary: #0a0e27;     /* Main background */
--color-bg-secondary: #1a1f3a;   /* Card background */
--color-accent-primary: #667eea;  /* Purple accent */
--color-success: #48bb78;         /* Green for complete */
--color-error: #f56565;           /* Red for errors */
```

### Component Hierarchy

```
App
├── ModeSelector
│   ├── DifficultySelector
│   └── ModeCards
│
├── SoloGame
│   └── SudokuBoard
│       ├── Timer
│       ├── Cell (× 81)
│       └── NumberPad
│
└── OnlineGame
    ├── SudokuBoard (same as above)
    └── RoomManager
        ├── RoomInfo
        ├── PlayersList
        └── RoomActions
```

## 🔐 Firebase Data Structure

### Collections

```
users/
  {uid}/
    - createdAt: timestamp
    - lastActive: timestamp

games/
  {gameId}/
    - userId: string
    - puzzle:
        - board: number[][]
        - solution: number[][]
        - difficulty: 'easy' | 'normal' | 'hard'
        - createdAt: number
    - progress:
        - currentBoard: number[][]
        - startedAt: number
        - elapsedTime: number
        - mistakes: number
    - status: 'playing' | 'completed'
    - createdAt: serverTimestamp
    - updatedAt: serverTimestamp

rooms/
  {roomId}/
    - hostId: string
    - puzzle: { same as above }
    - players:
        {playerId}:
          - id: string
          - uid: string
          - nickname: string
          - progress: number (0-100)
          - status: 'active' | 'completed'
          - currentBoard: number[][]
          - completedAt?: number
    - status: 'waiting' | 'playing' | 'completed'
    - winnerId?: string
    - maxPlayers: number
    - createdAt: number
    - startedAt?: number
```

### Security Rules (Example)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own games
    match /games/{gameId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Anyone can read rooms, only players can write
    match /rooms/{roomId} {
      allow read: if true;
      allow write: if request.auth.uid in resource.data.players.keys();
    }
  }
}
```

## 🧪 Testing Strategy

### Unit Tests (Recommended)

```typescript
// core/sudokuValidator.test.ts
describe('isValidPlacement', () => {
  it('should return false for duplicate in row', () => {
    const board = createEmptyBoard();
    board[0][0] = 5;
    expect(isValidPlacement(board, 0, 1, 5)).toBe(false);
  });
});
```

### Integration Tests

Test hooks with React Testing Library:

```typescript
// hooks/useSudokuGame.test.ts
describe('useSudokuGame', () => {
  it('should generate puzzle on mount', () => {
    const { result } = renderHook(() => useSudokuGame({ difficulty: 'easy' }));
    expect(result.current.puzzle).toBeDefined();
  });
});
```

### E2E Tests

Use Playwright or Cypress for full user flows.

## 📊 Performance Considerations

1. **Puzzle Generation**: Runs in ~100-500ms
   - Easy/Normal: Validates unique solution
   - Hard: Skips validation for speed

2. **React Optimization**:
   - `useMemo` for computed cell states
   - `useCallback` for event handlers
   - Cell components are lightweight

3. **Firebase**:
   - Real-time listeners only for active rooms
   - Automatic cleanup on unmount

## 🚀 Deployment

### Vercel / Netlify

```bash
npm run build
# Deploy dist/ folder
```

### Environment Variables

Set these in deployment platform:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- etc.

## 🔮 Future Enhancements

1. **Add Hints System**: `getSolution()` can provide hints
2. **Undo/Redo**: Track board history
3. **Achievements**: Track stats in Firestore
4. **PWA**: Add service worker for offline play
5. **Analytics**: Track completion times, difficulty preferences

---

Built with 💜 for scalable, maintainable architecture.

