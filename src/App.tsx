// ============================================
// Main App Component
// ============================================

import { useState, useEffect } from 'react';
import { initializeFirebase } from './firebase.config';
import { backendService } from './services/backendService';
import { readHostIdentity, initHostIdentityBridge, getNickname } from './services/identity';
import { ModeSelector } from './components/ModeSelector';
import { SudokuBoard } from './components/SudokuBoard';
import { RoomManager } from './components/RoomManager';
import { RoomJoin } from './components/RoomJoin';
import { Lobby } from './components/Lobby';
import { useSudokuGame } from './hooks/useSudokuGame';
import { useOnlineRoom } from './hooks/useOnlineRoom';
import type { Board, Difficulty, GameMode } from './services/types';
import { copyBoard } from './core/sudokuValidator';
import './App.css';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [externalUserId, setExternalUserId] = useState<string | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [onlineBoard, setOnlineBoard] = useState<Board>([]);
  const [onlineStartTime, setOnlineStartTime] = useState<number>(Date.now());
  const [hadOnlineRoom, setHadOnlineRoom] = useState(false);
  const [showOnlineResult, setShowOnlineResult] = useState(true);
  const [roomClosedReason, setRoomClosedReason] = useState<string | null>(null);
  const [completedDeleteSecondsLeft, setCompletedDeleteSecondsLeft] = useState<number | null>(null);

  // Firebase 초기화 및 익명 로그인
  useEffect(() => {
    const initialize = async () => {
      try {
        initializeFirebase();
        const uid = await backendService.signInAnonymously();
        const identity = readHostIdentity();
        setExternalUserId(identity.externalUserId);
        setNickname(getNickname(uid, identity));
        setUserId(uid);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize:', error);
        setInitError(error instanceof Error ? error.message : '초기화 실패');
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!userId) return;
    backendService.cleanupOldRooms(userId, 3 * 24 * 60 * 60 * 1000).catch((e) => {
      if (import.meta.env.DEV) {
        console.warn('[cleanupOldRooms] failed:', e);
      }
    });
  }, [userId]);

  useEffect(() => {
    // 전역 청소는 "모든 클라이언트"에서 돌리지 않음 (비용 폭증 방지)
    // 온라인 룸의 호스트만 주기적으로 prune/cleanup 수행
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = initHostIdentityBridge((identity) => {
      setExternalUserId(identity.externalUserId);
      setNickname(getNickname(userId, identity));
    });
    return () => unsubscribe();
  }, [userId]);

  // Solo game hook
  const soloGame = useSudokuGame({
    difficulty: selectedDifficulty,
    puzzle: undefined,
  });

  // Online room hook
  const onlineRoom = useOnlineRoom(roomId, userId || '');

  useEffect(() => {
    if (onlineRoom.room) setHadOnlineRoom(true);
    if (onlineRoom.room?.closedReason) setRoomClosedReason(onlineRoom.room.closedReason);
  }, [onlineRoom.room]);

  useEffect(() => {
    if (!onlineRoom.room) return;
    if (onlineRoom.room.status === 'playing') setShowOnlineResult(true);
  }, [onlineRoom.room?.status]);

  useEffect(() => {
    if (!onlineRoom.room || onlineRoom.room.status !== 'completed' || !onlineRoom.room.completedAt) {
      setCompletedDeleteSecondsLeft(null);
      return;
    }
    const tick = () => {
      const end = onlineRoom.room!.completedAt! + 15 * 60 * 1000;
      const leftMs = Math.max(0, end - Date.now());
      setCompletedDeleteSecondsLeft(Math.ceil(leftMs / 1000));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [onlineRoom.room?.status, onlineRoom.room?.completedAt]);

  const formatMmSs = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    if (gameMode !== 'online') return;
    if (!roomId) return;
    if (!hadOnlineRoom) return;
    if (onlineRoom.room !== null) return;
    if (roomClosedReason === 'timeout') {
      alert('제한시간 초과(40분)로 방이 종료되었습니다.');
    } else {
      alert('방이 종료되었습니다.');
    }
    setHadOnlineRoom(false);
    setRoomClosedReason(null);
    setGameMode(null);
    setRoomId(null);
    setShowJoinRoom(false);
    setOnlineBoard([]);
  }, [gameMode, roomId, hadOnlineRoom, onlineRoom.room, roomClosedReason]);

  // Solo 모드 시작
  const handleStartSolo = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setGameMode('solo');
    soloGame.newGame();
  };

  // Online 모드 시작 (방 만들기)
  const handleStartOnline = async (difficulty: Difficulty) => {
    if (!userId) return;

    setSelectedDifficulty(difficulty);
    try {
      const room = await onlineRoom.createRoom(difficulty, 4, nickname, externalUserId);
      setRoomId(room.id);
      setGameMode('online');
    } catch (error) {
      console.error('Failed to create room:', error);
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`방 생성 실패\n\n${msg}`);
    }
  };

  // 방 참여하기
  const handleJoinRoom = async (targetRoomId: string, nickname: string) => {
    if (!userId) return;

    try {
      await onlineRoom.joinRoom(targetRoomId, nickname, externalUserId);
      setRoomId(targetRoomId);
      setGameMode('online');
      setShowJoinRoom(false);
    } catch (error) {
      console.error('Failed to join room:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`방 참여 실패\n\n${errorMessage}`);
    }
  };

  // 메인 메뉴로 돌아가기
  const handleBackToMenu = () => {
    setGameMode(null);
    setRoomId(null);
    setShowJoinRoom(false);
    setOnlineBoard([]);
  };

  const handleBackToMenuFromOnline = async () => {
    if (roomId && userId) {
      try {
        // UI 전환보다 먼저 "플레이어 제거"를 확실히 시도
        await onlineRoom.leaveRoom();
      } catch (e) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류';
        alert(`방 나가기 실패\n\n${msg}\n\n(권한 문제면 Firestore Rules에서 players/{uid} 삭제 허용 필요)`);
      }
    }
    handleBackToMenu();
  };

  // 온라인 룸 나가기
  const handleLeaveRoom = async () => {
    try {
      await onlineRoom.leaveRoom();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alert(`방 나가기 실패\n\n${msg}\n\n(권한 문제면 Firestore Rules에서 players/{uid} 삭제 허용 필요)`);
    }
    handleBackToMenu();
  };

  // 온라인 기권(방에서 나가지 않음)
  const handleGiveUpOnline = async () => {
    await onlineRoom.giveUp();
  };

  // 온라인 게임 시작
  const handleStartOnlineGame = async () => {
    if (!onlineRoom.room || !roomId) return;
    
    try {
      await backendService.startGame(roomId);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('게임 시작 실패. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    if (!userId || !onlineRoom.room) return;
    if (onlineRoom.room.status !== 'playing') return;
    const serverBoard = onlineRoom.room.players?.[userId]?.currentBoard;
    const base =
      serverBoard && serverBoard.length === 9 ? serverBoard : onlineRoom.room.puzzle.board;
    setOnlineBoard(copyBoard(base));
    setOnlineStartTime(onlineRoom.room.startedAt || Date.now());
  }, [userId, onlineRoom.room?.id, onlineRoom.room?.status, onlineRoom.room?.startedAt]);

  // 로딩 중
  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing game...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="app-loading">
        <p style={{ maxWidth: 560, textAlign: 'center', lineHeight: 1.6 }}>
          초기화 실패<br />
          <span style={{ opacity: 0.8 }}>{initError}</span><br /><br />
          Vercel 환경변수 이름이 <strong>VITE_FIREBASE_*</strong> 형태인지 확인하고,
          Firebase Auth의 승인된 도메인에 <strong>brain-training-sudoku.vercel.app</strong>가 추가되었는지 확인하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 메인 메뉴 */}
      {gameMode === null && !showJoinRoom && (
        <ModeSelector
          onStartSolo={handleStartSolo}
          onStartOnline={handleStartOnline}
          onJoinRoom={() => setShowJoinRoom(true)}
        />
      )}

      {/* 방 참여 */}
      {showJoinRoom && (
        <RoomJoin
          onJoinRoom={handleJoinRoom}
          onCancel={() => setShowJoinRoom(false)}
          isLoading={onlineRoom.isLoading}
          defaultNickname={nickname}
        />
      )}

      {/* Solo 모드 */}
      {gameMode === 'solo' && soloGame.puzzle && (
        <div className="game-container">
          <div className="game-header">
            <button className="btn btn--outline" onClick={handleBackToMenu}>
              ← Back to Menu
            </button>
            <h2 className="game-title">Solo Play - {selectedDifficulty}</h2>
          </div>

          <SudokuBoard
            initialBoard={soloGame.puzzle.board}
            currentBoard={soloGame.currentBoard}
            solutionBoard={soloGame.puzzle.solution}
            allowSolution={true}
            startTime={soloGame.startTime}
            isRunning={!soloGame.isComplete}
            onCellChange={soloGame.handleCellChange}
            onRestart={soloGame.restart}
          />

          {soloGame.isComplete && (
            <div className="completion-modal">
              <div className="completion-content">
                <h2 className="completion-title">🎉 Congratulations!</h2>
                <p className="completion-text">You've completed the puzzle!</p>
                <div className="completion-actions">
                  <button className="btn btn--primary" onClick={soloGame.newGame}>
                    New Game
                  </button>
                  <button className="btn btn--outline" onClick={handleBackToMenu}>
                    Back to Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Online 모드 */}
      {gameMode === 'online' && onlineRoom.room && (
        <>
          {/* 대기실 (게임 시작 전) */}
          {onlineRoom.room.status === 'waiting' && (
            <Lobby
              room={onlineRoom.room}
              currentUserId={userId || ''}
              onStartGame={handleStartOnlineGame}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {/* 게임 진행/결과 화면 */}
          {(onlineRoom.room.status === 'playing' ||
            onlineRoom.room.status === 'completed' ||
            onlineRoom.room.status === 'abandoned') && (
            <div className="game-container">
              <div className="game-header">
                <button className="btn btn--outline" onClick={handleBackToMenuFromOnline}>
                  ← Back to Menu
                </button>
                <h2 className="game-title">Online Battle - {selectedDifficulty}</h2>
              </div>

              {onlineRoom.room.status === 'playing' && (
                <div style={{ marginBottom: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                  ⏳ 제한시간 <strong>40분</strong> (시간 초과 시 방이 자동 종료됩니다)
                </div>
              )}

              {onlineRoom.room.status === 'completed' && completedDeleteSecondsLeft !== null && (
                <div style={{ marginBottom: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                  ⏳ 방 자동 삭제까지 남은 시간: <strong>{formatMmSs(completedDeleteSecondsLeft)}</strong>
                </div>
              )}

              <div className="online-layout">
                <div className="online-game">
                  <SudokuBoard
                    initialBoard={onlineRoom.room.puzzle.board}
                    currentBoard={
                      onlineBoard.length === 9 ? onlineBoard : onlineRoom.room.puzzle.board
                    }
                    solutionBoard={onlineRoom.room.puzzle.solution}
                    allowSolution={onlineRoom.room.status === 'completed'}
                    startTime={onlineStartTime}
                    isRunning={onlineRoom.room.status === 'playing'}
                    onCellChange={(row, col, value) => {
                      const room = onlineRoom.room;
                      if (!room) return;
                      const next = copyBoard(
                        onlineBoard.length === 9 ? onlineBoard : room.puzzle.board
                      );
                      next[row][col] = value;
                      setOnlineBoard(next);
                      if (room.status === 'playing') {
                        onlineRoom.updateProgress({
                          currentBoard: next,
                          startedAt: onlineStartTime,
                          elapsedTime: Math.floor((Date.now() - onlineStartTime) / 1000),
                          mistakes: 0,
                        });
                      }
                    }}
                    onRestart={() => {
                      const room = onlineRoom.room;
                      if (!room) return;
                      const reset = copyBoard(room.puzzle.board);
                      setOnlineBoard(reset);
                      if (room.status === 'playing') {
                        onlineRoom.updateProgress({
                          currentBoard: reset,
                          startedAt: onlineStartTime,
                          elapsedTime: Math.floor((Date.now() - onlineStartTime) / 1000),
                          mistakes: 0,
                        });
                      }
                    }}
                    onGiveUp={handleGiveUpOnline}
                  />
                </div>

                <div className="online-sidebar">
                  <RoomManager
                    room={onlineRoom.room}
                    currentPlayerId={userId || ''}
                    onStartGame={handleStartOnlineGame}
                    onLeaveRoom={handleLeaveRoom}
                  />
                </div>
              </div>

              {onlineRoom.room.status === 'completed' && onlineRoom.room.winnerId && showOnlineResult && (
                <div className="completion-modal">
                  <div className="completion-content">
                    <h2 className="completion-title">
                      {onlineRoom.room.winnerId === (userId || '')
                        ? '🏆 승리하였습니다!'
                        : '😥 패배하였습니다'}
                    </h2>
                    <p className="completion-text">
                      승자: {onlineRoom.room.players[onlineRoom.room.winnerId]?.nickname || 'Unknown'}
                    </p>
                    <p className="completion-text" style={{ fontSize: '0.95rem' }}>
                      ⏳ 방은 <strong>15분 후 자동으로 삭제</strong>됩니다. (필요하면 계속 풀거나 답을 확인하세요)
                    </p>
                    <div className="completion-actions">
                      <button
                        className="btn btn--outline"
                        onClick={() => setShowOnlineResult(false)}
                      >
                        계속 풀기
                      </button>
                      <button className="btn btn--primary" onClick={handleLeaveRoom}>
                        종료(메뉴로)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {onlineRoom.room.status === 'abandoned' && onlineRoom.room.closedReason === 'timeout' && (
                <div className="completion-modal">
                  <div className="completion-content">
                    <h2 className="completion-title">⏱️ 제한시간 초과(40분)</h2>
                    <p className="completion-text">
                      제한시간이 지나 방이 자동 종료되었습니다.
                    </p>
                    <div className="completion-actions">
                      <button className="btn btn--primary" onClick={handleLeaveRoom}>
                        확인(메뉴로)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default App;
