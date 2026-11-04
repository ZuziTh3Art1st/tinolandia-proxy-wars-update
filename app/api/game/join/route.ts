import { NextResponse } from 'next/server';
import { GameError } from '@/lib/engine';
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
    if (!gameId) throw new GameError('Choose a campaign to join.');

    const db = adminDb();
    const ref = db.collection('games').doc(gameId);
    let commander = '';
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new GameError('Campaign not found.', 404);
      const game = snap.data() as GameState;
      if (!game.multiplayer) throw new GameError('This campaign was started as single-player.', 409);
      if (game.status !== 'ACTIVE') throw new GameError('This campaign has already finished.', 409);
      if ((game.participantUids ?? []).includes(user.uid) || game.players.some((player) => player.uid === user.uid)) {
        throw new GameError('You already joined this campaign.', 409);
      }
      const seat = game.players.find((player) => player.kind === 'npc' && !player.eliminated);
      if (!seat) throw new GameError('There are no open commander seats in this campaign.', 409);

      seat.kind = 'human';
      seat.name = user.name;
      seat.uid = user.uid;
      const now = new Date().toISOString();
      const next: GameState = {
        ...game,
        participantUids: [...(game.participantUids ?? [game.ownerUid]), user.uid],
        version: game.version + 1,
        updatedAt: now,
      };
      const event: GameEvent = {
        seq: next.eventSeq + 1,
        ts: now,
        round: next.round,
        playerId: seat.id,
        kind: 'SYSTEM',
        text: `${user.name} joined the campaign as ${game.countries.find((country) => country.ownerId === seat.id)?.name ?? 'a rival commander'}.`,
      };
      next.eventSeq = event.seq;
      tx.set(ref, clean(next));
      tx.set(ref.collection('events').doc(eventDocId(event.seq)), clean(event));
      commander = seat.id;
    });
    return NextResponse.json({ ok: true, commander });
  } catch (err) {
    return errorResponse(err);
  }
}
