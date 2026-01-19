// ============================================
// 스도쿠 게임 상태 관리 Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { Board, CellValue, Difficulty, SudokuPuzzle } from '../services/types';
import { generateSudoku } from '../core/sudokuGenerator';
import { isBoardComplete, copyBoard } from '../core/sudokuValidator';

interface UseSudokuGameProps {
  difficulty: Difficulty;
  puzzle?: SudokuPuzzle;
}

export function useSudokuGame({ difficulty, puzzle: initialPuzzle }: UseSudokuGameProps) {
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
  const [currentBoard, setCurrentBoard] = useState<Board>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  // 퍼즐 초기화
  useEffect(() => {
    if (initialPuzzle) {
      setPuzzle(initialPuzzle);
      setCurrentBoard(copyBoard(initialPuzzle.board));
    } else {
      const newPuzzle = generateSudoku(difficulty);
      setPuzzle(newPuzzle);
      setCurrentBoard(copyBoard(newPuzzle.board));
    }
    setStartTime(Date.now());
    setIsComplete(false);
    setMistakes(0);
  }, [difficulty, initialPuzzle]);

  // 셀 값 변경
  const handleCellChange = useCallback((row: number, col: number, value: CellValue) => {
    if (!puzzle) return;

    setCurrentBoard((prev) => {
      const newBoard = copyBoard(prev);
      newBoard[row][col] = value;

      // 완료 체크
      if (isBoardComplete(newBoard)) {
        setIsComplete(true);
      }

      return newBoard;
    });
  }, [puzzle]);

  // 재시작
  const restart = useCallback(() => {
    if (puzzle) {
      setCurrentBoard(copyBoard(puzzle.board));
      setStartTime(Date.now());
      setIsComplete(false);
      setMistakes(0);
    }
  }, [puzzle]);

  // 새 게임
  const newGame = useCallback(() => {
    const newPuzzle = generateSudoku(difficulty);
    setPuzzle(newPuzzle);
    setCurrentBoard(copyBoard(newPuzzle.board));
    setStartTime(Date.now());
    setIsComplete(false);
    setMistakes(0);
  }, [difficulty]);

  return {
    puzzle,
    currentBoard,
    startTime,
    isComplete,
    mistakes,
    handleCellChange,
    restart,
    newGame,
  };
}

