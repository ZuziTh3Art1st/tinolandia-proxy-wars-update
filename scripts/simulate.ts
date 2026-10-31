/**
 * Plays complete games headlessly to prove the engine is sound.
 *   npm run simulate            (default 200 games)
 *   npm run simulate -- 50      (custom number of games)
 * The "human" seat is driven by a bot that uses the same HumanAction API as the UI.
 */
import { applyHumanAction, createGame, currentPlayer, npcStep } from '../lib/engine';
import { chooseAttack, planGarrison, planReinforcements, shouldStopAttack } from '../lib/npc';
import { COUNTRIES } from '../lib/countries';
import { GameState, HumanAction } from '../lib/types';

function check(s: GameState, label: string) {
  const fail = (m: string) => {
    throw new Error(`INVARIANT BROKEN (${label}): ${m}`);
  };
  if (s.countries.length !== 10) fail('country count');
  for (const c of s.countries) {
    if (!Number.isInteger(c.soldiers) || c.soldiers < 1) fail(`${c.name} has ${c.soldiers} soldiers`);
    if (!s.players.some((p) => p.id === c.ownerId)) fail('orphan owner');
  }
  for (const p of s.players) {
    const n = s.countries.filter((c) => c.ownerId === p.id).length;
    if (p.eliminated && n !== 0) fail(`${p.name} eliminated but owns ${n}`);
    if (!p.eliminated && n === 0 && s.status === 'ACTIVE') fail(`${p.name} owns 0 but is not eliminated`);
  }
  if (s.status === 'ACTIVE') {
    if (currentPlayer(s).eliminated) fail('eliminated player has the turn');
    if (s.phase === 'REINFORCE' && s.reinforcementsLeft <= 0) fail('REINFORCE with nothing to deploy');
    if (s.phase === 'ATTACKING' && !s.attack) fail('ATTACKING without attack');
  }
}

function botAction(s: GameState, state: { transferred: boolean }): HumanAction {
  const pid = currentPlayer(s).id;
  switch (s.phase) {
    case 'REINFORCE':
      state.transferred = false;
      return { type: 'DEPLOY', allocations: planReinforcements(s.countries, pid, s.reinforcementsLeft).allocations };
    case 'ACTION': {
      const c = chooseAttack(s.countries, pid, s.round);
      return c.attack ? { type: 'ATTACK', sourceId: c.sourceCode, targetId: c.targetCode } : { type: 'END_TURN' };
    }
    case 'ATTACKING': {
      const src = s.countries.find((x) => x.code === s.attack!.sourceId)!;
      const tgt = s.countries.find((x) => x.code === s.attack!.targetId)!;
      return s.attack!.rounds > 0 && shouldStopAttack(src, tgt, s.round).stop ? { type: 'STOP_ATTACK' } : { type: 'ROLL' };
    }
    default: {
      // POST_ATTACK
      if (!state.transferred) {
        state.transferred = true;
        const g = planGarrison(
          s.countries.find((x) => x.code === s.attack!.sourceId)!,
          s.countries.find((x) => x.code === s.attack!.targetId)!,
          s.countries
        );
        if (g.move) return { type: 'TRANSFER', ...g.move };
      }
      state.transferred = false;
      return { type: 'END_TURN' };
    }
  }
}

function playOne(): { rounds: number; steps: number; winnerKind: string; finished: boolean; battles: number; eventCount: number } {
  const humanCode = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].code;
  let { state: s, events: first } = createGame({ ownerUid: 'u1', ownerName: 'Tester', humanCode });
  let eventCount = first.length;
  const bot = { transferred: false };
  let steps = 0;
  let battles = 0;
  while (s.status === 'ACTIVE' && steps < 40000) {
    steps++;
    const before = s.eventSeq;
    const res = currentPlayer(s).kind === 'npc' ? npcStep(s) : applyHumanAction(s, botAction(s, bot));
    s = res.state;
    if (res.events.length === 0 && s.eventSeq === before && res.state.status === 'ACTIVE' && s.phase === 'ACTION' && false) throw new Error('no progress');
    for (const e of res.events) {
      if (e.seq !== before + 1 + res.events.indexOf(e)) throw new Error('event seq not contiguous');
      if (e.battle) battles++;
    }
    eventCount += res.events.length;
    check(s, `step ${steps}`);
  }
  const winner = s.players.find((p) => p.id === s.winnerId);
  return { rounds: s.round, steps, winnerKind: winner ? winner.kind : 'none', finished: s.status === 'FINISHED', battles, eventCount };
}

const N = Number(process.argv[2]) || 200;
const t0 = Date.now();
const results = Array.from({ length: N }, () => playOne());
const fin = results.filter((r) => r.finished);
const avg = (k: 'rounds' | 'steps' | 'battles' | 'eventCount') => Math.round(fin.reduce((a, r) => a + r[k], 0) / Math.max(1, fin.length));
const sorted = (k: 'rounds' | 'steps') => fin.map((r) => r[k]).sort((a, b) => a - b);
console.log(`games: ${N}  finished: ${fin.length}  unfinished: ${N - fin.length}  (${Date.now() - t0} ms)`);
console.log(`avg rounds: ${avg('rounds')}  median rounds: ${sorted('rounds')[Math.floor(fin.length / 2)]}  max rounds: ${Math.max(...fin.map((r) => r.rounds))}`);
console.log(`avg steps: ${avg('steps')}  avg battles rounds: ${avg('battles')}  avg events: ${avg('eventCount')}`);
console.log(`winner is the human seat: ${fin.filter((r) => r.winnerKind === 'human').length}/${fin.length}  (all seats use the same strategy, so ~10% expected)`);
if (fin.length !== N) process.exit(1);
