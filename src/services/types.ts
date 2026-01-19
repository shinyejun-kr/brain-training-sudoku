// ============================================
// 공통 타입 정의
// ============================================

export type Difficulty = 'easy' | 'normal' | 'hard';
export type CellValue = number | null;
export type Board = CellValue[][];
export type GameMode = 'solo' | 'online';
export type GameStatus = 'waiting' | 'playing' | 'completed' | 'abandoned';
export type PlayerStatus = 'active' | 'completed' | 'disconnected';
export type RoomClosedReason = 'timeout' | 'host-left' | 'empty' | 'unknown';

// ============================================
// 게임 관련 타입
// ============================================

export interface SudokuPuzzle {
  board: Board;
  solution: Board;
  difficulty: Difficulty;
  createdAt: number;
}

export interface GameProgress {
  currentBoard: Board;
  startedAt: number;
  completedAt?: number;
  elapsedTime: number; // seconds
  mistakes: number;
}

export interface SoloGame {
  id: string;
  userId: string;
  puzzle: SudokuPuzzle;
  progress: GameProgress;
  status: GameStatus;
}

// ============================================
// 온라인 플레이 타입
// ============================================

export interface Player {
  id: string;
  uid: string;
  nickname: string;
  externalUserId?: string;
  progress: number; // 0-100 percentage
  status: PlayerStatus;
  completedAt?: number;
  lastSeen?: number; // Date.now() (ms)
  joinedAt?: number; // Date.now() (ms)
  // 온라인에서는 다른 유저에게 "내 보드 전체"를 공유하지 않도록 optional 처리
  currentBoard?: Board;
}

export interface OnlineRoom {
  id: string;
  hostId: string;
  puzzle: SudokuPuzzle;
  players: Record<string, Player>;
  status: GameStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  expiresAt?: number; // startedAt + 40min
  closedAt?: number;
  closedReason?: RoomClosedReason;
  winnerId?: string;
  maxPlayers: number;
}

// ============================================
// 서비스 인터페이스 (추상화)
// ============================================

export interface IBackendService {
  // Solo game
  createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame>;
  saveSoloProgress(gameId: string, progress: GameProgress): Promise<void>;
  getSoloGame(gameId: string): Promise<SoloGame | null>;
  
  // Online game
  createRoom(hostId: string, difficulty: Difficulty, maxPlayers: number, puzzle: SudokuPuzzle): Promise<OnlineRoom>;
  joinRoom(roomId: string, player: Player): Promise<void>;
  leaveRoom(roomId: string, playerId: string): Promise<void>;
  giveUp(roomId: string, playerId: string): Promise<void>;
  startGame(roomId: string): Promise<void>;
  updatePlayerProgress(roomId: string, playerId: string, progress: GameProgress): Promise<void>;
  heartbeat(roomId: string, playerId: string): Promise<void>;
  pruneStalePlayers(roomId: string, cutoffMs: number): Promise<void>;
  cleanupOldRooms(hostId: string, olderThanMs: number): Promise<number>;
  cleanupStaleRooms(olderThanMs: number): Promise<number>;
  subscribeToRoom(roomId: string, callback: (room: OnlineRoom | null) => void): () => void;
  
  // User
  signInAnonymously(): Promise<string>; // returns userId
  getCurrentUserId(): string | null;
}

// ============================================
// Validation 타입
// ============================================

export interface ValidationError {
  row: number;
  col: number;
  type: 'duplicate' | 'invalid';
  message: string;
}

export interface CellState {
  value: CellValue;
  isInitial: boolean; // 처음부터 주어진 숫자
  isError: boolean;
  isHighlighted: boolean;
}

