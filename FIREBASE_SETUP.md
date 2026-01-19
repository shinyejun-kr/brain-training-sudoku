# 🔥 Firebase 연결 가이드

## 🎮 온라인 모드 작동 원리

### 1. **Room 생성 (호스트)**

```typescript
// 사용자가 "Create Online Room" 클릭 시
const room = await backendService.createRoom(userId, 'normal', 4);

// Firebase에 저장되는 데이터:
{
  id: "room_1234567890",
  hostId: "user_abc123",
  puzzle: {
    board: [[null, 5, null, ...], ...],  // 퍼즐
    solution: [[1, 5, 3, ...], ...],      // 정답
    difficulty: "normal"
  },
  players: {},                             // 빈 객체 (아직 참가자 없음)
  status: "waiting",                       // 대기 중
  maxPlayers: 4
}
```

### 2. **Room 참가**

```typescript
// 다른 사용자가 Room ID로 참가
await backendService.joinRoom(roomId, {
  id: "user_xyz789",
  nickname: "Player2",
  progress: 0,
  status: "active",
  currentBoard: [[null, null, ...], ...]
});

// Firebase 업데이트:
{
  ...room,
  players: {
    "user_abc123": { nickname: "Host", progress: 0, ... },
    "user_xyz789": { nickname: "Player2", progress: 0, ... }  // 추가됨
  }
}
```

### 3. **실시간 동기화 (핵심!)**

```typescript
// 모든 플레이어가 Room을 "구독"
const unsubscribe = backendService.subscribeToRoom(roomId, (updatedRoom) => {
  // 누군가 숫자를 입력할 때마다 이 콜백이 실행됨
  console.log('Room updated!', updatedRoom);
  setRoom(updatedRoom);  // React state 업데이트
});

// Firebase onSnapshot() 사용:
// → Room 문서가 변경될 때마다 자동으로 모든 클라이언트에 알림
```

### 4. **진행률 업데이트**

```typescript
// 플레이어가 숫자를 입력할 때마다
await backendService.updatePlayerProgress(roomId, playerId, {
  currentBoard: [[1, 5, 3, ...], ...],
  startedAt: 1234567890,
  elapsedTime: 120,  // 2분 경과
  mistakes: 2
});

// Firebase 업데이트:
players: {
  "user_abc123": {
    progress: 45,  // 45% 완성 ← 실시간으로 다른 플레이어에게 보임!
    status: "active"
  },
  "user_xyz789": {
    progress: 30,  // 30% 완성
    status: "active"
  }
}
```

### 5. **승리 조건**

```typescript
// 100% 완성 시
if (isBoardComplete(currentBoard)) {
  await updatePlayerProgress(roomId, playerId, {
    ...progress,
    completedAt: Date.now()
  });
  
  // Firebase:
  players: {
    "user_abc123": {
      progress: 100,
      status: "completed",  // 완료!
      completedAt: 1234567890
    }
  }
}
```

---

## 🔧 Firebase 연결 단계별 가이드

### Step 1: Firebase Console 설정

#### 1-1. 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `brain-sudoku` (또는 원하는 이름)
4. Google Analytics: 선택 사항 (나중에 추가 가능)
5. "프로젝트 만들기" 클릭

#### 1-2. 웹 앱 등록

1. 프로젝트 개요 페이지에서 **</> (웹)** 아이콘 클릭
2. 앱 닉네임: `Sudoku Game Web`
3. "앱 등록" 클릭
4. **Firebase SDK 구성**이 나타남 → **복사해두세요!**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxx...",
  authDomain: "brain-sudoku.firebaseapp.com",
  projectId: "brain-sudoku",
  storageBucket: "brain-sudoku.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### Step 2: Authentication 설정

1. 좌측 메뉴 **"Authentication"** 클릭
2. **"시작하기"** 클릭
3. **"Sign-in method"** 탭
4. **"익명(Anonymous)"** 찾아서 클릭
5. **사용 설정** 토글 ON
6. **"저장"** 클릭

> 💡 **왜 익명 로그인?**
> - 회원가입 없이 즉시 플레이 가능
> - 각 사용자에게 고유 UID 부여
> - 나중에 Google/이메일 로그인 추가 가능

### Step 3: Firestore 설정

#### 3-1. 데이터베이스 생성

1. 좌측 메뉴 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. 위치 선택: **asia-northeast3 (서울)** 추천
4. 보안 규칙: **"테스트 모드에서 시작"** 선택
   - ⚠️ 주의: 30일 후 자동으로 규칙 변경 필요
5. **"사용 설정"** 클릭

#### 3-2. 보안 규칙 설정 (중요!)

1. **"규칙"** 탭 클릭
2. 다음 규칙으로 변경:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 익명 사용자만 접근 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Solo games: 본인 게임만 읽기/쓰기
    match /games/{gameId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Rooms: 모두 읽기 가능, 참가자만 쓰기
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. **"게시"** 클릭

### Step 4: 프로젝트에 설정 적용

#### 4-1. 환경 변수 파일 생성

프로젝트 루트(`sudoku-game/`)에서:

```bash
# env.example.txt를 .env로 복사
cp env.example.txt .env
```

또는 직접 `.env` 파일 생성:

```env
# Firebase Configuration (Step 1-2에서 복사한 값)
VITE_FIREBASE_API_KEY=AIzaSyBxxx...
VITE_FIREBASE_AUTH_DOMAIN=brain-sudoku.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=brain-sudoku
VITE_FIREBASE_STORAGE_BUCKET=brain-sudoku.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Backend Type (Firebase 사용)
VITE_BACKEND_TYPE=firebase
```

#### 4-2. 백엔드 타입 변경

`src/services/backendService.ts` 파일:

```typescript
// 현재 (Mock 모드)
const BACKEND_TYPE: BackendType = 'mock';

// 변경 → Firebase 모드
const BACKEND_TYPE: BackendType = 'firebase';
```

또는 환경 변수로 자동 선택:

```typescript
const BACKEND_TYPE: BackendType = 
  (import.meta.env.VITE_BACKEND_TYPE as BackendType) || 'firebase';
```

#### 4-3. 개발 서버 재시작

```bash
# Ctrl+C로 현재 서버 종료 후
npm run dev
```

---

## ✅ 연결 확인

### 1. 브라우저 콘솔 확인

```
✅ Firebase initialized
✅ Auth state changed: abc123def456
```

### 2. Firebase Console에서 확인

#### Authentication 탭:
- 사용자 탭에 익명 사용자가 추가됨

#### Firestore 탭:
- Solo 게임 시작 시 `games/` 컬렉션 생성
- Online 룸 생성 시 `rooms/` 컬렉션 생성

---

## 🎮 온라인 모드 테스트 방법

### 테스트 시나리오

```bash
# Terminal 1 (호스트)
npm run dev
# → http://localhost:5173

# Terminal 2 (플레이어2)
npm run dev -- --port 5174
# → http://localhost:5174
```

**같은 브라우저**에서 두 탭 열기도 가능!

### 플로우

1. **탭 1 (호스트)**:
   - "Create Online Room" 클릭
   - Room ID 복사 (예: `room_1234567890`)
   - 플레이어 대기

2. **탭 2 (플레이어2)**:
   - "Join Room" 버튼 추가하거나, URL에 직접 입력
   - Room에 참가

3. **호스트**:
   - "Start Game" 클릭

4. **양쪽 탭**:
   - 동시에 같은 퍼즐 풀기
   - 실시간으로 상대방 진행률 확인

---

## 🔥 Firebase 실시간 동기화 원리

### onSnapshot() 마법

```typescript
// firebaseService.ts
subscribeToRoom(roomId: string, callback: (room: OnlineRoom) => void) {
  const roomRef = doc(this.db, 'rooms', roomId);
  
  // 이 한 줄이 핵심!
  const unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as OnlineRoom);  // 변경될 때마다 호출
    }
  });
  
  return unsubscribe;  // 컴포넌트 언마운트 시 구독 해제
}
```

### 작동 방식

```
Player A가 숫자 입력
    ↓
Firebase에 업데이트
    ↓
onSnapshot() 감지 ← 모든 구독자에게 알림
    ↓
Player B의 콜백 실행
    ↓
React state 업데이트
    ↓
UI 자동 리렌더링 → 진행률 바 업데이트!
```

---

## 💰 Firebase 무료 할당량

### Firestore

- **읽기**: 50,000회/일
- **쓰기**: 20,000회/일
- **삭제**: 20,000회/일
- **저장**: 1GB

### Authentication

- **익명 로그인**: 무제한 무료

### 예상 사용량 (1게임 기준)

```
Solo Game:
- 쓰기: 1회 (게임 생성) + 10회 (진행 저장) = 11회
- 읽기: 2회 (게임 로드)

Online Game (4명, 10분):
- 쓰기: 1회 (룸 생성) + 4회 (참가) + 400회 (진행 업데이트) = 405회
- 읽기: 400회 (실시간 구독)

하루 100게임 = 40,500회 → 무료 범위 내!
```

---

## 🚨 문제 해결

### "Permission denied" 에러

**원인**: Firestore 보안 규칙이 잘못됨

**해결**:
1. Firebase Console > Firestore > 규칙
2. Step 3-2의 규칙으로 변경
3. "게시" 클릭

### "Firebase not initialized" 에러

**원인**: `.env` 파일이 없거나 잘못됨

**해결**:
1. `.env` 파일 존재 확인
2. 모든 `VITE_FIREBASE_*` 변수 설정 확인
3. 개발 서버 재시작

### 실시간 업데이트 안 됨

**원인**: `onSnapshot()` 구독이 안 됨

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. Firestore 규칙에서 읽기 권한 확인
3. 네트워크 탭에서 WebSocket 연결 확인

---

## 🎯 다음 단계

### 기능 추가 아이디어

1. **Room 탐색 기능**:
   ```typescript
   // 공개 룸 목록 보기
   const rooms = await getDocs(collection(db, 'rooms'));
   ```

2. **채팅 기능**:
   ```typescript
   // 각 룸에 messages 서브컬렉션 추가
   rooms/{roomId}/messages/{messageId}
   ```

3. **리더보드**:
   ```typescript
   // 최고 기록 저장
   leaderboard/{userId}
     - bestTime: 180 (초)
     - gamesCompleted: 25
   ```

---

## 📚 참고 문서

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 실시간 업데이트](https://firebase.google.com/docs/firestore/query-data/listen)
- [보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)

---

**이제 Firebase로 실시간 멀티플레이를 즐기세요!** 🎮🔥

