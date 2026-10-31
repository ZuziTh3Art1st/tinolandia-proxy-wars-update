import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebaseAdmin';
import { GameError } from '../engine';

export interface AuthedUser {
  uid: string;
  name: string;
}

/** Verifies the Firebase ID token in "Authorization: Bearer <token>". */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new GameError('You must be logged in to play.', 401);

  // Server set-up problems (missing/invalid credentials) surface here as clear 500 errors,
  // and are NOT reported as a "session expired" login problem.
  const auth = adminAuth();

  try {
    const decoded = await auth.verifyIdToken(token);
    const name =
      (decoded.name as string | undefined) ||
      (decoded.email ? decoded.email.split('@')[0] : '') ||
      'Commander';
    return { uid: decoded.uid, name: name.slice(0, 24) };
  } catch (err: any) {
    const code: string = err?.code || '';
    const msg: string = err?.message || String(err);
    console.error('verifyIdToken failed:', code, msg);
    if (code === 'auth/id-token-expired') throw new GameError('Your session has expired. Please log in again.', 401);
    if (/incorrect "aud"|incorrect "iss"/i.test(msg))
      throw new GameError(
        'The server is set up for a different Firebase project than the website. Check that the service-account key comes from the same project (FIREBASE_ADMIN_PROJECT_ID).',
        500
      );
    if (/public keys|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|fetch failed|network/i.test(msg))
      throw new GameError('The server could not reach Google to verify your login (network or firewall problem).', 500);
    if (/too early|clock/i.test(msg))
      throw new GameError("Login check failed because this computer's clock looks wrong. Sync your date and time, then try again.", 401);
    throw new GameError('Could not verify your login. Please log out, log in again, and retry.', 401);
  }
}

export async function requirePrivacyAcknowledgement(uid: string): Promise<void> {
  const record = await adminDb().collection('privacy-notice-acknowledgements').doc(uid).get();
  if (record.get('noticeVersion') !== '2026-10-31-v1') {
    throw new GameError('Please review and acknowledge the privacy notice before starting or changing a campaign.', 403);
  }
}

/** Firestore rejects `undefined`; a JSON round-trip strips it. */
export const clean = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export const eventDocId = (seq: number) => String(seq).padStart(6, '0');

export function errorResponse(err: unknown) {
  if (err instanceof GameError) {
    return NextResponse.json({ error: err.message, ...(err.data || {}) }, { status: err.status });
  }
  console.error('Unhandled API error:', err);
  return NextResponse.json({ error: 'Something went wrong on the server.' }, { status: 500 });
}
