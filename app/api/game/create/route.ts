import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createGame, GameError } from '@/lib/engine';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { clean, errorResponse, eventDocId, requirePrivacyAcknowledgement, requireUser } from '@/lib/server/http';
import { NPC_PROFILES, normaliseNpcSettings, NpcSettings } from '@/lib/npcProfiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await requirePrivacyAcknowledgement(user.uid);
    const body = await req.json().catch(() => ({}));
    const countryCode = typeof body.countryCode === 'string' ? body.countryCode : '';
    const multiplayer = body.multiplayer === true;
    if (!countryCode) throw new GameError('Choose a country first.');

    const submitted = body.npcSettings && typeof body.npcSettings === 'object' ? body.npcSettings as Record<string, unknown> : {};
    const npcSettings = Object.fromEntries(NPC_PROFILES.map((profile) => [profile.id, normaliseNpcSettings(submitted[profile.id])])) as Record<string, NpcSettings>;

    const { state, events: createdEvents } = createGame({ ownerUid: user.uid, ownerName: user.name, humanCode: countryCode, npcSettings, multiplayer });

    const db = adminDb();
    const events = createdEvents;
    if (multiplayer) {
      state.status = 'LOBBY';
      const firstTurnEvent = events.findIndex((event) => event.kind === 'TURN_START');
      if (firstTurnEvent >= 0) events.splice(firstTurnEvent, 1);
      state.eventSeq = events.length ? events[events.length - 1].seq : 0;
      for (let attempt = 0; attempt < 4; attempt++) {
        const code = randomBytes(4).toString('hex').toUpperCase();
        const existing = await db.collection('games').where('lobbyCode', '==', code).limit(1).get();
        if (existing.empty) { state.lobbyCode = code; break; }
      }
      if (!state.lobbyCode) throw new GameError('Could not reserve a lobby code. Please try again.');
    }
    const ref = db.collection('games').doc();
    const batch = db.batch();
    batch.set(ref, clean(state));
    for (const e of events) batch.set(ref.collection('events').doc(eventDocId(e.seq)), clean(e));
    await batch.commit();

    return NextResponse.json({ gameId: ref.id, lobbyCode: state.lobbyCode });
  } catch (err) {
    return errorResponse(err);
  }
}
