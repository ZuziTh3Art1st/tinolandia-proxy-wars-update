import {
  AttackState,
  BattleSnapshot,
  CountryState,
  EventKind,
  GameEvent,
  GameState,
  HumanAction,
  Player,
} from './types';
import { Rng, conquestBonus, resolveRound, soldiersFromPopulation } from './rules';
import { COUNTRIES, getCountryInfo } from './countries';
import { chooseAttack, planFortify, planGarrison, planReinforcements, shouldStopAttack } from './npc';
import { templateCommentary } from './commentary';
import { DEFAULT_NPC_SETTINGS, NPC_PROFILES, NpcSettings } from './npcProfiles';

export class GameError extends Error {
  status: number;
  data?: Record<string, unknown>;
  constructor(message: string, status = 400, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const PLAYER_COLORS = [
  '#c47a54', '#6e9e83', '#5288a8', '#b4665a', '#a88a67',
  '#7e8795', '#548f91', '#927f68', '#a17967', '#7a8c5f',
];
const NPC_NAMES = NPC_PROFILES.map((profile) => profile.name);
export const HUMAN_ID = 'player';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const getPlayer = (s: GameState, id: string): Player => {
  const p = s.players.find((x) => x.id === id);
  if (!p) throw new GameError(`Unknown player ${id}`, 500);
  return p;
};
const getCountry = (s: GameState, code: string): CountryState => {
  const c = s.countries.find((x) => x.code === code);
  if (!c) throw new GameError(`Unknown country ${code}`, 400);
  return c;
};
export const currentPlayerId = (s: GameState) => s.turnOrder[s.turnIndex];
export const currentPlayer = (s: GameState) => getPlayer(s, currentPlayerId(s));
const ownedBy = (s: GameState, pid: string) => s.countries.filter((c) => c.ownerId === pid);

function emit(
  s: GameState,
  events: GameEvent[],
  playerId: string,
  kind: EventKind,
  text: string,
  extra: Partial<GameEvent> = {}
): GameEvent {
  s.eventSeq += 1;
  const e: GameEvent = { seq: s.eventSeq, ts: new Date().toISOString(), round: s.round, playerId, kind, text, ...extra };
  events.push(e);
  return e;
}

function assertActive(s: GameState) {
  if (s.status !== 'ACTIVE') throw new GameError('This game is finished.', 409);
}

// ---------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------
export function createGame(opts: {
  ownerUid: string;
  ownerName: string;
  humanCode: string;
  multiplayer?: boolean;
  npcSettings?: Record<string, NpcSettings>;
  rng?: Rng;
}): { state: GameState; events: GameEvent[] } {
  const rng = opts.rng ?? Math.random;
  const mine = getCountryInfo(opts.humanCode);
  if (!mine) throw new GameError('Unknown country selected.', 400);

  const others = shuffle(
    COUNTRIES.filter((c) => c.code !== mine.code),
    rng
  ).slice(0, 9);
  const chosen = [mine, ...others];

  const colors = shuffle(PLAYER_COLORS, rng);
  const players: Player[] = chosen.map((_, i) =>
    i === 0
      ? { id: HUMAN_ID, name: opts.ownerName, kind: 'human', uid: opts.ownerUid, color: colors[0], eliminated: false }
      : { id: `npc_${i}`, name: NPC_NAMES[i - 1], kind: 'npc', color: colors[i], eliminated: false, ...(opts.npcSettings?.[`npc_${i}`] ?? DEFAULT_NPC_SETTINGS) }
  );
  const countries: CountryState[] = chosen.map((c, i) => {
    const soldiers = soldiersFromPopulation(c.population);
    return {
      code: c.code,
      name: c.name,
      population: c.population,
      initialSoldiers: soldiers,
      soldiers,
      ownerId: players[i].id,
    };
  });

  const now = new Date().toISOString();
  const s: GameState = {
    ownerUid: opts.ownerUid,
    ownerName: opts.ownerName,
    multiplayer: !!opts.multiplayer,
    participantUids: [opts.ownerUid],
    humanCountry: mine.code,
    startingCountries: Object.fromEntries(players.map((player, index) => [player.id, chosen[index].code])),
    createdAt: now,
    updatedAt: now,
    status: 'ACTIVE',
    players,
    turnOrder: shuffle(players.map((p) => p.id), rng),
    turnIndex: 0,
    round: 1,
    phase: 'ACTION',
    reinforcementsLeft: 0,
    attack: null,
    lastBattle: null,
    countries,
    eventSeq: 0,
    version: 1,
  };

  const events: GameEvent[] = [];
  emit(s, events, 'system', 'SYSTEM', `${opts.ownerName} takes command of ${mine.name} against 9 rival nations. Conquer all 10 to win!`);
  emit(
    s,
    events,
    'system',
    'SYSTEM',
    `Turn order drawn at random: ${s.turnOrder.map((id) => getPlayer(s, id).name).join(' → ')}.`
  );
  beginTurn(s, events);
  return { state: s, events };
}

// ---------------------------------------------------------------------------
// turn flow
// ---------------------------------------------------------------------------
function beginTurn(s: GameState, events: GameEvent[]) {
  const p = currentPlayer(s);
  s.attack = null;
  const n = ownedBy(s, p.id).length;
  if (s.round >= 2) {
    s.phase = 'REINFORCE';
    s.reinforcementsLeft = 2 * n;
  } else {
    s.phase = 'ACTION';
    s.reinforcementsLeft = 0;
  }
  if (p.kind === 'human') {
    emit(
      s,
      events,
      p.id,
      'TURN_START',
      s.round >= 2
        ? `${p.name}'s turn (round ${s.round}): ${2 * n} new soldiers to deploy.`
        : `${p.name}'s turn (round ${s.round}).`
    );
  }
}

function advanceTurn(s: GameState, events: GameEvent[]) {
  if (s.status !== 'ACTIVE') return;
  s.attack = null;
  for (let i = 0; i < s.turnOrder.length; i++) {
    s.turnIndex += 1;
    if (s.turnIndex >= s.turnOrder.length) {
      s.turnIndex = 0;
      s.round += 1;
    }
    if (!getPlayer(s, s.turnOrder[s.turnIndex]).eliminated) break;
  }
  beginTurn(s, events);
}

// ---------------------------------------------------------------------------
// primitive actions (shared by humans and NPCs)
// ---------------------------------------------------------------------------
function doDeploy(s: GameState, events: GameEvent[], pid: string, allocations: Record<string, number>, reason?: string) {
  if (s.phase !== 'REINFORCE') throw new GameError('There is nothing to deploy right now.', 409);
  let total = 0;
  const parts: string[] = [];
  for (const [code, count] of Object.entries(allocations)) {
    if (!Number.isInteger(count) || count < 0) throw new GameError('Invalid reinforcement amount.');
    if (count === 0) continue;
    const c = getCountry(s, code);
    if (c.ownerId !== pid) throw new GameError(`You do not control ${c.name}.`, 403);
    total += count;
  }
  if (total !== s.reinforcementsLeft) {
    throw new GameError(`Deploy exactly ${s.reinforcementsLeft} soldiers (you allocated ${total}).`);
  }
  for (const [code, count] of Object.entries(allocations)) {
    if (!count) continue;
    const c = getCountry(s, code);
    c.soldiers += count;
    parts.push(`${c.name} +${count}`);
  }
  const p = getPlayer(s, pid);
  emit(s, events, pid, 'REINFORCE', `${p.name} deploys ${total} reinforcements: ${parts.join(', ')}.`, { reason });
  s.reinforcementsLeft = 0;
  s.phase = 'ACTION';
}

function doTransfer(s: GameState, events: GameEvent[], pid: string, fromId: string, toId: string, count: number, reason?: string) {
  if (s.phase !== 'ACTION' && s.phase !== 'POST_ATTACK') {
    throw new GameError(
      s.phase === 'ATTACKING' ? 'You cannot transfer soldiers while an attack is in progress.' : 'Deploy your reinforcements first.',
      409
    );
  }
  if (!Number.isInteger(count) || count < 1) throw new GameError('Transfer at least 1 soldier.');
  if (fromId === toId) throw new GameError('Choose two different countries.');
  const from = getCountry(s, fromId);
  const to = getCountry(s, toId);
  if (from.ownerId !== pid || to.ownerId !== pid) throw new GameError('You can only transfer between countries you control.', 403);
  if (from.soldiers - count < 1) throw new GameError(`${from.name} must keep at least 1 soldier.`);
  from.soldiers -= count;
  to.soldiers += count;
  const p = getPlayer(s, pid);
  emit(s, events, pid, 'TRANSFER', `${p.name} moves ${count} soldier${count > 1 ? 's' : ''} from ${from.name} to ${to.name}.`, { reason });
}

function doStartAttack(s: GameState, events: GameEvent[], pid: string, sourceId: string, targetId: string, reason?: string) {
  if (s.phase !== 'ACTION') {
    throw new GameError(s.phase === 'REINFORCE' ? 'Deploy your reinforcements first.' : 'Only one attack is allowed per turn.', 409);
  }
  const src = getCountry(s, sourceId);
  const tgt = getCountry(s, targetId);
  if (src.ownerId !== pid) throw new GameError('You can only attack from a country you control.', 403);
  if (tgt.ownerId === pid) throw new GameError('You cannot attack your own country.');
  if ((s.alliances ?? []).some((alliance) => (alliance.playerA === pid && alliance.playerB === tgt.ownerId) || (alliance.playerB === pid && alliance.playerA === tgt.ownerId))) {
    throw new GameError('You have a non-aggression pact with this commander. End the alliance on your turn before attacking.', 409);
  }
  if (src.soldiers < 2) throw new GameError(`${src.name} needs at least 2 soldiers to attack.`);
  const attack: AttackState = { sourceId, targetId, rounds: 0 };
  s.attack = attack;
  s.phase = 'ATTACKING';
  const p = getPlayer(s, pid);
  emit(
    s,
    events,
    pid,
    'ATTACK_START',
    `${p.name} attacks ${tgt.name} (${tgt.soldiers}) from ${src.name} (${src.soldiers}).`,
    { reason }
  );
}

type RoundOutcome = 'CONTINUE' | 'CONQUERED' | 'FAILED';

function doBattleRound(s: GameState, events: GameEvent[], rng: Rng, reason?: string): RoundOutcome {
  if (s.phase !== 'ATTACKING' || !s.attack) throw new GameError('No attack is in progress.', 409);
  const src = getCountry(s, s.attack.sourceId);
  const tgt = getCountry(s, s.attack.targetId);
  const attackerPid = src.ownerId;
  const defenderPid = tgt.ownerId;
  const attackerPlayer = getPlayer(s, attackerPid);
  const defenderPlayer = getPlayer(s, defenderPid);

  const attackerBefore = src.soldiers;
  const defenderBefore = tgt.soldiers;
  const r = resolveRound(src.soldiers, tgt.soldiers, rng);
  src.battleRounds = (src.battleRounds ?? 0) + 1;
  tgt.battleRounds = (tgt.battleRounds ?? 0) + 1;
  src.soldiers -= r.attackerLosses;
  tgt.soldiers -= r.defenderLosses;
  s.attack.rounds += 1;

  const conquered = tgt.soldiers <= 0;
  const failed = !conquered && src.soldiers <= 1;
  const bonus = conquered ? conquestBonus(tgt.initialSoldiers) : 0;

  const kind: EventKind = conquered ? 'CONQUEST' : failed ? 'ATTACK_FAILED' : 'BATTLE_ROUND';
  const diceLine = `[${r.attackerDice.join(',')}] vs [${r.defenderDice.join(',')}]`;
  const text = conquered
    ? `${attackerPlayer.name} conquers ${tgt.name}! Dice ${diceLine}. +${bonus} soldiers gained.`
    : failed
      ? `${attackerPlayer.name}'s attack on ${tgt.name} fails: ${src.name} is down to 1 soldier. Dice ${diceLine}.`
      : `${src.name} vs ${tgt.name}: dice ${diceLine}. Losses: attacker -${r.attackerLosses}, defender -${r.defenderLosses}.`;
  const e = emit(s, events, attackerPid, kind, text, { reason });

  const battle: BattleSnapshot = {
    seq: e.seq,
    round: s.attack.rounds,
    attackerCode: src.code,
    defenderCode: tgt.code,
    attackerName: src.name,
    defenderName: tgt.name,
    attackerOwnerName: attackerPlayer.name,
    defenderOwnerName: defenderPlayer.name,
    attackerDice: r.attackerDice,
    defenderDice: r.defenderDice,
    attackerLosses: r.attackerLosses,
    defenderLosses: r.defenderLosses,
    attackerBefore,
    defenderBefore,
    attackerAfter: src.soldiers,
    defenderAfter: conquered ? 0 : tgt.soldiers,
    conquered,
    failed,
    bonusSoldiers: bonus,
  };
  e.battle = battle;
  e.commentary = templateCommentary(battle);
  e.commentarySource = 'template';
  s.lastBattle = battle;

  if (conquered) {
    tgt.ownerId = attackerPid;
    tgt.soldiers = bonus;
    afterConquest(s, events, attackerPid, defenderPid);
    if (s.status === 'ACTIVE') s.phase = 'POST_ATTACK';
    return 'CONQUERED';
  }
  if (failed) {
    s.attack = null;
    advanceTurn(s, events);
    return 'FAILED';
  }
  return 'CONTINUE';
}

function afterConquest(s: GameState, events: GameEvent[], attackerPid: string, defenderPid: string) {
  const defender = getPlayer(s, defenderPid);
  const attacker = getPlayer(s, attackerPid);
  if (ownedBy(s, defenderPid).length === 0) {
    defender.eliminated = true;
    emit(s, events, defenderPid, 'ELIMINATED', `${defender.name} has lost their last country and is eliminated.`);
  }
  if (ownedBy(s, attackerPid).length === s.countries.length) {
    s.status = 'FINISHED';
    s.winnerId = attackerPid;
    s.outcome = attacker.kind === 'human' ? 'VICTORY' : 'DEFEAT';
    s.attack = null;
    emit(
      s,
      events,
      attackerPid,
      'GAME_OVER',
      attacker.kind === 'human'
        ? `${attacker.name} has conquered the world! Victory!`
        : `${attacker.name} has conquered the world. Game over.`
    );
  } else if (!s.multiplayer && defender.kind === 'human' && defender.eliminated) {
    s.status = 'FINISHED';
    s.outcome = 'DEFEAT';
    s.attack = null;
    emit(s, events, defenderPid, 'GAME_OVER', `${defender.name} has been eliminated. Game over.`);
  }
}

function doStopAttack(s: GameState, events: GameEvent[], pid: string, reason?: string) {
  if (s.phase !== 'ATTACKING' || !s.attack) throw new GameError('No attack is in progress.', 409);
  const tgt = getCountry(s, s.attack.targetId);
  const p = getPlayer(s, pid);
  emit(s, events, pid, 'ATTACK_STOPPED', `${p.name} calls off the attack on ${tgt.name}. Turn ends.`, { reason });
  advanceTurn(s, events);
}

function doEndTurn(s: GameState, events: GameEvent[], pid: string, reason?: string) {
  if (s.phase === 'REINFORCE') throw new GameError('Deploy your reinforcements first.', 409);
  if (s.phase === 'ATTACKING') throw new GameError('Finish or stop the attack first.', 409);
  const p = getPlayer(s, pid);
  const text = s.phase === 'ACTION' ? `${p.name} skips their turn.` : `${p.name} ends their turn.`;
  emit(s, events, pid, 'TURN_END', text, { reason });
  advanceTurn(s, events);
}

// ---------------------------------------------------------------------------
// public: human actions
// ---------------------------------------------------------------------------
export function applyHumanAction(prev: GameState, action: HumanAction, rng: Rng = Math.random) {
  const s = clone(prev);
  const events: GameEvent[] = [];
  assertActive(s);
  const p = currentPlayer(s);
  if (p.kind !== 'human') throw new GameError("It is not your turn yet.", 409);

  switch (action.type) {
    case 'DEPLOY':
      doDeploy(s, events, p.id, action.allocations || {});
      break;
    case 'TRANSFER':
      doTransfer(s, events, p.id, action.fromId, action.toId, Number(action.count));
      break;
    case 'ATTACK':
      doStartAttack(s, events, p.id, action.sourceId, action.targetId);
      break;
    case 'ROLL':
      doBattleRound(s, events, rng);
      break;
    case 'STOP_ATTACK':
      doStopAttack(s, events, p.id);
      break;
    case 'END_TURN':
      doEndTurn(s, events, p.id);
      break;
    default:
      throw new GameError('Unknown action.');
  }
  return { state: s, events };
}

// ---------------------------------------------------------------------------
// public: one NPC step (the client paces these so every move is visible)
// ---------------------------------------------------------------------------
export function npcStep(prev: GameState, rng: Rng = Math.random) {
  const s = clone(prev);
  const events: GameEvent[] = [];
  assertActive(s);
  const p = currentPlayer(s);
  if (p.kind !== 'npc') throw new GameError('It is the human player\'s turn.', 409);
  const strategy: NpcSettings = { ...DEFAULT_NPC_SETTINGS, difficulty: p.difficulty ?? 3, personality: p.personality ?? 'balanced', aggression: p.aggression ?? 50, caution: p.caution ?? 50 };

  switch (s.phase) {
    case 'REINFORCE': {
      const plan = planReinforcements(s.countries, p.id, s.reinforcementsLeft, strategy);
      doDeploy(s, events, p.id, plan.allocations, plan.reason);
      break;
    }
    case 'ACTION': {
      // 1) fortify thin holdings (a transfer, allowed because no attack is in progress)
      const fort = planFortify(s.countries, p.id, strategy);
      if (fort) {
        fort.moves.forEach((m, i) =>
          doTransfer(s, events, p.id, m.fromId, m.toId, m.count, i === 0 ? fort.reason : undefined)
        );
      }
      // 2) then decide whether to attack
      const choice = chooseAttack(s.countries, p.id, s.round, strategy);
      if (choice.attack) doStartAttack(s, events, p.id, choice.sourceCode, choice.targetCode, choice.reason);
      else doEndTurn(s, events, p.id, choice.reason);
      break;
    }
    case 'ATTACKING': {
      const atk = s.attack!;
      const src = getCountry(s, atk.sourceId);
      const tgt = getCountry(s, atk.targetId);
      const verdict = shouldStopAttack(src, tgt, s.round, strategy);
      if (atk.rounds > 0 && verdict.stop) {
        doStopAttack(s, events, p.id, verdict.reason);
      } else {
        doBattleRound(s, events, rng, atk.rounds > 0 ? verdict.reason : undefined);
      }
      break;
    }
    case 'POST_ATTACK': {
      const atk = s.attack!;
      const garrison = planGarrison(getCountry(s, atk.sourceId), getCountry(s, atk.targetId), s.countries);
      if (garrison.move) {
        doTransfer(s, events, p.id, garrison.move.fromId, garrison.move.toId, garrison.move.count, garrison.reason);
      }
      // end the turn silently (the transfer event, or the conquest event, already tells the story)
      advanceTurn(s, events);
      break;
    }
  }
  return { state: s, events };
}
