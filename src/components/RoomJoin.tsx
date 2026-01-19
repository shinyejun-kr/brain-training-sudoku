// ============================================
// 방 참여 컴포넌트
// ============================================

import React, { useState } from 'react';

interface RoomJoinProps {
  onJoinRoom: (roomId: string, nickname: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  defaultNickname?: string;
}

export const RoomJoin: React.FC<RoomJoinProps> = ({
  onJoinRoom,
  onCancel,
  isLoading = false,
  defaultNickname = '',
}) => {
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState(defaultNickname);
  const [error, setError] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 검증
    if (!roomId.trim()) {
      setError('Room ID를 입력하세요');
      return;
    }
    
    if (!nickname.trim()) {
      setError('닉네임을 입력하세요');
      return;
    }

    setError('');
    onJoinRoom(roomId.trim(), nickname.trim());
  };

  return (
    <div className="room-join">
      <div className="room-join__header">
        <h2 className="room-join__title">🚪 방 참여하기</h2>
        <p className="room-join__subtitle">
          친구가 공유한 Room ID를 입력하세요
        </p>
      </div>

      <form className="room-join__form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="roomId" className="form-label">
            Room ID
          </label>
          <input
            id="roomId"
            type="text"
            className="form-input"
            placeholder="room_1234567890"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <p className="form-hint">
            💡 호스트가 공유한 Room ID를 붙여넣으세요
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="nickname" className="form-label">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            className="form-input"
            placeholder="Player123"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={isLoading}
            maxLength={20}
          />
        </div>

        {error && (
          <div className="form-error">
            ⚠️ {error}
          </div>
        )}

        <div className="room-join__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isLoading}
          >
            {isLoading ? '참가 중...' : '🎮 방 참가'}
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

