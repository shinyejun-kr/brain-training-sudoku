// ============================================
// 스도쿠 솔버 (Backtracking 알고리즘)
// ============================================

import type { Board } from '../services/types';
import { isValidPlacement, copyBoard } from './sudokuValidator';

/**
 * 빈 셀 찾기
 */
function findEmptyCell(board: Board): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null || board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * 스도쿠 풀기 (백트래킹)
 */
export function solveSudoku(board: Board): boolean {
  const emptyCell = findEmptyCell(board);

  // 빈 셀이 없으면 완성
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;

  // 1부터 9까지 시도
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;

      if (solveSudoku(board)) {
        return true;
      }

      // 백트래킹
      board[row][col] = null;
    }
  }

  return false;
}

/**
 * 스도쿠 해결 (원본 보드 보존)
 */
export function getSolution(board: Board): Board {
  const boardCopy = copyBoard(board);
  solveSudoku(boardCopy);
  return boardCopy;
}

/**
 * 보드에 유일한 해가 있는지 확인
 */
export function hasUniqueSolution(board: Board): boolean {
  const boardCopy = copyBoard(board);
  let solutionCount = 0;

  function countSolutions(currentBoard: Board): void {
    if (solutionCount > 1) return; // 이미 2개 이상 발견

    const emptyCell = findEmptyCell(currentBoard);

    if (!emptyCell) {
      solutionCount++;
      return;
    }

    const [row, col] = emptyCell;

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(currentBoard, row, col, num)) {
        currentBoard[row][col] = num;
        countSolutions(currentBoard);
        currentBoard[row][col] = null;

        if (solutionCount > 1) return;
      }
    }
  }

  countSolutions(boardCopy);
  return solutionCount === 1;
}

