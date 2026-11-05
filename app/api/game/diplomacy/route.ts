import { NextResponse } from 'next/server';
import { currentPlayerId, GameError } from '@/lib/engine';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { clean, errorResponse, eventDocId, requirePrivacyAcknowledgement, requireUser } from '@/lib/server/http';
import { GameEvent, GameState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Diplomacy is server-authoritative: only the current human commander may offer or break a pact. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await requirePrivacyAcknowledgement(user.uid);
    const body = await req.json().catch(() => ({}));
    const gameId = typeof body.gameId === 'string' ? body.gameId : '';
    const operation = body.operation;
    const targetPlayerId = typeof body.targetPlayerId === 'string' ? body.targetPlayerId : '';
    const offerId = typeof body.offerId === 'string' ? body.offerId : '';
    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : -1;
    if (!gameId || !['offer', 'accept', 'decline', 'break'].includes(operation) || expectedVersion < 0) throw new GameError('Campaign, diplomacy action, and current version are required.');

    const ref = adminDb().collection('games').doc(gameId);
    await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new GameError('Campaign not found.', 404);
      const game = snap.data() as GameState;
      if (game.status !== 'ACTIVE' || !game.multiplayer) throw new GameError('Diplomacy is available in active multiplayer campaigns.', 409);
      if (game.version !== expectedVersion) throw new GameError('Campaign moved on. Refresh and try again.', 409, { stale: true });
      const actor = game.players.find((player) => player.uid === user.uid);
      if (!actor || actor.eliminated) throw new GameError('Only a living commander in this campaign can conduct diplomacy.', 403);
      const offers = [...(game.diplomacyOffers ?? [])];
      const alliances = [...(game.alliances ?? [])];
      const now = new Date().toISOString();
      let text = '';

      if (operation === 'offer' || operation === 'break') {
        if (game.turnOrder[game.turnIndex] !== actor.id || game.phase !== 'ACTION') throw new GameError('Make or end diplomatic agreements during your ACTION phase.', 409);
      }
      if (operation === 'offer') {
        const target = game.players.find((player) => player.id === targetPlayerId);
        if (!target || target.id === actor.id || target.kind !== 'human' || target.eliminated) throw new GameError('Choose another active human commander.');
        if (alliances.some((item) => [item.playerA, item.playerB].includes(actor.id) && [item.playerA, item.playerB].includes(target.id))) throw new GameError('You already have a non-aggression pact with this commander.', 409);
        if (offers.some((item) => item.fromPlayerId === actor.id && item.toPlayerId === target.id)) throw new GameError('You already have a pending offer to this commander.', 409);
        offers.push({ id: crypto.randomUUID(), fromPlayerId: actor.id, toPlayerId: target.id, createdAt: now });
        text = `${actor.name} offered ${target.name} a non-aggression pact.`;
      } else if (operation === 'accept' || operation === 'decline') {
        const offerIndex = offers.findIndex((item) => item.id === offerId && item.toPlayerId === actor.id);
        if (offerIndex < 0) throw new GameError('That diplomatic offer is no longer available.', 404);
        const offer = offers.splice(offerIndex, 1)[0];
        const proposer = game.players.find((player) => player.id === offer.fromPlayerId);
        if (operation === 'accept') {
          if (!proposer || proposer.eliminated) throw new GameError('The proposing commander is no longer active.', 409);
          alliances.push({ playerA: proposer.id, playerB: actor.id, formedAt: now });
          text = `${actor.name} accepted a non-aggression pact with ${proposer.name}.`;
        } else text = `${actor.name} declined ${proposer?.name ?? 'a commander'}’s diplomatic offer.`;
      } else {
        const index = alliances.findIndex((item) => item.playerA === actor.id && item.playerB === targetPlayerId || item.playerB === actor.id && item.playerA === targetPlayerId);
        if (index < 0) throw new GameError('No active pact exists with that commander.', 404);
        alliances.splice(index, 1);
        const target = game.players.find((player) => player.id === targetPlayerId);
        text = `${actor.name} ended the non-aggression pact with ${target?.name ?? 'a commander'}.`;
      }

      const event: GameEvent = { seq: game.eventSeq + 1, ts: now, round: game.round, playerId: actor.id, kind: 'SYSTEM', text };
      tx.set(ref, clean({ ...game, diplomacyOffers: offers, alliances, eventSeq: event.seq, version: game.version + 1, updatedAt: now }));
      tx.set(ref.collection('events').doc(eventDocId(event.seq)), clean(event));
    });
    return NextResponse.json({ ok: true });
  } catch (err) { return errorResponse(err); }
}
