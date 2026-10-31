import { CountryState } from './types';
import { conquerProbability, conquestBonus } from './rules';
import { DEFAULT_NPC_SETTINGS, NpcSettings } from './npcProfiles';

/**
 * NPC strategy (identical for every NPC). It plays to win:
 *  - concentrates reinforcements into one strike base, only enough defence elsewhere to avoid being picked off
 *  - scores every (own country -> enemy country) pair by exact conquest probability and payoff
 *    (territory gained, armies destroyed, rivals eliminated)
 *  - attacks only with at least even-ish odds (the bar relaxes in long games so nobody stalls forever)
 *  - withdraws mid-battle when the odds collapse
 *  - garrisons a freshly conquered country so it is not instantly retaken
 */

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Minimum conquest probability required to start an attack. Relaxes from round 5 so games always finish. */
export function attackThreshold(round: number, settings: NpcSettings = DEFAULT_NPC_SETTINGS): number {
  const personality = settings.personality === 'aggressive' ? -0.1 : settings.personality === 'defensive' ? 0.12 : settings.personality === 'opportunist' ? 0.025 : 0;
  const skill = (settings.difficulty - 3) * 0.045;
  const aggression = (settings.aggression - 50) / 500;
  const caution = (settings.caution - 50) / 400;
  return Math.max(0.15, Math.min(0.88, 0.5 - 0.02 * Math.max(0, round - 5) + personality + skill - aggression + caution));
}
function stopThreshold(round: number, settings: NpcSettings): number {
  const caution = (settings.caution - 50) / 500;
  return Math.max(0.08, attackThreshold(round, settings) - 0.2 + caution);
}

const own = (countries: CountryState[], pid: string) => countries.filter((c) => c.ownerId === pid);
const enemies = (countries: CountryState[], pid: string) => countries.filter((c) => c.ownerId !== pid);

function strongest(list: CountryState[]): CountryState {
  return [...list].sort((a, b) => b.soldiers - a.soldiers || b.initialSoldiers - a.initialSoldiers)[0];
}

// ---------------------------------------------------------------------------
// Reinforcements
// ---------------------------------------------------------------------------
export function planReinforcements(
  countries: CountryState[],
  pid: string,
  n: number,
  settings: NpcSettings = DEFAULT_NPC_SETTINGS
): { allocations: Record<string, number>; reason: string } {
  const mine = own(countries, pid);
  const foes = enemies(countries, pid);
  const allocations: Record<string, number> = {};
  const add = (code: string, k: number) => (allocations[code] = (allocations[code] || 0) + k);

  const base = strongest(mine);
  let remaining = n;
  const notes: string[] = [];

  // 1) Thin holdings (1 soldier) get +1 so a single lucky roll cannot take them.
  let shored = 0;
  for (const c of mine) {
    if (c.code !== base.code && c.soldiers < 2 && remaining > 0 && (n >= 4 || settings.personality === 'defensive' || settings.caution >= 75)) {
      add(c.code, 1);
      remaining--;
      shored++;
    }
  }
  if (shored > 0) notes.push(`${shored} to thin holdings so they are not picked off`);

  // 2) Enough force in the base to threaten the softest enemy.
  const softest = [...foes].sort((a, b) => a.soldiers - b.soldiers || b.initialSoldiers - a.initialSoldiers)[0];
  let toBase = 0;
  if (softest) {
    const need = Math.max(0, softest.soldiers + 2 - base.soldiers);
    toBase = Math.min(remaining, need);
  }
  if (toBase > 0) {
    add(base.code, toBase);
    remaining -= toBase;
  }

  // 3) Everything else compounds in the base.
  if (remaining > 0) {
    add(base.code, remaining);
    toBase += remaining;
    remaining = 0;
  }

  const baseTotal = allocations[base.code] || 0;
  const head = softest
    ? `Building a strike force in ${base.name} (+${baseTotal}) to threaten ${softest.name} (${softest.soldiers} defenders)`
    : `Stacking ${base.name} (+${baseTotal})`;
  return { allocations, reason: [head, ...notes].join('; ') + '.' };
}

// ---------------------------------------------------------------------------
// Attack selection
// ---------------------------------------------------------------------------
export type AttackChoice =
  | { attack: true; sourceCode: string; targetCode: string; probability: number; reason: string }
  | { attack: false; reason: string };

export function chooseAttack(countries: CountryState[], pid: string, round: number, settings: NpcSettings = DEFAULT_NPC_SETTINGS): AttackChoice {
  const mine = own(countries, pid);
  const foes = enemies(countries, pid);
  if (foes.length === 0) return { attack: false, reason: 'Already controls every nation.' };

  const threshold = attackThreshold(round, settings);
  let best: { src: CountryState; tgt: CountryState; p: number; value: number; bonus: number; eliminates: boolean } | null = null;
  let bestP = 0;

  for (const src of mine) {
    if (src.soldiers < 2) continue;
    for (const tgt of foes) {
      const p = conquerProbability(src.soldiers, tgt.soldiers);
      bestP = Math.max(bestP, p);
      const bonus = conquestBonus(tgt.initialSoldiers);
      const eliminates = countries.filter((c) => c.ownerId === tgt.ownerId).length === 1;
      // Destroying a big enemy stack is worth far more than grabbing a thin country: it is what
      // actually breaks rivals. (Without this term, two big players just trade a 3-soldier
      // country back and forth forever.)
      const kill = tgt.soldiers * 0.25;
      const opportunity = settings.personality === 'opportunist' ? bonus * 0.3 + (eliminates ? 1.25 : 0) : 0;
      const value = p * (2 + bonus + kill + (eliminates ? 1.5 : 0) + opportunity) - (1 - p) * (settings.personality === 'aggressive' ? 1 : 1.5);
      if (p >= threshold && (!best || value > best.value)) best = { src, tgt, p, value, bonus, eliminates };
    }
  }

  if (!best) {
    const hasAttacker = mine.some((c) => c.soldiers >= 2);
    return {
      attack: false,
      reason: hasAttacker
        ? `No attack reaches the ${pct(threshold)} odds bar (best available: ${pct(bestP)}). Holding position and building strength.`
        : 'No country has 2 or more soldiers, so no attack is possible.',
    };
  }

  const extra = best.eliminates ? ' It would also eliminate a rival.' : '';
  return {
    attack: true,
    sourceCode: best.src.code,
    targetCode: best.tgt.code,
    probability: best.p,
    reason: `${best.src.name} (${best.src.soldiers}) vs ${best.tgt.name} (${best.tgt.soldiers}): ${pct(best.p)} chance to conquer, worth +${best.bonus} soldiers.${extra}`,
  };
}

// ---------------------------------------------------------------------------
// Continue or withdraw
// ---------------------------------------------------------------------------
export function shouldStopAttack(
  source: CountryState,
  target: CountryState,
  round: number,
  settings: NpcSettings = DEFAULT_NPC_SETTINGS
): { stop: boolean; probability: number; reason: string } {
  const p = conquerProbability(source.soldiers, target.soldiers);
  if (p < stopThreshold(round, settings)) {
    return {
      stop: true,
      probability: p,
      reason: `Odds have fallen to ${pct(p)} (${source.soldiers} vs ${target.soldiers}); withdrawing to preserve the remaining troops.`,
    };
  }
  return {
    stop: false,
    probability: p,
    reason: `${source.soldiers} vs ${target.soldiers}: still a ${pct(p)} chance to conquer, pressing the attack.`,
  };
}

// ---------------------------------------------------------------------------
// Fortify: when dominating, spread soldiers so thin holdings cannot be retaken cheaply
// ---------------------------------------------------------------------------
export function planFortify(
  countries: CountryState[],
  pid: string,
  settings: NpcSettings = DEFAULT_NPC_SETTINGS
): { moves: Array<{ fromId: string; toId: string; count: number }>; reason: string } | null {
  const mine = own(countries, pid);
  const foes = enemies(countries, pid);
  if (mine.length < 2 || foes.length === 0) return null;

  const threat = Math.max(...foes.map((c) => c.soldiers));
  const desired = threat + (settings.personality === 'defensive' ? 3 : 2);
  const base = strongest(mine);
  // Only fortify when we can afford it (never strip the base below the level we are defending to).
  if (desired > base.soldiers / 2 || desired > 60) return null;

  let spare = base.soldiers - desired;
  const moves: Array<{ fromId: string; toId: string; count: number }> = [];
  for (const c of mine) {
    if (c.code === base.code || c.soldiers >= desired) continue;
    const give = Math.min(desired - c.soldiers, spare);
    if (give > 0) {
      moves.push({ fromId: base.code, toId: c.code, count: give });
      spare -= give;
    }
  }
  if (moves.length === 0) return null;
  return {
    moves,
    reason: `The strongest rival stack is ${threat}, so thin holdings are being fortified to ${desired} from ${base.name} to stop them being retaken cheaply.`,
  };
}

// ---------------------------------------------------------------------------
// Garrison after a conquest
// ---------------------------------------------------------------------------
export function planGarrison(
  source: CountryState,
  conquered: CountryState,
  countries: CountryState[]
): { move: { fromId: string; toId: string; count: number } | null; reason: string } {
  // Size the garrison against the strongest rival stack so the new country is not retaken next turn,
  // but only when the source can afford it (otherwise fall back to a token garrison of 3).
  const threat = Math.max(0, ...enemies(countries, conquered.ownerId).map((c) => c.soldiers));
  let want = 3;
  if (threat + 2 > want && threat + 2 <= source.soldiers / 2 && threat + 2 <= 60) want = threat + 2;

  if (conquered.soldiers < want && source.soldiers > 2) {
    const count = Math.min(want - conquered.soldiers, source.soldiers - 2);
    if (count >= 1) {
      return {
        move: { fromId: source.code, toId: conquered.code, count },
        reason: `${conquered.name} holds only ${conquered.soldiers} and the strongest rival stack is ${threat}; sending ${count} from ${source.name} so it is not retaken straight away.`,
      };
    }
  }
  return { move: null, reason: `${conquered.name} is adequately held (${conquered.soldiers}); keeping ${source.name} strong for the next attack.` };
}
