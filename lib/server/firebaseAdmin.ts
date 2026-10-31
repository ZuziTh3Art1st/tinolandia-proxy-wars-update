import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { GameError } from '../engine';

/**
 * Server-only. Credentials come from environment variables (see README):
 *   FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY (+ optional FIREBASE_ADMIN_PROJECT_ID)
 * The Admin SDK bypasses Firestore security rules, which is how the server is the ONLY writer of game state.
 */
function adminApp(): App {
  if (getApps().length) return getApp();
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tinolandia---geopolotics';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !rawKey) {
    throw new GameError(
      'Server is not configured: FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY are missing (see README step 3).',
      500
    );
  }
  // Tolerate keys pasted with surrounding quotes and with literal "\n" sequences.
  const privateKey = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } catch (err) {
    console.error('Firebase Admin could not start (bad service-account values):', err);
    throw new GameError(
      `Server credentials are invalid: ${(err as Error).message} -- re-copy client_email and private_key from the service-account JSON into .env.local, restart, and run "node scripts/check-env.js" to diagnose.`,
      500
    );
  }
}

export const adminDb = () => getFirestore(adminApp());
export const adminAuth = () => getAuth(adminApp());
