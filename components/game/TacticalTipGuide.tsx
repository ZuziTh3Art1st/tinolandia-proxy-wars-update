"use client";

import { useMemo, useState } from "react";
import { GameState, Player } from "@/lib/types";
import { markGameAssistedApi } from "@/lib/api";

function buildTip(game: GameState, player?: Player) {
  if (!player) return "Join this campaign to receive command advice.";
  if (game.turnOrder[game.turnIndex] !== player.id) return "While a rival takes their turn, inspect the map and note which of your borders have the fewest soldiers.";
  if (game.phase === "REINFORCE") return `You have ${game.reinforcementsLeft} reinforcements to place. Concentrate them on a border where you can attack next, while keeping at least one soldier behind in each territory.`;
  if (game.phase === "ATTACKING" && game.attack) {
    const source = game.countries.find((country) => country.code === game.attack?.sourceId);
    const target = game.countries.find((country) => country.code === game.attack?.targetId);
    return `${source?.name ?? "Your attacking force"} has ${source?.soldiers ?? 0} soldiers against ${target?.name ?? "the defender"} with ${target?.soldiers ?? 0}. Each roll costs troops; stop the attack if the remaining risk is not worth it.`;
  }
  if (game.phase === "POST_ATTACK") return "You have taken a territory. Move only as many soldiers as needed to secure it; the source territory must keep at least one behind.";
  return "Select one of your territories with a strong force, then choose a weaker rival territory to attack. You get one attack per turn, so transfer soldiers first if you need to prepare.";
}

export function TacticalTipGuide({ game, gameId, player }: { game: GameState; gameId: string; player?: Player }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tip = useMemo(() => buildTip(game, player), [game, player]);
  const assisted = game.assisted || confirmed;

  const revealTip = async () => {
    setError("");
    if (assisted) { setOpen(true); return; }
    setBusy(true);
    try {
      await markGameAssistedApi(gameId);
      window.sessionStorage.setItem(`assisted_${gameId}`, "1");
      setConfirmed(true);
      setOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not mark this campaign as assisted. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
    {open && <section aria-label="Tactical advice" className="w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[#d6d1ef] bg-white p-4 shadow-[0_16px_50px_rgba(13,24,32,.24)]">
      <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">FIELD ADVISER</p><h2 className="mt-1 text-sm font-bold">A thought for this move</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close field adviser" className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-base hover:bg-[#f5f6f5]">×</button></div>
      {assisted ? <><p className="mt-3 text-xs leading-5 text-[var(--ink)]">{tip}</p><p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-medium leading-4 text-amber-950">This campaign is marked assisted. It will not count toward achievements or rankings.</p></> : <><p className="mt-3 text-xs leading-5 text-[var(--muted-ink)]">Use a contextual strategy tip for your current turn.</p><p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-4 text-amber-950">Asking for advice marks this campaign assisted and disables achievements and ranking credit for this run.</p><button type="button" disabled={busy} onClick={() => void revealTip()} className="mt-3 w-full rounded-md bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{busy ? "Preparing advice…" : "Show me a tip"}</button></>}
      {error && <p role="alert" className="mt-2 text-[10px] text-rose-700">{error}</p>}
    </section>}
    <button type="button" aria-expanded={open} onClick={() => setOpen((visible) => !visible)} className="group flex items-center gap-2 rounded-full border border-[#ded9f3] bg-white py-2 pl-2 pr-4 text-xs font-semibold text-[var(--ink)] shadow-lg transition hover:-translate-y-0.5 hover:border-[var(--accent)]"><span aria-hidden="true" className="tactical-tip-beacon grid h-9 w-9 place-items-center rounded-full bg-[#f0edff] text-lg">🧭</span><span>{assisted ? "Field adviser · assisted" : "Need a tactical tip?"}</span></button>
  </div>;
}
