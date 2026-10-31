export type Rng = () => number;

/** "Up to X million" tiers from the exam brief. Anything above 150m = 9 soldiers. */
const POPULATION_TIERS: Array<[number, number]> = [
  [5_000_000, 1],
  [10_000_000, 2],
  [25_000_000, 3],
  [50_000_000, 4],
  [75_000_000, 5],
  [100_000_000, 6],
  [125_000_000, 7],
  [150_000_000, 8],
];

export function soldiersFromPopulation(population: number): number {
  for (const [limit, soldiers] of POPULATION_TIERS) {
    if (population <= limit) return soldiers;
  }
  return 9;
}

export function rollDie(rng: Rng): number {
  return Math.floor(rng() * 6) + 1;
}

/** Soldiers gained on conquest = Max(2, floor(conquered country's soldier value / 2)). */
export function conquestBonus(soldierValue: number): number {
  return Math.max(2, Math.floor(soldierValue / 2));
}

export interface RoundResult {
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
}

/**
 * ONE round of dice.
 *  - the attacker must leave one soldier behind => it can commit (attacker - 1)
 *  - dice per side = min(attacker's available soldiers, defender's soldiers)
 *  - die i fights die i: higher roll wins, the lower die's soldier dies, a tie kills nobody
 */
export function resolveRound(attackerSoldiers: number, defenderSoldiers: number, rng: Rng): RoundResult {
  const dice = Math.max(0, Math.min(attackerSoldiers - 1, defenderSoldiers));
  const result: RoundResult = { attackerDice: [], defenderDice: [], attackerLosses: 0, defenderLosses: 0 };
  for (let i = 0; i < dice; i++) {
    const a = rollDie(rng);
    const d = rollDie(rng);
    result.attackerDice.push(a);
    result.defenderDice.push(d);
    if (a > d) result.defenderLosses++;
    else if (d > a) result.attackerLosses++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Win-probability estimate (used by the NPC brain).
// P(attacker eventually conquers) if it keeps rolling until it wins or is left with 1.
// Exact dynamic programming for normal-sized stacks, Monte Carlo for huge ones.
// ---------------------------------------------------------------------------

const P_WIN = 15 / 36; // P(a > b) for two d6
const P_TIE = 6 / 36;

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const outcomeCache = new Map<number, Array<{ defLoss: number; attLoss: number; p: number }>>();
function outcomes(k: number) {
  let list = outcomeCache.get(k);
  if (list) return list;
  list = [];
  for (let x = 0; x <= k; x++) {
    for (let y = 0; y <= k - x; y++) {
      const z = k - x - y;
      const p =
        (factorial(k) / (factorial(x) * factorial(y) * factorial(z))) *
        Math.pow(P_WIN, x) *
        Math.pow(P_WIN, y) *
        Math.pow(P_TIE, z);
      list.push({ defLoss: x, attLoss: y, p });
    }
  }
  outcomeCache.set(k, list);
  return list;
}

const probCache = new Map<string, number>();

function exactProb(a: number, d: number): number {
  if (d <= 0) return 1;
  if (a <= 1) return 0;
  const key = `${a},${d}`;
  const hit = probCache.get(key);
  if (hit !== undefined) return hit;
  const k = Math.min(a - 1, d);
  const stay = Math.pow(P_TIE, k); // all ties: state unchanged
  let sum = 0;
  for (const o of outcomes(k)) {
    if (o.defLoss === 0 && o.attLoss === 0) continue;
    sum += o.p * exactProb(a - o.attLoss, d - o.defLoss);
  }
  const result = sum / (1 - stay);
  probCache.set(key, result);
  return result;
}

export function conquerProbability(attacker: number, defender: number): number {
  if (defender <= 0) return 1;
  if (attacker <= 1) return 0;
  if (Math.min(attacker - 1, defender) <= 20) return exactProb(attacker, defender);

  const key = `mc:${attacker},${defender}`;
  const hit = probCache.get(key);
  if (hit !== undefined) return hit;
  const runs = 400;
  let wins = 0;
  for (let i = 0; i < runs; i++) {
    let a = attacker;
    let d = defender;
    while (a > 1 && d > 0) {
      const r = resolveRound(a, d, Math.random);
      a -= r.attackerLosses;
      d -= r.defenderLosses;
    }
    if (d <= 0) wins++;
  }
  const p = wins / runs;
  probCache.set(key, p);
  return p;
}
