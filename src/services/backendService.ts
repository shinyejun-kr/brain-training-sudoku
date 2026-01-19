import { firebaseService } from './firebaseService';
import type {
  IBackendService,
  SoloGame,
  OnlineRoom,
  Player,
  GameProgress,
  Difficulty,
} from './types';

type BackendType = 'firebase' | 'rest-api' | 'mock';

const BACKEND_TYPE: BackendType = 'firebase';

class MockBackendService implements IBackendService {
  private mockUserId = 'mock-user-123';
  private mockGames = new Map<string, SoloGame>();
  private mockRooms = new Map<string, OnlineRoom>();
  private storageKey = 'sudoku-mock-rooms';
  private listenersKey = 'sudoku-room-update';

  constructor() {
    this.loadRoomsFromStorage();
    
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.loadRoomsFromStorage();
      }
    });
  }

  private loadRoomsFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const rooms = JSON.parse(stored);
        this.mockRooms.clear();
        Object.entries(rooms).forEach(([id, room]) => {
          this.mockRooms.set(id, room as OnlineRoom);
        });
      }
    } catch (error) {
      console.error('Failed to load rooms from storage:', error);
    }
  }

  private saveRoomsToStorage() {
    try {
      const rooms: Record<string, OnlineRoom> = {};
      this.mockRooms.forEach((room, id) => {
        rooms[id] = room;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(rooms));
      
      // 다른 탭에 변경 알림
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.listenersKey,
        newValue: Date.now().toString(),
      }));
    } catch (error) {
      console.error('Failed to save rooms to storage:', error);
    }
  }

  async signInAnonymously(): Promise<string> {
    let userId = localStorage.getItem('sudoku-mock-user-id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sudoku-mock-user-id', userId);
    }
    this.mockUserId = userId;
    return userId;
  }

  getCurrentUserId(): string | null {
    return this.mockUserId;
  }

  async createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame> {
    const game: SoloGame = {
      id: `mock-game-${Date.now()}`,
      userId,
      puzzle: {
        board: Array(9).fill(null).map(() => Array(9).fill(null)),
        solution: Array(9).fill(null).map(() => Array(9).fill(null)),
        difficulty,
        createdAt: Date.now(),
      },
      progress: {
        currentBoard: Array(9).fill(null).map(() => Array(9).fill(null)),
        startedAt: Date.now(),
        elapsedTime: 0,
        mistakes: 0,
      },
      status: 'playing',
    };
    this.mockGames.set(game.id, game);
    return game;
  }

  async saveSoloProgress(gameId: string, progress: GameProgress): Promise<void> {
    const game = this.mockGames.get(gameId);
    if (game) {
      game.progress = progress;
    }
  }

  async getSoloGame(gameId: string): Promise<SoloGame | null> {
    return this.mockGames.get(gameId) || null;
  }

  async createRoom(hostId: string, _difficulty: Difficulty, maxPlayers: number, puzzle: import('./types').SudokuPuzzle): Promise<OnlineRoom> {
    const room: OnlineRoom = {
      id: `room_${Date.now()}`,
      hostId,
      puzzle,
      players: {
        [hostId]: {
          id: hostId,
          uid: hostId,
          nickname: `Player_${hostId.slice(-4)}`,
          progress: 0,
          status: 'active',
          lastSeen: Date.now(),
          currentBoard: Array(9).fill(null).map(() => Array(9).fill(null)),
        },
      },
      status: 'waiting',
      createdAt: Date.now(),
      maxPlayers,
    };
    this.mockRooms.set(room.id, room);
    this.saveRoomsToStorage();
    return room;
  }

  async joinRoom(roomId: string, player: Player): Promise<void> {
    this.loadRoomsFromStorage();
    
    const room = this.mockRooms.get(roomId);
    if (!room) {
      const availableRooms = Array.from(this.mockRooms.keys());
      if (availableRooms.length === 0) {
        throw new Error('생성된 방이 없습니다. 먼저 방을 만들어주세요.');
      } else {
        throw new Error(`방을 찾을 수 없습니다.\n\n찾으려는 Room ID: ${roomId}\n\n사용 가능한 방:\n${availableRooms.join('\n')}`);
      }
    }
    if (Object.keys(room.players).length >= room.maxPlayers) {
      throw new Error('방이 가득 찼습니다.');
    }
    
    room.players[player.id] = {
      ...player,
      status: 'active',
      lastSeen: Date.now(),
      currentBoard: room.puzzle.board,
    };
    this.mockRooms.set(roomId, room);
    this.saveRoomsToStorage();
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    if (room) {
      // 요구사항: host가 나가면 방 삭제
      if (room.hostId === playerId) {
        this.mockRooms.delete(roomId);
        this.saveRoomsToStorage();
        return;
      }
      delete room.players[playerId];
      
      if (Object.keys(room.players).length === 0) {
        this.mockRooms.delete(roomId);
      }
      
      this.saveRoomsToStorage();
    }
  }

  async giveUp(roomId: string, playerId: string): Promise<void> {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    if (!room) return;
    if (room.players[playerId]) {
      room.players[playerId].status = 'disconnected';
    }
    const remaining = Object.values(room.players).filter(
      (p) => p.id !== playerId && p.status !== 'disconnected'
    );
    if (room.status === 'playing' && !room.winnerId && remaining.length === 1) {
      room.winnerId = remaining[0].id;
      room.status = 'completed';
      (room as any).completedAt = Date.now();
    }
    this.saveRoomsToStorage();
  }

  async startGame(roomId: string): Promise<void> {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    if (room) {
      room.status = 'playing';
      room.startedAt = Date.now();
      this.saveRoomsToStorage();
    }
  }

  async updatePlayerProgress(roomId: string, playerId: string, _progress: GameProgress): Promise<void> {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    if (room && room.players[playerId]) {
      const filledCells = _progress.currentBoard.flat().filter(cell => cell !== null).length;
      const progressPercent = Math.floor((filledCells / 81) * 100);
      
      room.players[playerId].progress = progressPercent;
      room.players[playerId].currentBoard = _progress.currentBoard;
      room.players[playerId].lastSeen = Date.now();
      
      if (progressPercent === 100) {
        room.players[playerId].status = 'completed';
        room.players[playerId].completedAt = Date.now();
      }
      
      this.saveRoomsToStorage();
    }
  }

  async heartbeat(roomId: string, playerId: string): Promise<void> {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    if (room && room.players[playerId]) {
      room.players[playerId].lastSeen = Date.now();
      this.saveRoomsToStorage();
    }
  }

  async pruneStalePlayers(roomId: string, cutoffMs: number): Promise<void> {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    if (!room) return;
    const now = Date.now();
    Object.values(room.players).forEach((p) => {
      const effectiveLastSeen = p.lastSeen ?? room.startedAt ?? room.createdAt;
      if (p.status === 'completed') return;
      if (now - effectiveLastSeen > cutoffMs) {
        delete room.players[p.id];
      }
    });
    if (Object.keys(room.players).length === 0) {
      this.mockRooms.delete(roomId);
    }
    this.saveRoomsToStorage();
  }

  async cleanupOldRooms(hostId: string, olderThanMs: number): Promise<number> {
    this.loadRoomsFromStorage();
    const now = Date.now();
    let deleted = 0;
    Array.from(this.mockRooms.entries()).forEach(([id, room]) => {
      if (room.hostId !== hostId) return;
      if (room.status === 'playing') return;
      if (now - room.createdAt > olderThanMs) {
        this.mockRooms.delete(id);
        deleted += 1;
      }
    });
    if (deleted > 0) this.saveRoomsToStorage();
    return deleted;
  }

  async cleanupStaleRooms(olderThanMs: number): Promise<number> {
    this.loadRoomsFromStorage();
    const now = Date.now();
    let deleted = 0;
    Array.from(this.mockRooms.entries()).forEach(([id, room]) => {
      const hasPlayers = room.players && Object.keys(room.players).length > 0;
      if (!hasPlayers) {
        this.mockRooms.delete(id);
        deleted += 1;
        return;
      }
      if (room.status === 'waiting' && now - room.createdAt > olderThanMs) {
        this.mockRooms.delete(id);
        deleted += 1;
      }
    });
    if (deleted > 0) this.saveRoomsToStorage();
    return deleted;
  }

  subscribeToRoom(roomId: string, callback: (room: OnlineRoom | null) => void): () => void {
    this.loadRoomsFromStorage();
    const room = this.mockRooms.get(roomId);
    callback(room || null);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.listenersKey || e.key === this.storageKey) {
        this.loadRoomsFromStorage();
        const updatedRoom = this.mockRooms.get(roomId);
        callback(updatedRoom || null);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

class RestApiBackendService implements IBackendService {
  private userId: string | null = null;

  async signInAnonymously(): Promise<string> {
    throw new Error('REST API not implemented yet');
  }

  getCurrentUserId(): string | null {
    return this.userId;
  }

  // ... 나머지 메서드들도 마찬가지로 구현
  // 지금은 throw Error로 placeholder

  async createSoloGame(_userId: string, _difficulty: Difficulty): Promise<SoloGame> {
    throw new Error('REST API not implemented yet');
  }

  async saveSoloProgress(_gameId: string, _progress: GameProgress): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async getSoloGame(_gameId: string): Promise<SoloGame | null> {
    throw new Error('REST API not implemented yet');
  }

  async createRoom(_hostId: string, _difficulty: Difficulty, _maxPlayers: number, _puzzle: import('./types').SudokuPuzzle): Promise<OnlineRoom> {
    throw new Error('REST API not implemented yet');
  }

  async joinRoom(_roomId: string, _player: Player): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async leaveRoom(_roomId: string, _playerId: string): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async giveUp(_roomId: string, _playerId: string): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async startGame(_roomId: string): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async updatePlayerProgress(_roomId: string, _playerId: string, _progress: GameProgress): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async heartbeat(_roomId: string, _playerId: string): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async pruneStalePlayers(_roomId: string, _cutoffMs: number): Promise<void> {
    throw new Error('REST API not implemented yet');
  }

  async cleanupOldRooms(_hostId: string, _olderThanMs: number): Promise<number> {
    throw new Error('REST API not implemented yet');
  }

  async cleanupStaleRooms(_olderThanMs: number): Promise<number> {
    throw new Error('REST API not implemented yet');
  }

  subscribeToRoom(_roomId: string, _callback: (room: OnlineRoom | null) => void): () => void {
    throw new Error('REST API not implemented yet');
  }
}

function createBackendService(): IBackendService {
  switch (BACKEND_TYPE) {
    case 'firebase':
      return firebaseService;
    case 'mock':
      return new MockBackendService();
    case 'rest-api':
      return new RestApiBackendService();
    default:
      return firebaseService;
  }
}

export const backendService = createBackendService();

