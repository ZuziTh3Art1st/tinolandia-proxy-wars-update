import { NextResponse } from 'next/server';
import { currentPlayerId, GameError } from '@/lib/engine';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { clean, errorResponse, eventDocId, requirePrivacyAcknowledgement, requireUser } from '@/lib/server/http';
import { GameEvent, GameState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await requirePrivacyAcknowledgement(user.uid);
    const body = await req.json().catch(() => ({}));
    const gameId = typeof body.gameId === 'string' ? body.gameId : '';
    if (!gameId) throw new GameError('Choose a lobby to start.');

    const db = adminDb();
    const ref = db.collection('games').doc(gameId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new GameError('Lobby not found.', 404);
      const game = snap.data() as GameState;
      if (game.ownerUid !== user.uid) throw new GameError('Only the lobby host can start the campaign.', 403);
      if (game.status !== 'LOBBY') throw new GameError('This lobby has already started.', 409);

      const next: GameState = { ...game, status: 'ACTIVE', version: game.version + 1, updatedAt: new Date().toISOString() };
      const playerId = currentPlayerId(next);
      const player = next.players.find((item) => item.id === playerId)!;
      const event: GameEvent = {
        seq: next.eventSeq + 1,
        ts: next.updatedAt,
        round: next.round,
        playerId,
        kind: player.kind === 'human' ? 'TURN_START' : 'SYSTEM',
        text: player.kind === 'human' ? `${player.name}'s turn (round ${next.round}).` : `${user.name} starts the campaign. ${player.name} moves first.`,
      };
      next.eventSeq = event.seq;
      tx.set(ref, clean(next));
      tx.set(ref.collection('events').doc(eventDocId(event.seq)), clean(event));
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
