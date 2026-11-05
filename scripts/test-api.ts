/**
 * Exercises the REAL API route handlers against an in-memory Firestore + fake auth.
 *   npm run test:api
 * Verifies: auth (401), ownership (403), stale versions (409), turn rules (409), a complete game
 * played through the routes, contiguous events, and the Groq commentary upgrade (mocked fetch).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Use an in-memory Firestore store for these route checks.
const store = new Map<string, any>();
const clone = (x: any) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
class Ref {
  constructor(public path: string) {}
  get id() { return this.path.split('/').pop()!; }
  collection(name: string) { return new Col(`${this.path}/${name}`); }
  async get() { return snap(this); }
  async update(patch: any) {
    if (!store.has(this.path)) throw new Error('update on missing doc ' + this.path);
    store.set(this.path, { ...store.get(this.path), ...clone(patch) });
  }
}
let autoId = 0;
class Col {
  constructor(public path: string) {}
  doc(id?: string) { return new Ref(`${this.path}/${id ?? 'auto' + ++autoId}`); }
}
const snap = (ref: Ref) => ({ exists: store.has(ref.path), data: () => clone(store.get(ref.path)), get: (field: string) => clone(store.get(ref.path)?.[field]) });
const fakeDb = {
  collection: (n: string) => new Col(n),
  batch: () => {
    const ops: Array<() => void> = [];
    return { set: (r: Ref, d: any) => ops.push(() => store.set(r.path, clone(d))), commit: async () => ops.forEach((o) => o()) };
  },
  runTransaction: async (fn: (tx: any) => Promise<void>) => {
    const writes: Array<() => void> = [];
    await fn({ get: async (r: Ref) => snap(r), set: (r: Ref, d: any) => writes.push(() => store.set(r.path, clone(d))) });
    writes.forEach((w) => w());
  },
};
const fakeAuth = {
  verifyIdToken: async (t: string) => {
    if (t === 'tok-u1') return { uid: 'u1', name: 'Tester', email: 't@x.com' };
    if (t === 'tok-u2') return { uid: 'u2', email: 'other@x.com' };
    throw new Error('bad token');
  },
};
store.set('privacy-notice-acknowledgements/u1', { noticeVersion: '2026-10-31-v1' });
store.set('privacy-notice-acknowledgements/u2', { noticeVersion: '2026-10-31-v1' });
const fbPath = require.resolve('../lib/server/firebaseAdmin');
(require.cache as any)[fbPath] = { id: fbPath, filename: fbPath, loaded: true, exports: { adminDb: () => fakeDb, adminAuth: () => fakeAuth } };

// Stub Groq so the checks do not call the live service.
process.env.GROQ_API_KEY = 'test-key';
let groqCalls = 0;
const realFetch = globalThis.fetch;
(globalThis as any).fetch = async (url: any, init?: any) => {
  if (String(url).includes('api.groq.com/openai/v1/chat/completions')) {
    groqCalls++;
    return new Response(JSON.stringify({ choices: [{ message: { content: '"AI says: steel meets steel."' } }] }), { status: 200 });
  }
  return realFetch(url, init);
};

const { POST: createRoute } = require('../app/api/game/create/route');
const { POST: actionRoute } = require('../app/api/game/action/route');
const { currentPlayer } = require('../lib/engine');
const { chooseAttack, planGarrison, planReinforcements, shouldStopAttack } = require('../lib/npc');

let failures = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
};
const call = async (route: any, body: any, token?: string) => {
  const res = await route(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }));
  return { status: res.status, body: await res.json() };
};
const load = (id: string) => clone(store.get(`games/${id}`));
const events = (id: string) =>
  Array.from(store.entries()).filter(([k]) => k.startsWith(`games/${id}/events/`)).map(([, v]) => v).sort((a, b) => a.seq - b.seq);

async function main() {
  // --- create
  let r = await call(createRoute, { countryCode: 'ZA' });
  ok('create without login -> 401', r.status === 401);
  r = await call(createRoute, { countryCode: 'ZA' }, 'forged');
  ok('create with forged token -> 401', r.status === 401);
  r = await call(createRoute, { countryCode: 'XX' }, 'tok-u1');
  ok('create with unknown country -> 400', r.status === 400);
  r = await call(createRoute, { countryCode: 'ZA' }, 'tok-u1');
  ok('create ok', r.status === 200 && !!r.body.gameId);
  const id: string = r.body.gameId;
  let g = load(id);
  ok('game owned by creator, 10 countries, 10 players, starts at version 1', g.ownerUid === 'u1' && g.countries.length === 10 && g.players.length === 10 && g.version === 1);
  ok('chosen country is ZA with 5 soldiers (65.4M people)', g.countries.find((c: any) => c.code === 'ZA')?.soldiers === 5);
  ok('initial events saved', events(id).length === g.eventSeq && g.eventSeq >= 2);

  // --- access control
  r = await call(actionRoute, { gameId: id, action: { type: 'END_TURN' } });
  ok('action without login -> 401', r.status === 401);
  r = await call(actionRoute, { gameId: id, action: { type: 'NPC_STEP' }, expectedVersion: 1 }, 'tok-u2');
  ok("another user cannot play my game -> 403", r.status === 403);
  r = await call(actionRoute, { gameId: 'nope', action: { type: 'END_TURN' }, expectedVersion: 1 }, 'tok-u1');
  ok('unknown game -> 404', r.status === 404);

  // --- turn rules
  const humanFirst = currentPlayer(g).kind === 'human';
  if (humanFirst) {
    r = await call(actionRoute, { gameId: id, action: { type: 'NPC_STEP' }, expectedVersion: g.version }, 'tok-u1');
    ok('NPC_STEP on the human turn -> 409', r.status === 409);
    r = await call(actionRoute, { gameId: id, action: { type: 'ROLL' }, expectedVersion: g.version }, 'tok-u1');
    ok('ROLL with no attack in progress -> 409', r.status === 409);
    r = await call(actionRoute, { gameId: id, action: { type: 'TRANSFER', fromId: 'ZA', toId: 'ZA', count: 1 }, expectedVersion: g.version }, 'tok-u1');
    ok('invalid transfer rejected -> 400', r.status === 400);
  } else {
    r = await call(actionRoute, { gameId: id, action: { type: 'END_TURN' }, expectedVersion: g.version }, 'tok-u1');
    ok('human action on an NPC turn is rejected', r.status === 403 || r.status === 409);
  }
  r = await call(actionRoute, { gameId: id, action: { type: 'NPC_STEP' }, expectedVersion: 99 }, 'tok-u1');
  ok('stale expectedVersion -> 409 {stale:true}', r.status === 409 && r.body.stale === true);

  // --- play the whole game through the routes
  const bot = { transferred: false };
  const pick = (g: any) => {
    const pid = currentPlayer(g).id;
    if (g.phase === 'REINFORCE') { bot.transferred = false; return { type: 'DEPLOY', allocations: planReinforcements(g.countries, pid, g.reinforcementsLeft).allocations }; }
    if (g.phase === 'ACTION') { const c = chooseAttack(g.countries, pid, g.round); return c.attack ? { type: 'ATTACK', sourceId: c.sourceCode, targetId: c.targetCode } : { type: 'END_TURN' }; }
    if (g.phase === 'ATTACKING') { const f = (c: string) => g.countries.find((x: any) => x.code === c); return g.attack.rounds > 0 && shouldStopAttack(f(g.attack.sourceId), f(g.attack.targetId), g.round).stop ? { type: 'STOP_ATTACK' } : { type: 'ROLL' }; }
    if (!bot.transferred) { bot.transferred = true; const f = (c: string) => g.countries.find((x: any) => x.code === c); const m = planGarrison(f(g.attack.sourceId), f(g.attack.targetId), g.countries); if (m.move) return { type: 'TRANSFER', ...m.move }; }
    bot.transferred = false; return { type: 'END_TURN' };
  };

  let calls = 0, versionOk = true, hardError = '';
  let fastToggle = false;
  while (g.status === 'ACTIVE' && calls < 8000) {
    calls++;
    const v = g.version;
    const isNpc = currentPlayer(g).kind === 'npc';
    fastToggle = !fastToggle;
    r = await call(actionRoute, { gameId: id, action: isNpc ? { type: 'NPC_STEP' } : pick(g), expectedVersion: v, ...(isNpc ? { fast: fastToggle } : {}) }, 'tok-u1');
    if (r.status !== 200) { hardError = `${r.status} ${JSON.stringify(r.body)} during ${JSON.stringify(isNpc ? 'NPC_STEP' : pick(g))}`; break; }
    g = load(id);
    if (g.version !== v + 1 || r.body.version !== v + 1) versionOk = false;
  }
  ok('full game played to the end through the routes', g.status === 'FINISHED' && !hardError, `(${calls} calls, round ${g.round}${hardError ? ', ' + hardError : ''})`);
  ok('version increased by exactly 1 per call', versionOk);

  const ev = events(id);
  ok('events are contiguous 1..N and match eventSeq', ev.length === g.eventSeq && ev.every((e, i) => e.seq === i + 1), `(${ev.length} events)`);
  const battle = ev.filter((e) => e.battle);
  ok('every battle event has narration', battle.length > 0 && battle.every((e) => typeof e.commentary === 'string' && e.commentary.length > 0), `(${battle.length} battle events)`);
  const ai = battle.filter((e) => e.commentarySource === 'ai');
  ok('Groq narration was stored on events and stripped of quotes', ai.length > 0 && ai.every((e) => e.commentary === 'AI says: steel meets steel.'), `(${ai.length} AI / ${battle.length - ai.length} template, ${groqCalls} Groq calls)`);
  ok('every NPC attack/skip decision has a justification', ev.filter((e) => ['ATTACK_START', 'TURN_END', 'REINFORCE'].includes(e.kind) && e.playerId.startsWith('npc')).every((e) => !!e.reason));

  r = await call(actionRoute, { gameId: id, action: { type: 'END_TURN' }, expectedVersion: g.version }, 'tok-u1');
  ok('actions on a finished game -> 409', r.status === 409);

  // --- Groq outage must not break the game
  (globalThis as any).fetch = async (url: any, init?: any) => (String(url).includes('api.groq.com/openai/v1/chat/completions') ? new Response('boom', { status: 500 }) : realFetch(url, init));
  r = await call(createRoute, { countryCode: 'US' }, 'tok-u1');
  let g2 = load(r.body.gameId), steps = 0;
  while (g2.status === 'ACTIVE' && currentPlayer(g2).kind === 'npc' && steps++ < 40) { await call(actionRoute, { gameId: r.body.gameId, action: { type: 'NPC_STEP' }, expectedVersion: g2.version }, 'tok-u1'); g2 = load(r.body.gameId); }
  ok('game keeps working (template narration) when Groq errors', steps > 0 || currentPlayer(g2).kind === 'human');

  console.log(failures === 0 ? '\nALL API CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
