"use client";

import React from "react";
import { GameEvent, GameState } from "@/lib/types";
import { Flag } from "../Flag";

type Outcome = "win" | "lose" | "tie";

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string | number; detail: string; tone?: "neutral" | "good" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-800" : tone === "bad" ? "text-rose-700" : "text-[var(--ink)]";
  return <div className="min-w-0 rounded-md border border-[var(--line)] bg-white p-3"><p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-ink)]">{label}</p><p className={`mt-1 text-2xl font-semibold leading-none ${toneClass}`}>{value}</p><p className="mt-1 truncate text-[10px] text-[var(--muted-ink)]">{detail}</p></div>;
}

const PIPS: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

function Die({ value, outcome }: { value: number; outcome: Outcome }) {
  const color = outcome === "win" ? "battle-die--win" : outcome === "lose" ? "battle-die--lose" : "battle-die--tie";
  return <div className={`battle-die ${color}`} aria-label={`Rolled ${value}`} title={`Rolled ${value}`} key={value}>
    <div className="battle-die__top"/><div className="battle-die__side"/>
    <div className="battle-die__front">{Array.from({ length: 9 }, (_, i) => <span key={i} className={PIPS[value]?.includes(i + 1) ? "battle-die__pip" : ""}/>)}</div>
  </div>;
}

export function BattleArena({ game, events = [], showCommentary = true, compact = false }: { game: GameState; events?: GameEvent[]; showCommentary?: boolean; compact?: boolean }) {
  const battle = game.lastBattle;
  if (!battle) return <div className={`rounded-md border border-dashed border-[var(--line)] bg-[#f8f9f8] px-4 text-center ${compact ? "py-4" : "py-8"}`}><p className="text-sm font-medium text-[var(--ink)]">No battle has been resolved yet</p><p className="mt-1 text-xs text-[var(--muted-ink)]">When a battle takes place, its forces, dice and losses will appear here.</p></div>;

  const live = !!game.attack && game.phase === "ATTACKING";
  const commentary = events.find((event) => event.battle?.seq === battle.seq)?.commentary;
  const dicePairs = battle.attackerDice.map((attacker, index) => ({ attacker, defender: battle.defenderDice[index] })).filter((pair): pair is { attacker: number; defender: number } => typeof pair.defender === "number");
  const result = live ? "In progress" : battle.conquered ? "Territory conquered" : battle.failed ? "Attack repelled" : "Battle resolved";
  const outcomeTone = live ? "border-sky-200 bg-sky-50 text-sky-800" : battle.conquered ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[var(--line)] bg-white text-[var(--muted-ink)]";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white p-3">
        <div className="flex min-w-0 items-center gap-3"><div className="flex -space-x-1"><Flag code={battle.attackerCode} size={40} className="h-6 w-9 rounded-sm ring-2 ring-white"/><Flag code={battle.defenderCode} size={40} className="h-6 w-9 rounded-sm ring-2 ring-white"/></div><div className="min-w-0"><p className="eyebrow">BATTLE REPORT</p><p className="truncate text-sm font-semibold text-[var(--ink)]">{battle.attackerName} <span className="font-normal text-[var(--muted-ink)]">against</span> {battle.defenderName}</p></div></div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${outcomeTone}`}>{result}</span>
      </div>

      {compact ? <p className="rounded-md bg-[#f8f9f8] px-3 py-2 text-[11px] text-[var(--muted-ink)]"><span className="font-semibold text-[var(--ink)]">Forces</span> {battle.attackerBefore} → {Math.max(0, battle.attackerAfter)} · {battle.defenderBefore} → {Math.max(0, battle.defenderAfter)} <span className="mx-1 text-[var(--line)]">|</span><span className="font-semibold text-[var(--ink)]">Losses</span> {battle.attackerLosses} · {battle.defenderLosses}{battle.conquered ? ` · +${battle.bonusSoldiers} conquest bonus` : ""}</p> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Attacking force" value={`${battle.attackerBefore} → ${Math.max(0, battle.attackerAfter)}`} detail={battle.attackerOwnerName} tone={battle.attackerLosses ? "bad" : "neutral"}/>
        <Metric label="Defending force" value={`${battle.defenderBefore} → ${Math.max(0, battle.defenderAfter)}`} detail={battle.defenderOwnerName} tone={battle.conquered ? "good" : battle.defenderLosses ? "bad" : "neutral"}/>
        <Metric label="Attacker losses" value={battle.attackerLosses} detail="Soldiers lost" tone={battle.attackerLosses ? "bad" : "good"}/>
        <Metric label="Defender losses" value={battle.defenderLosses} detail={battle.conquered ? `Conquest bonus +${battle.bonusSoldiers}` : "Soldiers lost"} tone={battle.conquered ? "good" : battle.defenderLosses ? "bad" : "neutral"}/>
      </div>}

      <div className={`rounded-md border border-[var(--line)] bg-[#f8f9f8] ${compact ? "p-2" : "p-3"}`}>
        <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-ink)]">Dice comparison</p><p className="text-[10px] text-[var(--muted-ink)]">Round {battle.round}</p></div>
        {dicePairs.length ? <div key={battle.seq} className="flex flex-wrap items-center gap-2">
          {dicePairs.map((pair, index) => <div key={index} className="flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-2 py-1.5"><span className="mr-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-ink)]">Pair {index + 1}</span><Die key={`a-${battle.seq}-${battle.round}-${index}-${pair.attacker}`} value={pair.attacker} outcome={pair.attacker > pair.defender ? "win" : pair.attacker < pair.defender ? "lose" : "tie"}/><span className="text-[9px] text-[var(--muted-ink)]">vs</span><Die key={`d-${battle.seq}-${battle.round}-${index}-${pair.defender}`} value={pair.defender} outcome={pair.defender > pair.attacker ? "win" : pair.defender < pair.attacker ? "lose" : "tie"}/></div>)}
        </div> : <p className="text-xs text-[var(--muted-ink)]">Dice are shown after the first roll.</p>}
      </div>

      {showCommentary && commentary && <div className="rounded-md border border-[#d9e4df] bg-[#f1f6f3] px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-ink)]">Battle commentary</p><p className="mt-1 text-sm leading-5 text-[var(--ink)]">{commentary}</p></div>}
    </div>
  );
}
