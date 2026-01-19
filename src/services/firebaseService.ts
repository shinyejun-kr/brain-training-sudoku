// ============================================
// Firebase 실제 구현
// ============================================

import {
  signInAnonymously as firebaseSignInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  increment,
  runTransaction,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebase.config';
import type {
  IBackendService,
  SoloGame,
  OnlineRoom,
  Player,
  GameProgress,
  Difficulty,
} from './types';
import {
  serializeSoloGame,
  deserializeSoloGame,
  serializeBoard,
  deserializeBoard,
} from './firestoreHelper';

function stripUndefined(value: any): any {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      const cleaned = stripUndefined(v);
      if (cleaned !== undefined) out[k] = cleaned;
    });
    return out;
  }
  return value;
}

class FirebaseService implements IBackendService {
  private auth = getFirebaseAuth();
  private db = getFirebaseDb();
  private currentUser: User | null = null;

  constructor() {
    // 인증 상태 구독
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  // ============================================
  // User Authentication
  // ============================================

  async signInAnonymously(): Promise<string> {
    const userCredential = await firebaseSignInAnonymously(this.auth);
    return userCredential.user.uid;
  }

  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // ============================================
  // Solo Game
  // ============================================

  async createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame> {
    // 퍼즐은 클라이언트에서 생성 (sudokuGenerator 사용)
    // 여기서는 임시로 빈 퍼즐 반환 (실제 구현은 호출 측에서 처리)
    const gameId = `solo_${userId}_${Date.now()}`;
    
    const game: SoloGame = {
      id: gameId,
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

    // Firestore에 저장 (중첩 배열 변환)
    await setDoc(doc(this.db, 'games', gameId), {
      ...serializeSoloGame(game),
      createdAt: serverTimestamp(),
    });

    return game;
  }

  async saveSoloProgress(gameId: string, progress: GameProgress): Promise<void> {
    const gameRef = doc(this.db, 'games', gameId);
    await updateDoc(gameRef, {
      progress: {
        ...progress,
        currentBoard: serializeBoard(progress.currentBoard),
      },
      updatedAt: serverTimestamp(),
    });
  }

  async getSoloGame(gameId: string): Promise<SoloGame | null> {
    const gameRef = doc(this.db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      return null;
    }

    return deserializeSoloGame(gameSnap.data());
  }

  // ============================================
  // Online Room
  // ============================================

  async createRoom(
    hostId: string,
    _difficulty: Difficulty,
    maxPlayers: number = 4,
    puzzle: import('./types').SudokuPuzzle
  ): Promise<OnlineRoom> {
    const roomId = `room_${Date.now()}`;

    const room: OnlineRoom = {
      id: roomId,
      hostId,
      puzzle,
      players: {},
      status: 'waiting',
      createdAt: Date.now(),
      maxPlayers,
    };

    // Firestore 저장: rooms/{roomId}에는 meta + puzzle만 저장 (players는 subcollection로 분리)
    await setDoc(doc(this.db, 'rooms', roomId), stripUndefined({
      id: room.id,
      hostId: room.hostId,
      status: room.status,
      createdAt: room.createdAt,
      maxPlayers: room.maxPlayers,
      winnerId: room.winnerId ?? null,
      startedAt: room.startedAt ?? null,
      completedAt: null,
      expiresAt: null,
      closedAt: null,
      closedReason: null,
      playerCount: 0,
      puzzle: {
        ...stripUndefined(room.puzzle),
        board: serializeBoard(room.puzzle.board),
        solution: serializeBoard(room.puzzle.solution),
      },
    }));
    return room;
  }

  private async deleteRoomWithPlayers(roomId: string): Promise<void> {
    const roomRef = doc(this.db, 'rooms', roomId);
    const playersRef = collection(this.db, 'rooms', roomId, 'players');
    const playersSnap = await getDocs(playersRef);
    for (const d of playersSnap.docs) {
      await deleteDoc(d.ref);
    }
    await deleteDoc(roomRef);
  }

  async joinRoom(roomId: string, player: Player): Promise<void> {
    const roomRef = doc(this.db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('방을 찾을 수 없습니다.');
    }

    const playerRef = doc(this.db, 'rooms', roomId, 'players', player.id);
    const existing = await getDoc(playerRef);
    if (!existing.exists()) {
      await setDoc(playerRef, stripUndefined({
        id: player.id,
        uid: player.uid,
        nickname: player.nickname,
        externalUserId: player.externalUserId ?? null,
        progress: 0,
        status: 'active',
        lastSeen: Date.now(),
        joinedAt: Date.now(),
        completedAt: null,
      }));
      await updateDoc(roomRef, { playerCount: increment(1) });
    } else {
      await updateDoc(playerRef, stripUndefined({
        nickname: player.nickname,
        externalUserId: player.externalUserId ?? null,
        status: 'active',
        lastSeen: Date.now(),
      }));
    }
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const roomRef = doc(this.db, 'rooms', roomId);

    const roomSnapBefore = await getDoc(roomRef);
    if (!roomSnapBefore.exists()) return;

    const playerRef = doc(this.db, 'rooms', roomId, 'players', playerId);
    const playerSnap = await getDoc(playerRef);
    if (playerSnap.exists()) {
      await deleteDoc(playerRef);
      await updateDoc(roomRef, { playerCount: increment(-1) });
    }

    const after = await getDoc(roomRef);
    if (!after.exists()) return;
    const data = after.data() as any;
    const status = data?.status as string | undefined;
    const winnerId = data?.winnerId as string | null | undefined;
    const wasHost = data?.hostId === playerId;

    const playersRef = collection(this.db, 'rooms', roomId, 'players');
    const remainingSnap = await getDocs(query(playersRef, orderBy('joinedAt', 'asc'), limit(2)));

    if (remainingSnap.empty) {
      await this.deleteRoomWithPlayers(roomId);
      return;
    }

    const remainingIds = remainingSnap.docs.map((d) => d.id);
    const onlyOneLeft = remainingIds.length === 1;
    const remainingActiveCount = remainingSnap.docs.filter((d) => {
      const p = d.data() as any;
      return p?.status !== 'disconnected';
    }).length;

    // 호스트가 나가면 남은 플레이어에게 host 승계
    if (wasHost) {
      const newHostId = remainingIds[0];
      await updateDoc(roomRef, { hostId: newHostId });
    }

    // 게임이 끝났거나(완료/타임아웃 등) 남은 사람이 모두 disconnected면 방 정리
    if ((status === 'completed' || status === 'abandoned') && remainingActiveCount === 0) {
      await this.deleteRoomWithPlayers(roomId);
      return;
    }

    // 게임 중 누군가 나가서 1명만 남으면 남은 사람이 승리 처리
    if (status === 'playing' && !winnerId && onlyOneLeft) {
      const winner = remainingIds[0];
      await updateDoc(roomRef, { winnerId: winner, status: 'completed', completedAt: Date.now() });
    }
  }

  async giveUp(roomId: string, playerId: string): Promise<void> {
    const roomRef = doc(this.db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as any;

    const playerRef = doc(this.db, 'rooms', roomId, 'players', playerId);
    const playerSnap = await getDoc(playerRef);
    if (playerSnap.exists()) {
      await updateDoc(playerRef, {
        status: 'disconnected',
        lastSeen: Date.now(),
      });
    }

    const status = roomData?.status as string | undefined;
    const winnerId = roomData?.winnerId as string | null | undefined;
    if (status !== 'playing' || winnerId) return;

    // 2인 대결 기준: 기권한 사람 제외, 남아있는 첫 플레이어를 승자로 확정
    const playersRef = collection(this.db, 'rooms', roomId, 'players');
    const playersSnap = await getDocs(playersRef);
    const remaining = playersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((p) => p.id !== playerId && p.status !== 'disconnected');

    if (remaining.length === 1) {
      await updateDoc(roomRef, { winnerId: remaining[0].id, status: 'completed', completedAt: Date.now() });
    }
  }

  async startGame(roomId: string): Promise<void> {
    const roomRef = doc(this.db, 'rooms', roomId);
    const startedAt = Date.now();
    await updateDoc(roomRef, {
      status: 'playing',
      startedAt,
      expiresAt: startedAt + 40 * 60 * 1000,
      closedAt: null,
      closedReason: null,
    });
  }

  async updatePlayerProgress(
    roomId: string,
    playerId: string,
    progress: GameProgress
  ): Promise<void> {
    // 진행률 계산 (채워진 셀 / 전체 빈 셀)
    const filledCells = progress.currentBoard
      .flat()
      .filter((cell) => cell !== null).length;
    const progressPercent = Math.floor((filledCells / 81) * 100);

    const playerRef = doc(this.db, 'rooms', roomId, 'players', playerId);
    await updateDoc(playerRef, {
      progress: progressPercent,
      status: progressPercent === 100 ? 'completed' : 'active',
      lastSeen: Date.now(),
      ...(progressPercent === 100 && { completedAt: Date.now() }),
    });

    // first to complete wins: winnerId가 없으면 최초 완료자를 winner로 기록
    if (progressPercent === 100) {
      const roomRef = doc(this.db, 'rooms', roomId);
      await runTransaction(this.db, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) return;
        const data = snap.data() as any;
        if (data?.winnerId) return;
        tx.update(roomRef, { winnerId: playerId, status: 'completed', completedAt: Date.now() });
      });
    }
  }

  async heartbeat(roomId: string, playerId: string): Promise<void> {
    const playerRef = doc(this.db, 'rooms', roomId, 'players', playerId);
    await updateDoc(playerRef, {
      lastSeen: Date.now(),
    });
  }

  async pruneStalePlayers(roomId: string, cutoffMs: number): Promise<void> {
    const roomRef = doc(this.db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as any;
    const now = Date.now();
    const status = roomData?.status as string | undefined;
    const createdAt = typeof roomData?.createdAt === 'number' ? roomData.createdAt : now;
    const completedAt = typeof roomData?.completedAt === 'number' ? roomData.completedAt : null;
    const expiresAt = typeof roomData?.expiresAt === 'number' ? roomData.expiresAt : null;
    const closedAt = typeof roomData?.closedAt === 'number' ? roomData.closedAt : null;
    const closedReason = roomData?.closedReason as string | null | undefined;

    // completed 방은 15분 뒤 자동 삭제
    if (status === 'completed' && completedAt && now - completedAt > 15 * 60 * 1000) {
      await this.deleteRoomWithPlayers(roomId);
      return;
    }

    // playing 방은 40분 제한: 먼저 abandoned(timeout)으로 공지하고, 60초 후 삭제
    if (status === 'playing' && expiresAt && now > expiresAt) {
      await updateDoc(roomRef, {
        status: 'abandoned',
        closedReason: 'timeout',
        closedAt: now,
      });
      return;
    }
    if (status === 'abandoned' && closedReason === 'timeout' && closedAt && now - closedAt > 60 * 1000) {
      await this.deleteRoomWithPlayers(roomId);
      return;
    }

    // waiting 방 5분 TTL
    if (status === 'waiting' && now - createdAt > 5 * 60 * 1000) {
      await this.deleteRoomWithPlayers(roomId);
      return;
    }

    const playersRef = collection(this.db, 'rooms', roomId, 'players');
    const playersSnap = await getDocs(playersRef);

    // players=0 즉시 삭제
    if (playersSnap.empty) {
      await deleteDoc(roomRef);
      return;
    }

    // hostless 15분 삭제(playing 제외): host player doc의 lastSeen 기준
    const hostId = roomData?.hostId as string | undefined;
    if (hostId && status !== 'playing') {
      const hostDoc = playersSnap.docs.find((d) => d.id === hostId);
      const hostLastSeen = typeof hostDoc?.data()?.lastSeen === 'number'
        ? hostDoc!.data().lastSeen
        : createdAt;
      if (now - hostLastSeen > 15 * 60 * 1000) {
        await this.deleteRoomWithPlayers(roomId);
        return;
      }
    }

    let deletedPlayers = 0;
    for (const d of playersSnap.docs) {
      const p = d.data() as any;
      if (p?.status === 'completed') continue;
      const lastSeen = typeof p?.lastSeen === 'number' ? p.lastSeen : createdAt;
      if (now - lastSeen > cutoffMs) {
        await deleteDoc(d.ref);
        deletedPlayers += 1;
      }
    }

    if (deletedPlayers > 0) {
      await updateDoc(roomRef, { playerCount: increment(-deletedPlayers) });
    }

    const afterPlayers = await getDocs(query(playersRef, limit(1)));
    if (afterPlayers.empty) {
      await deleteDoc(roomRef);
    }
  }

  async cleanupOldRooms(hostId: string, olderThanMs: number): Promise<number> {
    // NOTE:
    // - 복합 인덱스 요구를 피하기 위해 hostId만 조회한 후, createdAt 조건은 클라이언트에서 필터링합니다.
    // - hostId 기준 정리이므로, "다른 origin(로컬/베르셀)에서 생성된 익명 uid" 방은 대상이 아닐 수 있습니다.
    const cutoff = Date.now() - olderThanMs;
    const roomsRef = collection(this.db, 'rooms');
    const q = query(roomsRef, where('hostId', '==', hostId));

    const snap = await getDocs(q);
    let deleted = 0;

    for (const d of snap.docs) {
      const data = d.data() as any;
      const createdAt = typeof data?.createdAt === 'number' ? data.createdAt : null;
      if (!createdAt) continue;
      if (createdAt >= cutoff) continue;
      if (data?.status === 'playing') continue;
      await deleteDoc(d.ref);
      deleted += 1;
    }

    return deleted;
  }

  async cleanupStaleRooms(olderThanMs: number): Promise<number> {
    // NOTE: 서버(Cloud Functions) 없이 클라이언트가 수행하는 best-effort 청소.
    // - 인덱스 없이 동작하도록 where/orderBy 조합을 피합니다.
    // - 최대 100개만 훑어서 정리합니다(테스트/소규모 운영 가정).
    const now = Date.now();
    const roomsRef = collection(this.db, 'rooms');
    const snap = await getDocs(query(roomsRef, limit(100)));
    let deleted = 0;

    for (const d of snap.docs) {
      const data = d.data() as any;
      const status = data?.status as string | undefined;
      const createdAt = typeof data?.createdAt === 'number' ? data.createdAt : null;
      const playerCount = typeof data?.playerCount === 'number' ? data.playerCount : null;
      const completedAt = typeof data?.completedAt === 'number' ? data.completedAt : null;
      const expiresAt = typeof data?.expiresAt === 'number' ? data.expiresAt : null;
      const closedAt = typeof data?.closedAt === 'number' ? data.closedAt : null;
      const closedReason = data?.closedReason as string | null | undefined;

      if (playerCount !== null && playerCount <= 0) {
        await this.deleteRoomWithPlayers(d.id);
        deleted += 1;
        continue;
      }

      if (status === 'playing') continue;
      if (status === 'abandoned' && closedReason === 'timeout' && closedAt && now - closedAt > 60 * 1000) {
        await this.deleteRoomWithPlayers(d.id);
        deleted += 1;
        continue;
      }
      if (status === 'completed' && completedAt && now - completedAt > 15 * 60 * 1000) {
        await this.deleteRoomWithPlayers(d.id);
        deleted += 1;
        continue;
      }
      if (createdAt && status === 'waiting' && now - createdAt > olderThanMs) {
        await this.deleteRoomWithPlayers(d.id);
        deleted += 1;
      }
      if (expiresAt && status === 'playing' && now > expiresAt) {
        await updateDoc(d.ref, { status: 'abandoned', closedReason: 'timeout', closedAt: now });
      }
    }

    return deleted;
  }

  subscribeToRoom(
    roomId: string,
    callback: (room: OnlineRoom | null) => void
  ): () => void {
    const roomRef = doc(this.db, 'rooms', roomId);
    const playersRef = collection(this.db, 'rooms', roomId, 'players');

    let latestRoom: any | null = null;
    let latestPlayers: Record<string, Player> = {};
    let playersUnsub: (() => void) | null = null;

    const emit = () => {
      if (!latestRoom) return;
      const puzzleBoard = deserializeBoard(latestRoom?.puzzle?.board);
      const puzzleSolution = latestRoom?.puzzle?.solution
        ? deserializeBoard(latestRoom.puzzle.solution)
        : puzzleBoard;

      callback({
        id: latestRoom.id,
        hostId: latestRoom.hostId,
        status: latestRoom.status,
        createdAt: latestRoom.createdAt,
        startedAt: latestRoom.startedAt || undefined,
        completedAt: typeof latestRoom.completedAt === 'number' ? latestRoom.completedAt : undefined,
        expiresAt: typeof latestRoom.expiresAt === 'number' ? latestRoom.expiresAt : undefined,
        closedAt: typeof latestRoom.closedAt === 'number' ? latestRoom.closedAt : undefined,
        closedReason: typeof latestRoom.closedReason === 'string' ? latestRoom.closedReason : undefined,
        winnerId: latestRoom.winnerId || undefined,
        maxPlayers: latestRoom.maxPlayers,
        puzzle: {
          ...latestRoom.puzzle,
          board: puzzleBoard,
          solution: puzzleSolution,
        },
        players: latestPlayers,
      } as OnlineRoom);
    };

    const roomUnsub = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) {
        latestRoom = null;
        latestPlayers = {};
        playersUnsub?.();
        playersUnsub = null;
        callback(null);
        return;
      }
      latestRoom = snap.data();
      if (!playersUnsub) {
        playersUnsub = onSnapshot(playersRef, (psnap) => {
          const next: Record<string, Player> = {};
          psnap.docs.forEach((d) => {
            const p = d.data() as any;
            next[d.id] = {
              id: d.id,
              uid: p.uid || d.id,
              nickname: p.nickname || `Player_${d.id.slice(-4)}`,
              externalUserId: p.externalUserId || undefined,
              progress: typeof p.progress === 'number' ? p.progress : 0,
              status: p.status || 'active',
              lastSeen: typeof p.lastSeen === 'number' ? p.lastSeen : undefined,
              joinedAt: typeof p.joinedAt === 'number' ? p.joinedAt : undefined,
              completedAt: typeof p.completedAt === 'number' ? p.completedAt : undefined,
            };
          });
          latestPlayers = next;
          emit();
        });
      }
      emit();
    });

    return () => {
      roomUnsub();
      playersUnsub?.();
    };
  }
}

// Singleton 인스턴스
export const firebaseService = new FirebaseService();

