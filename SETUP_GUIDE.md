# 🚀 Setup Guide - Brain Training Sudoku

## 📦 프로젝트 완성 상태

✅ **모든 TODO 완료!**
- ✅ React Vite 프로젝트 생성
- ✅ Firebase 설정 및 초기화 코드
- ✅ 서비스 계층 아키텍처 (Firebase + 추상화)
- ✅ 스도쿠 로직 엔진 (생성/검증)
- ✅ UI 컴포넌트 (보드, 모드 선택)
- ✅ 혼자 플레이 모드 구현
- ✅ 온라인 플레이 모드 구현
- ✅ 스타일링 (다크 테마, 모던 UI)

## 📁 생성된 파일 구조

```
sudoku-game/
├── src/
│   ├── services/              ⭐ 백엔드 추상화 계층
│   │   ├── types.ts          # 모든 타입 정의
│   │   ├── firebaseService.ts # Firebase 구현
│   │   └── backendService.ts  # 추상화 레이어
│   ├── core/                  # 게임 로직
│   │   ├── sudokuGenerator.ts
│   │   ├── sudokuValidator.ts
│   │   └── sudokuSolver.ts
│   ├── components/            # React 컴포넌트
│   │   ├── Cell.tsx
│   │   ├── SudokuBoard.tsx
│   │   ├── Timer.tsx
│   │   ├── ModeSelector.tsx
│   │   └── RoomManager.tsx
│   ├── hooks/
│   │   ├── useSudokuGame.ts
│   │   └── useOnlineRoom.ts
│   ├── App.tsx
│   ├── App.css
│   └── firebase.config.ts
├── README.md                  # 사용자 가이드
├── ARCHITECTURE.md            # 아키텍처 문서
├── env.example.txt            # 환경 변수 예시
└── package.json

```

## 🎮 실행 방법

### 1️⃣ 기본 실행 (Firebase 없이)

```bash
cd sudoku-game
npm run dev
```

앱이 **데모 모드**로 실행됩니다. (Firebase 설정 없이도 동작)

### 2️⃣ Firebase 연결 (옵션)

#### Step 1: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `brain-sudoku` (원하는 이름)

#### Step 2: 인증 활성화

1. 좌측 메뉴 > **Authentication**
2. **Sign-in method** 탭
3. **익명(Anonymous)** 활성화

#### Step 3: Firestore 생성

1. 좌측 메뉴 > **Firestore Database**
2. "데이터베이스 만들기" 클릭
3. **테스트 모드**로 시작

#### Step 4: 웹 앱 등록

1. 프로젝트 설정 ⚙️ > **프로젝트 설정**
2. 하단 **내 앱** > **웹 앱 추가** (</> 아이콘)
3. 앱 닉네임 입력 후 등록

#### Step 5: 환경 변수 설정

1. Firebase 설정 코드 복사:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "brain-sudoku.firebaseapp.com",
     projectId: "brain-sudoku",
     // ...
   };
   ```

2. `.env` 파일 생성:
   ```bash
   # sudoku-game 폴더에서
   cp env.example.txt .env
   ```

3. `.env` 파일 수정:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=brain-sudoku.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=brain-sudoku
   VITE_FIREBASE_STORAGE_BUCKET=brain-sudoku.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

4. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

## 🌟 주요 기능

### 🧠 Solo Play
- 난이도 선택 (Easy / Normal / Hard)
- 퍼즐 자동 생성
- 입력 검증 (규칙 위반 시 빨간색 표시)
- 타이머
- 재시작 버튼
- 완료 시 축하 모달

### 🏆 Online Battle
- 룸 생성 (최대 4명)
- 룸 ID로 친구 초대
- 실시간 진행률 표시
- 먼저 완성하는 사람이 승리

## 🎨 UI 특징

- **다크 테마**: 눈이 편안한 어두운 배경
- **그라데이션 액센트**: 보라색/파란색 조합
- **미니멀 디자인**: 깔끔한 아웃라인 버튼
- **반응형**: 모바일 지원

## 🔄 서버리스 API 연동 방법

### 현재 상태
```typescript
// src/services/backendService.ts
const BACKEND_TYPE: BackendType = 'firebase'; // ← 현재 Firebase 사용
```

### 미래: 자체 API로 전환

#### 1. API 구현 (`src/services/backendService.ts`)

```typescript
class RestApiBackendService implements IBackendService {
  private apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  async signInAnonymously(): Promise<string> {
    const res = await fetch(`${this.apiBaseUrl}/auth/anonymous`, {
      method: 'POST',
    });
    const data = await res.json();
    return data.userId;
  }

  async createSoloGame(userId: string, difficulty: Difficulty): Promise<SoloGame> {
    const res = await fetch(`${this.apiBaseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, difficulty }),
    });
    return res.json();
  }

  // ... 나머지 메서드 구현
}
```

#### 2. 백엔드 타입 변경

```typescript
const BACKEND_TYPE: BackendType = 'rest-api'; // ← 변경
```

#### 3. 환경 변수 추가 (`.env`)

```env
VITE_BACKEND_TYPE=rest-api
VITE_API_BASE_URL=https://api.yourdomain.com
```

**끝!** 다른 코드는 수정 불필요 ✨

## 📡 필요한 API 엔드포인트

### Authentication
```
POST /auth/anonymous
Response: { userId: string }
```

### Solo Game
```
POST /games
Body: { userId, difficulty }
Response: SoloGame

GET /games/:gameId
Response: SoloGame

PUT /games/:gameId/progress
Body: GameProgress
```

### Online Room
```
POST /rooms
Body: { hostId, difficulty, maxPlayers }
Response: OnlineRoom

GET /rooms/:roomId
Response: OnlineRoom

POST /rooms/:roomId/join
Body: Player

DELETE /rooms/:roomId/leave
Body: { playerId }

PUT /rooms/:roomId/progress
Body: { playerId, progress }

WebSocket /rooms/:roomId/subscribe
Event: room-updated
```

## 🧪 테스트

```bash
# 빌드 테스트
npm run build

# 프리뷰
npm run preview

# 타입 체크
npx tsc --noEmit
```

## 📦 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

환경 변수를 Vercel 대시보드에서 설정하세요.

### Netlify 배포

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 배포
netlify deploy --prod
```

## 🐛 문제 해결

### "Firebase not configured" 에러
→ `.env` 파일을 확인하세요. 없으면 데모 모드로 실행됩니다.

### 빌드 에러
```bash
# node_modules 재설치
rm -rf node_modules
npm install
npm run build
```

### 포트 충돌
```bash
# 다른 포트로 실행
npm run dev -- --port 3000
```

## 📚 참고 문서

- **README.md**: 사용자 가이드
- **ARCHITECTURE.md**: 상세 아키텍처 설명
- **env.example.txt**: 환경 변수 템플릿

## 🎯 다음 단계 (선택사항)

1. **힌트 시스템**: 막혔을 때 숫자 제안
2. **Undo/Redo**: 실수 되돌리기
3. **일일 챌린지**: 매일 새로운 퍼즐
4. **리더보드**: 최고 기록 경쟁
5. **테마 변경**: 라이트 모드 추가
6. **음향 효과**: 클릭 소리, 완료 사운드

---

## 🎉 완성!

프로젝트가 완전히 준비되었습니다. 

```bash
cd D:\last_word\sudoku-game
npm run dev
```

로 바로 시작할 수 있습니다! 🚀

