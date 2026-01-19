// ============================================
// 스도쿠 보드 컴포넌트
// ============================================

import React, { useState, useEffect } from 'react';
import { Cell } from './Cell';
import { Timer } from './Timer';
import type { Board, CellValue, CellState } from '../services/types';
import { validateBoard } from '../core/sudokuValidator';

interface SudokuBoardProps {
  initialBoard: Board;
  currentBoard: Board;
  solutionBoard?: Board;
  allowSolution?: boolean;
  startTime: number;
  isRunning: boolean;
  onCellChange: (row: number, col: number, value: CellValue) => void;
  onRestart: () => void;
  onGiveUp?: () => void;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({
  initialBoard,
  currentBoard,
  solutionBoard,
  allowSolution = true,
  startTime,
  isRunning,
  onCellChange,
  onRestart,
  onGiveUp,
}) => {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (!allowSolution && showSolution) {
      setShowSolution(false);
    }
  }, [allowSolution, showSolution]);

  // 에러 검증
  const errors = validateBoard(currentBoard);
  const errorSet = new Set(errors.map(e => `${e.row}-${e.col}`));
  const displayedBoard = showSolution && solutionBoard ? solutionBoard : currentBoard;

  // 셀 상태 계산
  const getCellState = (row: number, col: number): CellState => {
    const value = displayedBoard[row][col];
    const isInitial = initialBoard[row][col] !== null;
    const isError = errorSet.has(`${row}-${col}`);
    const isHighlighted =
      selectedCell !== null &&
      (selectedCell[0] === row ||
        selectedCell[1] === col ||
        (Math.floor(selectedCell[0] / 3) === Math.floor(row / 3) &&
          Math.floor(selectedCell[1] / 3) === Math.floor(col / 3)));

    return {
      value,
      isInitial,
      isError,
      isHighlighted,
    };
  };

  // 숫자 패드 클릭 핸들러
  const handleNumberPadClick = (num: number) => {
    if (showSolution) return;
    if (selectedCell) {
      const [row, col] = selectedCell;
      if (initialBoard[row][col] === null) {
        onCellChange(row, col, num);
      }
    }
  };

  const handleClear = () => {
    if (showSolution) return;
    if (selectedCell) {
      const [row, col] = selectedCell;
      if (initialBoard[row][col] === null) {
        onCellChange(row, col, null);
      }
    }
  };

  return (
    <div className="sudoku-container">
      <div className="sudoku-header">
        <Timer startTime={startTime} isRunning={isRunning} />
        <div className="sudoku-actions">
          <button className="btn btn--outline" onClick={onRestart}>
            🔄 Restart
          </button>
          {solutionBoard && allowSolution && (
            <button
              className="btn btn--outline"
              onClick={() => setShowSolution((v) => !v)}
            >
              {showSolution ? '🙈 답 숨기기' : '👁️ 답 보기'}
            </button>
          )}
          {onGiveUp && (
            <button className="btn btn--outline btn--danger" onClick={onGiveUp}>
              🏳️ Give Up
            </button>
          )}
        </div>
      </div>

      <div className="sudoku-board">
        {Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => {
            const cellState = getCellState(row, col);
            return (
              <Cell
                key={`${row}-${col}`}
                row={row}
                col={col}
                value={cellState.value}
                isInitial={cellState.isInitial}
                isError={cellState.isError}
                isHighlighted={cellState.isHighlighted}
                isSelected={
                  selectedCell !== null &&
                  selectedCell[0] === row &&
                  selectedCell[1] === col
                }
                onChange={onCellChange}
                onSelect={setSelectedCell}
              />
            );
          })
        )}
      </div>

      <div className="number-pad">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            className="number-pad__btn"
            onClick={() => handleNumberPadClick(num)}
          >
            {num}
          </button>
        ))}
        <button className="number-pad__btn number-pad__btn--clear" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
};

