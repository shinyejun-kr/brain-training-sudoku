# 🧠 Brain Training Sudoku

A modern, multiplayer Sudoku game built with React, TypeScript, and Firebase.

## ✨ Features

### 🎮 Game Modes
- **Solo Play**: Practice at your own pace with automatic progress saving
- **Online Battle**: Compete with friends in real-time

### 🎯 Difficulty Levels
- **Easy**: 51 hints (30 cells removed)
- **Normal**: 36 hints (45 cells removed)
- **Hard**: 26 hints (55 cells removed)

### 🔥 Key Features
- ✅ Real-time multiplayer with Firebase
- ✅ Automatic puzzle generation
- ✅ Input validation with error highlighting
- ✅ Timer and progress tracking
- ✅ Responsive design (mobile-friendly)
- ✅ Dark theme with modern UI
- ✅ **Abstracted backend architecture** - Easy to switch from Firebase to your own API

## 🏗️ Architecture

```
src/
├── services/
│   ├── types.ts              # Type definitions
│   ├── firebaseService.ts    # Firebase implementation
│   └── backendService.ts     # ⭐ Abstraction layer
├── core/
│   ├── sudokuGenerator.ts    # Puzzle generation
│   ├── sudokuValidator.ts    # Rule validation
│   └── sudokuSolver.ts       # Backtracking solver
├── components/
│   ├── SudokuBoard.tsx
│   ├── Cell.tsx
│   ├── ModeSelector.tsx
│   ├── RoomManager.tsx
│   └── Timer.tsx
├── hooks/
│   ├── useSudokuGame.ts
│   └── useOnlineRoom.ts
└── App.tsx
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

#### Option A: Use Demo Mode (No Firebase Required)
The app will work in demo mode without Firebase configuration.

#### Option B: Connect to Firebase
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** > **Anonymous Sign-In**
3. Create a **Firestore Database** (test mode)
4. Copy Firebase config:
   ```bash
   cp .env.example .env
   ```
5. Fill in your Firebase credentials in `.env`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🔄 Switching to Your Own Backend

The app is designed to easily switch from Firebase to your own serverless API:

### Current: Firebase

```typescript
// src/services/backendService.ts
const BACKEND_TYPE: BackendType = 'firebase';
```

### Future: Your REST API

1. **Implement REST API methods** in `RestApiBackendService`:

```typescript
class RestApiBackendService implements IBackendService {
  async signInAnonymously(): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/auth/anonymous`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.userId;
  }

  async createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame> {
    const response = await fetch(`${this.apiBaseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, difficulty }),
    });
    return response.json();
  }

  // ... implement other methods
}
```

2. **Update backend type**:

```typescript
const BACKEND_TYPE: BackendType = 'rest-api';
```

3. **Set API URL** in `.env`:

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

That's it! No other code changes needed. ✨

## 📡 API Endpoints (For Future Backend)

### Authentication
- `POST /auth/anonymous` - Anonymous sign-in

### Solo Game
- `POST /games` - Create solo game
- `GET /games/:gameId` - Get game state
- `PUT /games/:gameId/progress` - Save progress

### Online Room
- `POST /rooms` - Create room
- `GET /rooms/:roomId` - Get room state
- `POST /rooms/:roomId/join` - Join room
- `DELETE /rooms/:roomId/leave` - Leave room
- `PUT /rooms/:roomId/progress` - Update player progress
- `GET /rooms/:roomId/subscribe` - WebSocket for real-time updates

## 🎨 UI Design

- **Theme**: Dark mode with subtle gradients
- **Colors**: Purple/Blue accent colors (no neon)
- **Style**: Minimalist, modern, professional
- **Components**: Outline buttons, clean borders, smooth transitions

## 🗄️ Firebase Data Structure

```
users/
  {uid}/
    - createdAt
    - lastActive

games/
  {gameId}/
    - userId
    - puzzle: { board, solution, difficulty }
    - progress: { currentBoard, startedAt, elapsedTime }
    - status: 'playing' | 'completed'

rooms/
  {roomId}/
    - hostId
    - puzzle: { board, solution, difficulty }
    - players: { [playerId]: Player }
    - status: 'waiting' | 'playing' | 'completed'
    - winnerId
```

## 🧪 Testing

```bash
# Run unit tests (when available)
npm run test

# Type check
npm run type-check

# Build
npm run build
```

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes (for Firebase) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes (for Firebase) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes (for Firebase) |
| `VITE_API_BASE_URL` | Your API base URL | Yes (for REST API) |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License

## 🎯 Roadmap

- [ ] Add hints system
- [ ] Implement undo/redo
- [ ] Add daily challenges
- [ ] Leaderboard
- [ ] Multiple themes
- [ ] Sound effects
- [ ] Achievements system

---

Built with ❤️ by Brain Training Team
