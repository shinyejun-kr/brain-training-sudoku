import { useState, useEffect, useCallback, useRef } from 'react';
import type { OnlineRoom, Player, Difficulty, GameProgress } from '../services/types';
import { backendService } from '../services/backendService';
import { generateSudoku } from '../core/sudokuGenerator';

export function useOnlineRoom(roomId: string | null, userId: string) {
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const progressDebounceRef = useRef<number | null>(null);
  const pendingProgressRef = useRef<GameProgress | null>(null);
  const lastSentPercentRef = useRef<number>(-1);

  // 룸 생성
  const createRoom = useCallback(async (difficulty: Difficulty, maxPlayers: number = 4, nickname?: string, externalUserId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 퍼즐 생성
      const puzzle = generateSudoku(difficulty);
      
      // 룸 생성 (퍼즐 포함)
      const newRoom = await backendService.createRoom(userId, difficulty, maxPlayers, puzzle);
      
      // 호스트를 첫 번째 플레이어로 추가
      const hostPlayer: Player = {
        id: userId,
        uid: userId,
        nickname: nickname || `Player_${userId.slice(-4)}`,
        externalUserId,
        progress: 0,
        status: 'active',
        lastSeen: Date.now(),
        currentBoard: puzzle.board,
      };

      await backendService.joinRoom(newRoom.id, hostPlayer);
      
      setRoom(newRoom);
      return newRoom;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 룸 참가
  const joinRoom = useCallback(async (targetRoomId: string, nickname: string, externalUserId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const player: Player = {
        id: userId,
        uid: userId,
        nickname,
        externalUserId,
        progress: 0,
        status: 'active',
        lastSeen: Date.now(),
        currentBoard: [],
      };

      await backendService.joinRoom(targetRoomId, player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 룸 나가기
  const leaveRoom = useCallback(async () => {
    if (!roomId) return;

    try {
      await backendService.leaveRoom(roomId, userId);
      setRoom(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  }, [roomId, userId, hasGivenUp]);

  // 기권(방에는 남되 승패 판정만)
  const giveUp = useCallback(async () => {
    if (!roomId) return;
    try {
      await backendService.giveUp(roomId, userId);
      setHasGivenUp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to give up');
    }
  }, [roomId, userId, hasGivenUp]);

  // 진행률 업데이트
  const updateProgress = useCallback(async (progress: GameProgress) => {
    if (!roomId) return;
    if (hasGivenUp) return;

    try {
      pendingProgressRef.current = progress;
      if (progressDebounceRef.current) {
        window.clearTimeout(progressDebounceRef.current);
      }
      progressDebounceRef.current = window.setTimeout(async () => {
        const latest = pendingProgressRef.current;
        if (!latest) return;
        try {
          const filledCells = latest.currentBoard.flat().filter((c) => c !== null).length;
          const percent = Math.floor((filledCells / 81) * 100);
          if (percent !== 100 && percent === lastSentPercentRef.current) return;
          lastSentPercentRef.current = percent;
          await backendService.updatePlayerProgress(roomId, userId, latest);
        } catch (err) {
          console.error('Failed to update progress:', err);
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, [roomId, userId]);

  // 룸 구독 (실시간 업데이트)
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = backendService.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      if (!updatedRoom) {
        setError('방이 종료되었습니다.');
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Heartbeat + best-effort leave on unload
  useEffect(() => {
    if (!roomId || !userId) return;
    if (hasGivenUp) return;

    const interval = window.setInterval(() => {
      backendService.heartbeat(roomId, userId).catch(() => {});
    }, 45000);

    const handleUnload = () => {
      backendService.leaveRoom(roomId, userId).catch(() => {});
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [roomId, userId]);

  useEffect(() => {
    setHasGivenUp(false);
    lastSentPercentRef.current = -1;
  }, [roomId]);

  // Stale players cleanup (hostless/ghost 방 정리 포함)
  useEffect(() => {
    if (!roomId || !room) return;
    if (room.hostId !== userId) return;

    const interval = window.setInterval(() => {
      backendService.pruneStalePlayers(roomId, 90_000).catch(() => {});
      backendService.cleanupStaleRooms(5 * 60 * 1000).catch(() => {});
    }, 120000);

    return () => window.clearInterval(interval);
  }, [roomId, room, userId]);

  return {
    room,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    giveUp,
    updateProgress,
  };
}

