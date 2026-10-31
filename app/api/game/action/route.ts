import { NextResponse } from 'next/server';
import { applyHumanAction, GameError, npcStep } from '@/lib/engine';
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
 *  5. then upgrades the battle commentary with the LLM.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await requirePrivacyAcknowledgement(user.uid);
    const body = await req.json().catch(() => ({}));
    const gameId: string = typeof body.gameId === 'string' ? body.gameId : '';
    const action = body.action as GameAction | undefined;
    const expectedVersion: number | undefined = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;
    const fast = body.fast === true;
    if (!gameId || !action || typeof action.type !== 'string') throw new GameError('Bad request.');

    const db = adminDb();
    const ref = db.collection('games').doc(gameId);
    let newEvents: GameEvent[] = [];
    let version = 0;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new GameError('Game not found.', 404);
      const game = snap.data() as GameState;
      if (game.ownerUid !== user.uid) throw new GameError('Only the person who started this game can play it.', 403);
      if (expectedVersion !== undefined && expectedVersion !== game.version) {
        throw new GameError('Game moved on.', 409, { stale: true });
      }

      const result = action.type === 'NPC_STEP' ? npcStep(game) : applyHumanAction(game, action);
      const next: GameState = { ...result.state, version: game.version + 1, updatedAt: new Date().toISOString() };

      tx.set(ref, clean(next));
      for (const e of result.events) tx.set(ref.collection('events').doc(eventDocId(e.seq)), clean(e));
      newEvents = result.events;
      version = next.version;
    });

    // Upgrade template narration with Groq. During fast-forward only decisive moments
    // (conquest / failed attack) call the model, so fast-forward stays fast.
    const toNarrate = newEvents.filter(
      (e) => e.battle && (!fast || e.kind === 'CONQUEST' || e.kind === 'ATTACK_FAILED')
    );
    await Promise.all(
      toNarrate.map(async (e) => {
        const text = await aiCommentary(e.battle!);
        if (text) {
          await ref
            .collection('events')
            .doc(eventDocId(e.seq))
            .update({ commentary: text, commentarySource: 'ai' })
            .catch(() => undefined);
        }
      })
    );

    return NextResponse.json({ ok: true, version });
  } catch (err) {
    return errorResponse(err);
  }
}
