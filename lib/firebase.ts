import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

// These are PUBLIC web-app identifiers (safe to ship to the browser). The fallbacks keep local
// development working; on Vercel you can override them with NEXT_PUBLIC_FIREBASE_* variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAKERDGkBUhKXK6ZJZLrIYu3V2TmV0tieQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'tinolandia---geopolotics.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tinolandia---geopolotics',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tinolandia---geopolotics.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let firestore: Firestore;
try {
  // Long-polling auto-detect makes live updates work behind strict school/corporate networks.
  firestore = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  firestore = getFirestore(app); // already initialised (hot reload)
}

export const db = firestore;
export const auth = getAuth(app);
