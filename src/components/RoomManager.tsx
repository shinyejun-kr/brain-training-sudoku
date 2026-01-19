// ============================================
// 온라인 룸 관리 컴포넌트
// ============================================

import React, { useState } from 'react';
import type { OnlineRoom } from '../services/types';

interface RoomManagerProps {
  room: OnlineRoom;
  currentPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const RoomManager: React.FC<RoomManagerProps> = ({
  room,
  currentPlayerId,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === currentPlayerId;
  const players = Object.values(room.players);
  const canStart = players.length >= 2 && isHost && room.status === 'waiting';

  const getPlayerStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '진행 중';
      case 'completed':
        return '완료';
      case 'disconnected':
        return '기권함';
      default:
        return status;
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Room ID를 복사하세요:', room.id);
    }
  };

  return (
    <div className="room-manager">
      <div className="room-header">
        <h2 className="room-title">Online Room</h2>
        <div className="room-id">
          <span className="room-id__label">Room ID:</span>
          <code className="room-id__code">{room.id}</code>
          <button className="btn btn--small" onClick={copyRoomId}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>

      <div className="room-info">
        <div className="info-item">
          <span className="info-item__label">Difficulty:</span>
          <span className="info-item__value">{room.puzzle.difficulty}</span>
        </div>
        <div className="info-item">
          <span className="info-item__label">Players:</span>
          <span className="info-item__value">
            {players.length} / {room.maxPlayers}
          </span>
        </div>
        <div className="info-item">
          <span className="info-item__label">Status:</span>
          <span className="info-item__value">{room.status}</span>
        </div>
      </div>

      <div className="players-list">
        <h3 className="section-title">Players</h3>
        {players.map((player) => (
          <div
            key={player.id}
            className={`player-card ${player.status === 'disconnected' ? 'player-card--disconnected' : ''}`}
          >
            <div className="player-info">
              <span className="player-name">
                {player.nickname}
                {player.id === room.hostId && ' 👑'}
                {player.id === currentPlayerId && ' (You)'}
              </span>
              <span className="player-status">{getPlayerStatusLabel(player.status)}</span>
            </div>
            {room.status === 'playing' && player.status !== 'disconnected' && (
              <div className="player-progress">
                <div className="progress-bar">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${player.progress}%` }}
                  />
                </div>
                <span className="progress-text">{player.progress}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="room-actions">
        {canStart && (
          <button className="btn btn--primary" onClick={onStartGame}>
            🎮 Start Game
          </button>
        )}
        {!canStart && room.status === 'waiting' && (
          <p className="waiting-message">
            {isHost
              ? 'Waiting for at least 2 players...'
              : 'Waiting for host to start...'}
          </p>
        )}
        <button className="btn btn--outline btn--danger" onClick={onLeaveRoom}>
          🚪 Leave Room
        </button>
      </div>

      {room.status === 'completed' && room.winnerId && (
        <div className="winner-announcement">
          <h2 className="winner-title">🎉 Game Complete!</h2>
          <p className="winner-text">
            Winner: {room.players[room.winnerId]?.nickname || 'Unknown'}
          </p>
        </div>
      )}
    </div>
  );
};

