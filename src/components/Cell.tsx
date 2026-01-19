// ============================================
// 스도쿠 셀 컴포넌트
// ============================================

import React from 'react';
import type { CellValue } from '../services/types';

interface CellProps {
  value: CellValue;
  row: number;
  col: number;
  isInitial: boolean;
  isError: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onChange: (row: number, col: number, value: CellValue) => void;
  onSelect: React.Dispatch<React.SetStateAction<[number, number] | null>>;
}

export const Cell: React.FC<CellProps> = ({
  value,
  row,
  col,
  isInitial,
  isError,
  isHighlighted,
  isSelected,
  onChange,
  onSelect,
}) => {
  const handleClick = () => {
    if (!isInitial) {
      onSelect([row, col]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInitial) return;

    if (e.key >= '1' && e.key <= '9') {
      onChange(row, col, parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      onChange(row, col, null);
    }
  };

  const cellClasses = [
    'cell',
    isInitial && 'cell--initial',
    isError && 'cell--error',
    isHighlighted && 'cell--highlighted',
    isSelected && 'cell--selected',
    col % 3 === 2 && col !== 8 && 'cell--right-border',
    row % 3 === 2 && row !== 8 && 'cell--bottom-border',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cellClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInitial ? -1 : 0}
      role="button"
    >
      {value || ''}
    </div>
  );
};

