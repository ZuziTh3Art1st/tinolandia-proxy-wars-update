"use client";

import { useEffect, useState } from "react";
import { GameState, Player } from "@/lib/types";
import { Flag } from "@/components/Flag";

function forcesFor(game: GameState, playerId: string) {
  const countries = game.countries.filter((country) => country.ownerId === playerId);
  return { countries, troops: countries.reduce((total, country) => total + country.soldiers, 0) };
}

export function GameCommandOverview({ game, player, currentPlayer }: { game: GameState; player?: Player; currentPlayer?: Player }) {
  const [open, setOpen] = useState(false);
  const rivals = game.players.filter((commander) => commander.id !== player?.id && !commander.eliminated);
  const myForces = player ? forcesFor(game, player.id) : null;
  const alliances = game.alliances ?? [];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <section className="grid gap-3 rounded-lg border border-[var(--line)] bg-gradient-to-br from-white to-[#f3f6f4] p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] sm:p-4">
        <div className="min-w-0 rounded-md border border-[#d8d4f3] bg-[#f7f6ff] p-3">
          <p className="eyebrow">YOUR COMMAND</p>
          {player ? <>
            <div className="mt-1 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: player.color }} /><h2 className="truncate text-sm font-bold">{player.name}</h2><span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-[var(--accent-dark)]">YOU</span></div>
            <div className="mt-2 flex flex-wrap gap-1.5">{myForces?.countries.length ? myForces.countries.map((country) => <span key={country.code} className="inline-flex items-center gap-1 rounded-full border border-[#e3e0f4] bg-white px-2 py-1 text-[10px] font-medium"><Flag code={country.code} size={40} className="h-3 w-4" />{country.name}<b>{country.soldiers}</b></span>) : <span className="text-[10px] text-[var(--muted-ink)]">No nations under your control</span>}</div>
            <p className="mt-2 text-[10px] text-[var(--muted-ink)]">{myForces?.countries.length ?? 0} nations · {myForces?.troops ?? 0} troops</p>
          </> : <p className="mt-1 text-xs text-[var(--muted-ink)]">Spectating · your command will appear here when you join.</p>}
        </div>

        <div className="min-w-0 rounded-md border border-[var(--line)] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">OPPOSING COMMANDERS</p><p className="mt-1 text-[10px] text-[var(--muted-ink)]">{currentPlayer ? `${currentPlayer.name} has the current move` : "Campaign rivals"}</p></div><button type="button" onClick={() => setOpen(true)} className="min-h-9 rounded-md border border-[var(--line)] bg-[#f8f9f8] px-3 py-2 text-[10px] font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]">Alliance overview</button></div>
          {rivals.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{rivals.map((rival) => {
            const forces = forcesFor(game, rival.id);
            return <li key={rival.id} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] ${rival.id === currentPlayer?.id ? "border-amber-300 bg-amber-50" : "border-[var(--line)] bg-[#f8f9f8]"}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: rival.color }} /><span className="max-w-32 truncate font-medium">{rival.name}</span><span className="text-[var(--muted-ink)]">{forces.countries.length}n · {forces.troops}t</span>{rival.id === currentPlayer?.id && <span className="font-bold text-amber-800">NOW</span>}</li>;
          })}</ul> : <p className="mt-2 text-xs text-[var(--muted-ink)]">No active rival commanders remain.</p>}
        </div>
      </section>

      {open && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#07171c]/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="alliance-overview-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--line)] bg-white p-5 shadow-2xl sm:p-6">
          <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4"><div><p className="eyebrow">DIPLOMACY DESK</p><h2 id="alliance-overview-title" className="section-title mt-1 text-2xl">Alliance overview</h2><p className="mt-1 text-xs text-[var(--muted-ink)]">See who commands each nation and where the current conflict stands.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close alliance overview" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] text-lg hover:bg-[#f4f6f5]">×</button></header>
          {alliances.length ? <div className="mt-4 space-y-2">{alliances.map((alliance) => { const first = game.players.find((commander) => commander.id === alliance.playerA); const second = game.players.find((commander) => commander.id === alliance.playerB); return <div key={`${alliance.playerA}-${alliance.playerB}`} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-950">Non-aggression pact · active</p><p className="mt-1 text-xs leading-5 text-emerald-900">{first?.name ?? "Commander"} and {second?.name ?? "Commander"} cannot attack one another while this pact remains active.</p></div>; })}</div> : <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-950">No formal alliances are active</p><p className="mt-1 text-xs leading-5 text-amber-900">All other commanders are independent rivals in this campaign.</p></div>}
          {game.attack && <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">Active conflict: {game.countries.find((country) => country.code === game.attack?.sourceId)?.name} is attacking {game.countries.find((country) => country.code === game.attack?.targetId)?.name}.</p>}
          <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--muted-ink)]">Commanders and territory</h3>
          <ul className="mt-2 space-y-2">{game.players.map((commander) => {
            const forces = forcesFor(game, commander.id);
            const isYou = commander.id === player?.id;
            return <li key={commander.id} className={`rounded-lg border p-3 ${isYou ? "border-[#d8d4f3] bg-[#f8f7ff]" : "border-[var(--line)] bg-white"}`}><div className="flex flex-wrap items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: commander.color }} /><span className="text-sm font-semibold">{commander.name}{isYou ? " · You" : ""}</span>{commander.eliminated && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">ELIMINATED</span>}{commander.id === currentPlayer?.id && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-900">CURRENT TURN</span>}<span className="ml-auto text-[10px] text-[var(--muted-ink)]">{forces.countries.length} nations · {forces.troops} troops</span></div><div className="mt-2 flex flex-wrap gap-1">{forces.countries.map((country) => <span key={country.code} className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-2 py-1 text-[10px]"><Flag code={country.code} size={40} className="h-3 w-4" />{country.name} <b>{country.soldiers}</b></span>)}{!forces.countries.length && <span className="text-[10px] text-[var(--muted-ink)]">No territories</span>}</div></li>;
          })}</ul>
          <button type="button" onClick={() => setOpen(false)} className="mt-5 w-full rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Back to campaign</button>
        </section>
      </div>}
    </>
  );
}
