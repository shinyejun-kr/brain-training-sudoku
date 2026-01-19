// ============================================
// 스도쿠 검증 로직
// ============================================

import type { Board, ValidationError } from '../services/types';

/**
 * 특정 위치에 숫자를 놓을 수 있는지 검증
 */
export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  num: number
): boolean {
  // 행 검증
  for (let x = 0; x < 9; x++) {
    if (x !== col && board[row][x] === num) {
      return false;
    }
  }

  // 열 검증
  for (let x = 0; x < 9; x++) {
    if (x !== row && board[x][col] === num) {
      return false;
    }
  }

  // 3x3 박스 검증
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentRow = boxRow + i;
      const currentCol = boxCol + j;
      
      if (
        (currentRow !== row || currentCol !== col) &&
        board[currentRow][currentCol] === num
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 보드 전체 검증
 */
export function validateBoard(board: Board): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      
      if (value !== null && value !== 0) {
        if (!isValidPlacement(board, row, col, value)) {
          errors.push({
            row,
            col,
            type: 'duplicate',
            message: `Number ${value} is duplicated`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * 보드가 완성되었는지 확인
 */
export function isBoardComplete(board: Board): boolean {
  // 모든 셀이 채워졌는지
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null || board[row][col] === 0) {
        return false;
      }
    }
  }

  // 규칙 위반이 없는지
  return validateBoard(board).length === 0;
}

/**
 * 두 보드가 동일한지 비교
 */
export function areBoardsEqual(board1: Board, board2: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board1[row][col] !== board2[row][col]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 보드 복사 (deep copy)
 */
export function copyBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/**
 * 빈 보드 생성
 */
export function createEmptyBoard(): Board {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}

