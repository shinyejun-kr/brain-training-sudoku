# 🚀 배포 가이드

## 📦 1. 로컬 실행 파일로 배포

### 방법 1: Tauri (추천 - 가벼움)

```bash
# Tauri 설치
npm install -D @tauri-apps/cli
npm install @tauri-apps/api

# 초기화
npx tauri init

# 빌드 (Windows .exe 생성)
npm run tauri build
```

**결과:**
- `src-tauri/target/release/sudoku-game.exe` (2-5MB)
- 더블클릭으로 실행
- 친구 컴퓨터에 복사해서 바로 실행 가능

### 방법 2: Electron (무거움)

```bash
npm install --save-dev electron electron-builder

# package.json에 추가
{
  "main": "electron.js",
  "scripts": {
    "electron": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  }
}

# 빌드
npm run dist
```

**결과:**
- `dist/sudoku-game-1.0.0.exe` (100-200MB)
- 설치 프로그램 생성 가능

---

## 🌐 2. 온라인 웹 배포

### 🔥 Vercel (가장 쉬움, 추천!)

```bash
# 1회만: Vercel CLI 설치
npm install -g vercel

# 프로젝트 폴더에서
cd D:\last_word\sudoku-game

# 빌드
npm run build

# 배포
vercel --prod
```

**질문에 Enter 몇 번만 누르면 완료!**

**결과:**
```
✅ Production: https://sudoku-game-abc123.vercel.app
```

**장점:**
- 무료, 무제한
- 자동 HTTPS
- 코드 변경 시 자동 재배포
- 커스텀 도메인 연결 가능

### Netlify (대안)

```bash
# 1회만: Netlify CLI 설치
npm install -g netlify-cli

# 빌드
npm run build

# 배포
netlify deploy --prod --dir=dist
```

**결과:**
```
✅ Live URL: https://sudoku-game-xyz.netlify.app
```

### GitHub Pages (무료 호스팅)

```bash
# package.json에 추가
{
  "homepage": "https://yourusername.github.io/sudoku-game"
}

# gh-pages 설치
npm install --save-dev gh-pages

# package.json scripts에 추가
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# 배포
npm run deploy
```

---

## 📱 3. 모바일 앱 배포

### PWA (Progressive Web App) - 가장 쉬움!

**1단계: manifest.json 추가**

`public/manifest.json`:
```json
{
  "name": "Brain Training Sudoku",
  "short_name": "Sudoku",
  "description": "Challenge your mind with strategic puzzles",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0e27",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**2단계: index.html에 링크 추가**
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#667eea">
```

**3단계: Vercel에 배포**
```bash
vercel --prod
```

**사용법:**
- 스마트폰 브라우저에서 접속
- "홈 화면에 추가" 탭
- 앱처럼 사용! 📱

### Capacitor (진짜 네이티브 앱)

```bash
# Capacitor 설치
npm install @capacitor/core @capacitor/cli
npx cap init

# Android 추가
npm install @capacitor/android
npx cap add android

# 빌드 & 동기화
npm run build
npx cap sync

# Android Studio에서 열기
npx cap open android
```

**Android Studio에서:**
- Build → Generate Signed Bundle
- APK 파일 생성
- Google Play Store 업로드

**시간:** 2-3일 (처음이면 1주일)

---

## 🎮 4. 게임 플랫폼 배포

### Steam

**요구사항:**
- Steam Direct 수수료: $100 (환불 불가)
- Steamworks SDK 통합
- 리뷰 과정 (2-7일)

**과정:**
1. Steam Partner 계정 생성
2. Steamworks SDK 통합
3. 빌드 업로드
4. 스토어 페이지 작성
5. 가격 설정
6. 리뷰 제출

**시간:** 2-4주

### itch.io (무료 대안!)

```bash
# 빌드
npm run build

# itch.io에 수동 업로드
# 1. https://itch.io 계정 생성
# 2. "Create new project"
# 3. "Kind of project": HTML
# 4. dist 폴더를 zip으로 압축
# 5. 업로드
# 6. "This file will be played in the browser" 체크
```

**결과:**
```
✅ https://yourname.itch.io/sudoku-game
```

**장점:**
- 완전 무료
- 리뷰 없음 (즉시 배포)
- 결제 시스템 내장 (선택)

---

## 🔥 Firebase 온라인 멀티플레이 활성화

### 현재 상태
- Mock 모드: LocalStorage 사용
- 같은 브라우저 탭끼리만 동기화

### Firebase 연결 (진짜 온라인)

**1단계: Firebase Console 설정**
- [Firebase Console](https://console.firebase.google.com/) 접속
- 프로젝트 생성
- Authentication → 익명 로그인 활성화
- Firestore 생성

**2단계: `.env` 파일 생성**
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**3단계: 백엔드 모드 변경**
```typescript
// src/services/backendService.ts
const BACKEND_TYPE: BackendType = 'firebase'; // 'mock' → 'firebase'
```

**4단계: 배포**
```bash
npm run build
vercel --prod
```

**결과:**
- ✅ 전 세계 실시간 멀티플레이!
- ✅ 다른 나라 친구와도 플레이 가능
- ✅ 무료 (Firebase 무료 할당량 충분)

상세: `FIREBASE_SETUP.md` 참고

---

## 📊 배포 비교표

| 배포 방식 | 시간 | 비용 | 전세계 접속 | 앱 느낌 | 설치 필요 | 온라인 멀티 |
|----------|------|------|------------|--------|----------|-----------|
| **Vercel (웹)** | 5분 | 무료 | ✅ | ⭐⭐ | ❌ | ✅ (Firebase) |
| **PWA** | 10분 | 무료 | ✅ | ⭐⭐⭐⭐ | ❌ | ✅ (Firebase) |
| **Tauri (exe)** | 1시간 | 무료 | ❌ | ⭐⭐⭐⭐⭐ | ✅ | ✅ (Firebase) |
| **Electron** | 2시간 | 무료 | ❌ | ⭐⭐⭐⭐⭐ | ✅ | ✅ (Firebase) |
| **Capacitor (앱)** | 3일 | 무료 | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ✅ (Firebase) |
| **Steam** | 4주 | $100 | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| **itch.io** | 30분 | 무료 | ✅ | ⭐⭐⭐ | ❌ | ✅ (Firebase) |

---

## 🎯 추천 로드맵

### 🚀 단계 1: 빠른 공유 (오늘 가능)
```bash
# Vercel 배포
vercel --prod
```
→ 친구들에게 URL 공유 → 즉시 플레이!

### 📱 단계 2: PWA (내일 가능)
- manifest.json 추가
- 아이콘 생성
- Vercel 재배포
→ 스마트폰 "홈 화면에 추가"

### 🔥 단계 3: Firebase 연동 (이번 주)
- Firebase 프로젝트 생성
- .env 설정
- 배포
→ 진짜 실시간 멀티플레이!

### 🎮 단계 4: 앱 출시 (한 달 후)
- Capacitor로 네이티브 앱 빌드
- Google Play Store 등록
- 앱 출시! 🎉

---

## 💡 지금 당장 시도해볼 것

### Option A: 가장 빠른 온라인 공유 (5분)

```bash
cd D:\last_word\sudoku-game
npm install -g vercel
vercel --prod
```

Enter 몇 번 → 완료!
URL 복사 → 친구에게 공유

### Option B: 로컬 실행 파일 (1시간)

```bash
npm install -D @tauri-apps/cli @tauri-apps/api
npx tauri init

# 프롬프트:
# App name: Brain Training Sudoku
# Window title: Sudoku Game
# Web assets path: dist
# Dev server URL: http://localhost:5173
# Frontend dev command: npm run dev
# Frontend build command: npm run build

npm run tauri dev  # 테스트
npm run tauri build  # .exe 생성
```

**결과:**
`src-tauri/target/release/sudoku-game.exe`

친구에게 이 파일만 보내면 끝!

---

## 🆘 문제 해결

### Vercel 배포 시 환경 변수

Vercel 대시보드에서:
1. Settings → Environment Variables
2. Firebase 설정 추가
3. Redeploy

### 커스텀 도메인

Vercel에서:
- Settings → Domains
- `sudoku.yourdomain.com` 추가
- DNS 설정

---

**질문이 있거나 배포 도움이 필요하면 말씀하세요!** 🚀

