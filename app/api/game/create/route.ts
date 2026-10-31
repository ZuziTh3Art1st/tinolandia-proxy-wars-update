import { NextResponse } from 'next/server';
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
    if (!countryCode) throw new GameError('Choose a country first.');

    const submitted = body.npcSettings && typeof body.npcSettings === 'object' ? body.npcSettings as Record<string, unknown> : {};
    const npcSettings = Object.fromEntries(NPC_PROFILES.map((profile) => [profile.id, normaliseNpcSettings(submitted[profile.id])])) as Record<string, NpcSettings>;

    const { state, events } = createGame({ ownerUid: user.uid, ownerName: user.name, humanCode: countryCode, npcSettings });

    const db = adminDb();
    const ref = db.collection('games').doc();
    const batch = db.batch();
    batch.set(ref, clean(state));
    for (const e of events) batch.set(ref.collection('events').doc(eventDocId(e.seq)), clean(e));
    await batch.commit();

    return NextResponse.json({ gameId: ref.id });
  } catch (err) {
    return errorResponse(err);
  }
}
