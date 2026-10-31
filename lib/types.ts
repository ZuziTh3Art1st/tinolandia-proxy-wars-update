import type { NpcPersonality } from './npcProfiles';

export type PlayerKind = 'human' | 'npc';

export interface Player {
  id: string; // 'player' | 'npc_1' ... 'npc_9'
  name: string;
  kind: PlayerKind;
  color: string;
  eliminated: boolean;
  difficulty?: number;
  personality?: NpcPersonality;
  aggression?: number;
  caution?: number;
}

export interface CountryState {
  code: string; // ISO alpha-2, doubles as the id
  name: string;
  population: number;
  initialSoldiers: number; // the country's "soldier value" from the population table
  soldiers: number;
  ownerId: string;
  /** Number of battle rounds this formation has participated in. Informational; does not alter dice. */
  battleRounds?: number;
}

/**
 * REINFORCE   - start of turn (round 2+): new soldiers must be deployed
 * ACTION      - may transfer soldiers, launch ONE attack, or end the turn
 * ATTACKING   - an attack is in progress (roll / stop). Transfers are locked.
 * POST_ATTACK - the attack conquered a country; may transfer soldiers, then end turn
 */
export type Phase = 'REINFORCE' | 'ACTION' | 'ATTACKING' | 'POST_ATTACK';

export interface AttackState {
  sourceId: string; // country code
  targetId: string; // country code
  rounds: number; // dice rounds fought so far
}

export interface BattleSnapshot {
  seq: number;
  round: number; // dice round within this attack (1-based)
  attackerCode: string;
  defenderCode: string;
  attackerName: string;
  defenderName: string;
  attackerOwnerName: string;
  defenderOwnerName: string;
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
  attackerBefore: number;
  defenderBefore: number;
  attackerAfter: number;
  defenderAfter: number;
  conquered: boolean;
  failed: boolean; // attacker fell to 1 soldier, attack ends
  bonusSoldiers: number; // soldiers awarded on conquest
}

export type EventKind =
  | 'SYSTEM'
  | 'TURN_START'
  | 'REINFORCE'
  | 'TRANSFER'
  | 'ATTACK_START'
  | 'BATTLE_ROUND'
  | 'CONQUEST'
  | 'ATTACK_FAILED'
  | 'ATTACK_STOPPED'
  | 'TURN_END'
  | 'ELIMINATED'
  | 'GAME_OVER';

export interface GameEvent {
  seq: number;
  ts: string;
  round: number;
  playerId: string;
  kind: EventKind;
  text: string;
  /** NPC justification for the decision. */
  reason?: string;
  /** Battle narration (AI generated when available, otherwise a template). */
  commentary?: string;
  commentarySource?: 'ai' | 'template';
  battle?: BattleSnapshot;
}

export interface GameState {
  ownerUid: string;
  ownerName: string;
  humanCountry: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'FINISHED';
  outcome?: 'VICTORY' | 'DEFEAT';
  winnerId?: string;
  players: Player[];
  turnOrder: string[];
  turnIndex: number;
  round: number;
  phase: Phase;
  reinforcementsLeft: number;
  attack: AttackState | null;
  lastBattle: BattleSnapshot | null;
  countries: CountryState[];
  eventSeq: number;
  version: number;
}

export type HumanAction =
  | { type: 'DEPLOY'; allocations: Record<string, number> }
  | { type: 'TRANSFER'; fromId: string; toId: string; count: number }
  | { type: 'ATTACK'; sourceId: string; targetId: string }
  | { type: 'ROLL' }
  | { type: 'STOP_ATTACK' }
  | { type: 'END_TURN' };

export type GameAction = HumanAction | { type: 'NPC_STEP' };
