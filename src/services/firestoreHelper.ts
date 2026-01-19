// ============================================
// Firestore 데이터 변환 헬퍼
// ============================================
// Firestore는 중첩 배열을 지원하지 않음
// 2차원 배열 → JSON 문자열로 변환

import type { Board, SoloGame, OnlineRoom, Player } from './types';

function stripUndefined(value: any): any {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
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

function emptyBoard(): Board {
  return Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));
}

// Board를 저장 가능한 형태로 변환
export function serializeBoard(board: Board): string {
  return JSON.stringify(board);
}

// 저장된 Board를 다시 배열로 변환
export function deserializeBoard(input: any): Board {
  if (Array.isArray(input)) return input as Board;
  if (typeof input !== 'string') return emptyBoard();
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? (parsed as Board) : emptyBoard();
  } catch {
    return emptyBoard();
  }
}

// SoloGame을 Firestore에 저장 가능한 형태로 변환
export function serializeSoloGame(game: SoloGame): any {
  return {
    ...game,
    puzzle: {
      ...game.puzzle,
      board: serializeBoard(game.puzzle.board),
      solution: serializeBoard(game.puzzle.solution),
    },
    progress: {
      ...game.progress,
      currentBoard: serializeBoard(game.progress.currentBoard),
    },
  };
}

// Firestore 데이터를 SoloGame으로 변환
export function deserializeSoloGame(data: any): SoloGame {
  const puzzleBoard = deserializeBoard(data?.puzzle?.board);
  const puzzleSolution = data?.puzzle?.solution ? deserializeBoard(data.puzzle.solution) : puzzleBoard;
  return {
    ...data,
    puzzle: {
      ...data.puzzle,
      board: puzzleBoard,
      solution: puzzleSolution,
    },
    progress: {
      ...data.progress,
      currentBoard: deserializeBoard(data?.progress?.currentBoard) || puzzleBoard,
    },
  };
}

// OnlineRoom을 Firestore에 저장 가능한 형태로 변환
export function serializeOnlineRoom(room: OnlineRoom): any {
  const serializedPlayers: any = {};
  
  Object.entries(room.players).forEach(([id, player]) => {
    serializedPlayers[id] = {
      ...stripUndefined(player),
      currentBoard: serializeBoard(player.currentBoard ?? emptyBoard()),
    };
  });

  return {
    ...stripUndefined(room),
    puzzle: {
      ...stripUndefined(room.puzzle),
      board: serializeBoard(room.puzzle.board),
      solution: serializeBoard(room.puzzle.solution),
    },
    players: serializedPlayers,
  };
}

// Firestore 데이터를 OnlineRoom으로 변환
export function deserializeOnlineRoom(data: any): OnlineRoom {
  const deserializedPlayers: Record<string, Player> = {};
  const puzzleBoard = deserializeBoard(data?.puzzle?.board);
  
  if (data.players) {
    Object.entries(data.players).forEach(([id, player]: [string, any]) => {
      deserializedPlayers[id] = {
        ...player,
        currentBoard: player?.currentBoard ? deserializeBoard(player.currentBoard) : puzzleBoard,
      };
    });
  }

  return {
    ...data,
    puzzle: {
      ...data.puzzle,
      board: puzzleBoard,
      solution: data?.puzzle?.solution ? deserializeBoard(data.puzzle.solution) : puzzleBoard,
    },
    players: deserializedPlayers,
  };
}

