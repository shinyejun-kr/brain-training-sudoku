// ============================================
// 게임 모드 선택 컴포넌트
// ============================================

import React from 'react';
import type { Difficulty } from '../services/types';

interface ModeSelectorProps {
  onStartSolo: (difficulty: Difficulty) => void;
  onStartOnline: (difficulty: Difficulty) => void;
  onJoinRoom: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onStartSolo,
  onStartOnline,
  onJoinRoom,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>('normal');

  return (
    <div className="mode-selector">
      <div className="mode-selector__header">
        <h1 className="title">Brain Training Sudoku</h1>
        <p className="subtitle">Challenge your mind with strategic puzzles</p>
      </div>

      <div className="difficulty-selector">
        <h3 className="section-title">Select Difficulty</h3>
        <div className="difficulty-buttons">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((difficulty) => (
            <button
              key={difficulty}
              className={`btn btn--difficulty ${
                selectedDifficulty === difficulty ? 'btn--active' : ''
              }`}
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mode-buttons">
        <div className="mode-card">
          <div className="mode-card__icon">🧠</div>
          <h3 className="mode-card__title">Solo Play</h3>
          <p className="mode-card__description">
            Practice at your own pace. Progress is saved automatically.
          </p>
          <button
            className="btn btn--primary"
            onClick={() => onStartSolo(selectedDifficulty)}
          >
            Start Solo Game
          </button>
        </div>

        <div className="mode-card">
          <div className="mode-card__icon">🏆</div>
          <h3 className="mode-card__title">Online Battle</h3>
          <p className="mode-card__description">
            Compete with others. First to complete wins!
          </p>
          <div className="mode-card__buttons">
            <button
              className="btn btn--primary"
              onClick={() => onStartOnline(selectedDifficulty)}
            >
              🎮 Create Room
            </button>
            <button
              className="btn btn--outline"
              onClick={onJoinRoom}
            >
              🚪 Join Room
            </button>
          </div>
        </div>
      </div>

      <div className="footer">
        <p className="footer__text">
          Built with ❤️ for brain training enthusiasts
        </p>
      </div>
    </div>
  );
};

