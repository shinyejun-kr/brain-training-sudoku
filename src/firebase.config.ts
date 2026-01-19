import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 인스턴스 초기화
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

export const initializeFirebase = () => {
  if (!app) {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
      throw new Error(
        'Firebase 환경변수가 설정되지 않았습니다. Vercel에 VITE_FIREBASE_API_KEY / VITE_FIREBASE_AUTH_DOMAIN / VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_APP_ID 등을 추가하고 재배포하세요.'
      );
    }
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  
  return { app, auth, db };
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseDb = (): Firestore => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

