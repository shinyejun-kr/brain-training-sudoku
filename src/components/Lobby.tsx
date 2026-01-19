// ============================================
// 대기실(Lobby) 컴포넌트
// ============================================

import React from 'react';
import type { OnlineRoom } from '../services/types';

interface LobbyProps {
  room: OnlineRoom;
  currentUserId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  room,
  currentUserId,
  onStartGame,
  onLeaveRoom,
}) => {
  const isHost = room.hostId === currentUserId;
  const players = Object.values(room.players);
  const canStart = players.length >= 2 && isHost && room.status === 'waiting';

  const [copied, setCopied] = React.useState(false);

  const getPlayerStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '✅ 준비됨';
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
      // HTTP/권한 환경에서는 clipboard가 막힐 수 있음 → fallback
      window.prompt('Room ID를 복사하세요:', room.id);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby__header">
        <h1 className="lobby__title">🏠 대기실</h1>
        <p className="lobby__subtitle">
          {isHost ? '플레이어를 기다리는 중...' : '호스트가 게임을 시작하길 기다리는 중...'}
        </p>
      </div>

      {/* Room Info Card */}
      <div className="lobby__info-card">
        <div className="info-row">
          <span className="info-label">Room ID:</span>
          <div className="info-value-group">
            <code className="info-code">{room.id}</code>
            <button className="btn btn--small" onClick={copyRoomId}>
              {copied ? '✓ 복사됨' : '📋 복사'}
            </button>
          </div>
        </div>

        <div className="info-row">
          <span className="info-label">난이도:</span>
          <span className="info-badge info-badge--difficulty">
            {room.puzzle.difficulty.toUpperCase()}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">플레이어:</span>
          <span className="info-badge">
            {players.length} / {room.maxPlayers}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">상태:</span>
          <span className={`info-badge info-badge--${room.status}`}>
            {room.status === 'waiting' ? '대기 중' : room.status}
          </span>
        </div>
      </div>

      {/* Players List */}
      <div className="lobby__players">
        <h3 className="lobby__section-title">
          플레이어 목록 ({players.length})
        </h3>

        <div className="players-grid">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`player-card ${player.id === currentUserId ? 'player-card--me' : ''} ${player.status === 'disconnected' ? 'player-card--disconnected' : ''}`}
            >
              <div className="player-card__avatar">
                {index === 0 ? '👑' : '🎮'}
              </div>
              <div className="player-card__info">
                <div className="player-card__name">
                  {player.nickname}
                  {player.id === room.hostId && ' (호스트)'}
                  {player.id === currentUserId && ' (나)'}
                </div>
                <div className="player-card__status">
                  {getPlayerStatusLabel(player.status)}
                </div>
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - players.length }, (_, i) => (
            <div key={`empty-${i}`} className="player-card player-card--empty">
              <div className="player-card__avatar">⏳</div>
              <div className="player-card__info">
                <div className="player-card__name">빈 자리</div>
                <div className="player-card__status">대기 중...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {isHost && players.length < 2 && (
        <div className="lobby__instructions">
          <h4>📢 친구 초대하기</h4>
          <ol>
            <li>위의 <strong>Room ID</strong>를 복사하세요</li>
            <li>친구에게 공유하세요 (카카오톡, 디스코드 등)</li>
            <li>친구가 <strong>"Join Room"</strong>에서 ID를 입력하면 자동 참가!</li>
            <li>최소 2명 이상 모이면 게임 시작 가능</li>
          </ol>
        </div>
      )}

      {!isHost && (
        <div className="lobby__instructions">
          <p>🎮 호스트가 게임을 시작할 때까지 기다려주세요!</p>
          <p>💬 다른 플레이어들과 채팅하며 전략을 세워보세요.</p>
        </div>
      )}

      {/* Actions */}
      <div className="lobby__actions">
        {canStart && (
          <button className="btn btn--primary btn--large" onClick={onStartGame}>
            🎮 게임 시작!
          </button>
        )}

        {isHost && !canStart && players.length < 2 && (
          <div className="lobby__wait-message">
            ⏳ 최소 2명의 플레이어가 필요합니다
          </div>
        )}

        <button className="btn btn--outline btn--danger" onClick={onLeaveRoom}>
          🚪 나가기
        </button>
      </div>
    </div>
  );
};

