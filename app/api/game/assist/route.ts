import { NextResponse } from 'next/server';
import { GameError } from '@/lib/engine';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { errorResponse, requirePrivacyAcknowledgement, requireUser } from '@/lib/server/http';
import { GameState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await requirePrivacyAcknowledgement(user.uid);
    const body = await req.json().catch(() => ({}));
    const gameId = typeof body.gameId === 'string' ? body.gameId : '';
    if (!gameId) throw new GameError('Choose a campaign before requesting advice.');

    const db = adminDb();
    const ref = db.collection('games').doc(gameId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new GameError('Campaign not found.', 404);
      const game = snap.data() as GameState;
      const isParticipant = game.ownerUid === user.uid
        || (game.participantUids ?? []).includes(user.uid)
        || game.players.some((player) => player.uid === user.uid);
      if (!isParticipant) throw new GameError('Join this campaign before requesting advice.', 403);
      if (game.status !== 'ACTIVE') throw new GameError('Advice is only available during an active campaign.', 409);
      if (!game.assisted) tx.update(ref, { assisted: true, updatedAt: new Date().toISOString() });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
