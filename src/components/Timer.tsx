// ============================================
// 타이머 컴포넌트
// ============================================

import React, { useEffect, useState } from 'react';

interface TimerProps {
  startTime: number;
  isRunning: boolean;
}

export const Timer: React.FC<TimerProps> = ({ startTime, isRunning }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <span className="timer__icon">⏱</span>
      <span className="timer__time">{formatTime(elapsedTime)}</span>
    </div>
  );
};

