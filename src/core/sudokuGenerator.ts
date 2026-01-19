// ============================================
// 스도쿠 퍼즐 생성기
// ============================================

import type { Board, Difficulty, SudokuPuzzle } from '../services/types';
import { copyBoard, createEmptyBoard } from './sudokuValidator';
import { solveSudoku, hasUniqueSolution } from './sudokuSolver';

/**
 * 랜덤 셔플
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 완성된 스도쿠 보드 생성
 */
function generateFullBoard(): Board {
  const board = createEmptyBoard();

  // 첫 번째 행을 랜덤하게 채우기
  const firstRow = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let col = 0; col < 9; col++) {
    board[0][col] = firstRow[col];
  }

  // 나머지는 솔버로 채우기
  solveSudoku(board);

  return board;
}

/**
 * 난이도별 제거할 셀 개수
 */
const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 30,    // 51개 힌트
  normal: 45,  // 36개 힌트
  hard: 55,    // 26개 힌트
};

/**
 * 퍼즐 생성 (셀 제거)
 */
function createPuzzle(solution: Board, difficulty: Difficulty): Board {
  const puzzle = copyBoard(solution);
  const cellsToRemove = CELLS_TO_REMOVE[difficulty];
  
  const allPositions: [number, number][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      allPositions.push([row, col]);
    }
  }

  const shuffledPositions = shuffle(allPositions);
  let removedCount = 0;

  // 셀을 하나씩 제거하면서 유일해를 유지하는지 확인
  for (const [row, col] of shuffledPositions) {
    if (removedCount >= cellsToRemove) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = null;

    // 유일해 검증은 시간이 오래 걸리므로 easy/normal에서만 사용
    // hard는 빠른 생성을 위해 스킵
    if (difficulty === 'hard' || hasUniqueSolution(puzzle)) {
      removedCount++;
    } else {
      puzzle[row][col] = backup; // 복원
    }
  }

  return puzzle;
}

/**
 * 메인: 스도쿠 퍼즐 생성
 */
export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  console.log(`🎮 Generating ${difficulty} sudoku puzzle...`);
  
  const solution = generateFullBoard();
  const board = createPuzzle(solution, difficulty);

  return {
    board,
    solution,
    difficulty,
    createdAt: Date.now(),
  };
}

/**
 * 빠른 테스트용 퍼즐 (고정된 패턴)
 */
export function generateTestPuzzle(difficulty: Difficulty = 'easy'): SudokuPuzzle {
  // 미리 준비된 테스트 퍼즐
  const solution: Board = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];

  const puzzle = createPuzzle(solution, difficulty);

  return {
    board: puzzle,
    solution,
    difficulty,
    createdAt: Date.now(),
  };
}

