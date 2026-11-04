import { after, NextResponse } from 'next/server';
import { applyHumanAction, currentPlayerId, GameError, npcStep } from '@/lib/engine';
import { aiCommentary } from '@/lib/commentary';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { clean, errorResponse, eventDocId, requirePrivacyAcknowledgement, requireUser } from '@/lib/server/http';
import { GameAction, GameEvent, GameState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Every state change goes through here. The server:
 *  1. verifies the Firebase ID token,
 *  2. checks the caller OWNS this game (visitors can watch, never play),
 *  3. runs the rules engine (dice are rolled here, never in the browser),
 *  4. saves state + events in one transaction (so refreshing / closing the browser cannot undo an attack),
 *  5. then upgrades the battle commentary with the LLM after returning the move.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await requirePrivacyAcknowledgement(user.uid);
    const body = await req.json().catch(() => ({}));
    const gameId: string = typeof body.gameId === 'string' ? body.gameId : '';
    const action = body.action as GameAction | undefined;
    const expectedVersion: number | undefined = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;
    if (!gameId || !action || typeof action.type !== 'string') throw new GameError('Bad request.');

    const db = adminDb();
    const ref = db.collection('games').doc(gameId);
    let newEvents: GameEvent[] = [];
    let version = 0;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new GameError('Game not found.', 404);
      const game = snap.data() as GameState;
      if (expectedVersion !== undefined && expectedVersion !== game.version) {
        throw new GameError('Game moved on.', 409, { stale: true });
      }

      if (action.type === 'NPC_STEP') {
        const isParticipant = game.ownerUid === user.uid || (game.participantUids ?? []).includes(user.uid);
        if (!isParticipant) throw new GameError('Join this campaign before running its rival commanders.', 403);
      } else {
        const active = game.players.find((player) => player.id === currentPlayerId(game));
        const accountUid = active?.uid ?? (active?.id === 'player' ? game.ownerUid : undefined);
        if (active?.kind !== 'human' || accountUid !== user.uid) {
          throw new GameError('It is not your turn in this campaign.', 403);
        }
      }

      const result = action.type === 'NPC_STEP' ? npcStep(game) : applyHumanAction(game, action);
      const next: GameState = { ...result.state, version: game.version + 1, updatedAt: new Date().toISOString() };

      tx.set(ref, clean(next));
      for (const e of result.events) tx.set(ref.collection('events').doc(eventDocId(e.seq)), clean(e));
      newEvents = result.events;
      version = next.version;
    });

    // Every battle round gets an AI attempt. `after` keeps the game action
    // responsive while the updated commentary arrives through the live listener.
    const toNarrate = newEvents.filter((event) => event.battle);
    if (toNarrate.length) {
      after(async () => {
        await Promise.all(toNarrate.map(async (event) => {
          const text = await aiCommentary(event.battle!);
          if (!text) return;
          await ref.collection('events').doc(eventDocId(event.seq))
            .update({ commentary: text, commentarySource: 'ai' })
            .catch((err) => console.warn('Could not save Groq commentary:', err));
        }));
      });
    }

    return NextResponse.json({ ok: true, version });
  } catch (err) {
    return errorResponse(err);
  }
}
