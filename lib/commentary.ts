import { BattleSnapshot } from './types';

/** Instant fallback narration (always available, no network). */
export function templateCommentary(b: BattleSnapshot): string {
  const A = b.attackerName;
  const D = b.defenderName;
  const pick = (opts: string[]) => opts[(b.seq + b.round) % opts.length];

  if (b.conquered) {
    return pick([
      `${D} falls! ${A} plants its flag and claims ${b.bonusSoldiers} fresh troops.`,
      `The last defender of ${D} is gone, and ${A} marches in victorious.`,
      `${D} is overrun; ${A} takes the capital and ${b.bonusSoldiers} soldiers swear allegiance.`,
    ]);
  }
  if (b.failed) {
    return pick([
      `${A} is bled dry down to a single soldier and must call off the assault on ${D}.`,
      `The offensive collapses: ${D} holds the line and ${A} is forced to retreat.`,
    ]);
  }
  if (b.attackerLosses === 0 && b.defenderLosses === 0) {
    return pick([
      `Dice clash, nobody blinks: ${A} and ${D} trade blows and neither side loses a soldier.`,
      `A stalemate on the front. ${A} and ${D} dig in, with no casualties.`,
    ]);
  }
  if (b.defenderLosses > 0 && b.attackerLosses === 0) {
    return pick([
      `${A} strikes hard: ${b.defenderLosses} of ${D}'s soldiers fall without a single loss in return.`,
      `A one-sided exchange. ${D} loses ${b.defenderLosses} while ${A} advances untouched.`,
    ]);
  }
  if (b.attackerLosses > 0 && b.defenderLosses === 0) {
    return pick([
      `${D} repels the charge, costing ${A} ${b.attackerLosses} soldier${b.attackerLosses > 1 ? 's' : ''}.`,
      `${A}'s assault stumbles. ${D} stands firm and ${A} pays ${b.attackerLosses} in blood.`,
    ]);
  }
  return pick([
    `Heavy fighting: ${A} loses ${b.attackerLosses} and ${D} loses ${b.defenderLosses}.`,
    `Both sides bleed. ${A} and ${D} each pay a price in the same exchange.`,
  ]);
}

function buildPrompt(b: BattleSnapshot): string {
  const outcome = b.conquered
    ? `The defender has been CONQUERED and the attacker gains ${b.bonusSoldiers} soldiers.`
    : b.failed
      ? 'The attack has collapsed: the attacker is down to 1 soldier and must withdraw.'
      : 'The battle is still going.';
  return [
    'Write concise, natural match commentary for a fictional strategy game.',
    'Use one or two short factual sentences, no more than 40 words.',
    'Use only the facts given. Do not invent numbers. Avoid theatrical language, emojis, hashtags, and quotation marks.',
    '',
    `Attacker: ${b.attackerName}, commanded by ${b.attackerOwnerName}, had ${b.attackerBefore} soldiers.`,
    `Defender: ${b.defenderName}, commanded by ${b.defenderOwnerName}, had ${b.defenderBefore} soldiers.`,
    `Dice (attacker): ${b.attackerDice.join(', ') || 'none'}`,
    `Dice (defender): ${b.defenderDice.join(', ') || 'none'}`,
    `Result: attacker lost ${b.attackerLosses}, defender lost ${b.defenderLosses}. Attacker now has ${b.attackerAfter}, defender now has ${Math.max(0, b.defenderAfter)}.`,
    outcome,
  ].join('\n');
}

/**
 * LLM narration through Groq's OpenAI-compatible Chat Completions API (no SDK needed).
 * Returns null on any failure/timeout so callers keep the template text.
 */
export async function aiCommentary(b: BattleSnapshot, timeoutMs = 4500): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You narrate fictional strategy-game battles in a concise, neutral, human-sounding style.' },
          { role: 'user', content: buildPrompt(b) },
        ],
        max_completion_tokens: 120,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn('Groq commentary failed:', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data: any = await res.json();
    const text: string = (typeof data?.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content : '')
      .trim()
      .replace(/^["'“]+|["'”]+$/g, '');
    return text ? text.slice(0, 320) : null;
  } catch (err) {
    console.warn('Groq commentary error:', (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
