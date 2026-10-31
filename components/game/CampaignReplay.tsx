"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GameEvent, GameState } from "@/lib/types";
import { BattleArena } from "@/components/game/BattleArena";

const panel = "rounded-lg border border-[var(--line)] bg-white p-4 shadow-[0_2px_10px_rgba(28,45,46,.035)] sm:p-5";

export function CampaignReplay({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const offGame = onSnapshot(doc(db, "games", gameId), (snapshot) => {
      if (!snapshot.exists()) { setStatus("missing"); return; }
      setGame(snapshot.data() as GameState);
      setStatus("ready");
    }, () => setStatus("error"));
    const offEvents = onSnapshot(query(collection(db, "games", gameId, "events"), orderBy("seq", "asc")), (snapshot) => {
      setEvents(snapshot.docs.map((entry) => entry.data() as GameEvent));
    }, () => setStatus("error"));
    return () => { offGame(); offEvents(); };
  }, [gameId]);

  useEffect(() => {
    if (!playing || events.length < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => {
        if (current >= events.length - 1) { setPlaying(false); return current; }
        return current + 1;
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [events.length, index, playing]);

  const event = events[Math.min(index, Math.max(0, events.length - 1))];
  const eventActor = event ? game?.players.find((player) => player.id === event.playerId) : undefined;
  const eventHeading = event?.kind === "BATTLE_ROUND" ? "Battle resolved" : event?.kind === "CONQUEST" ? "Territory conquered" : event?.kind === "ATTACK_FAILED" ? "Attack repelled" : event?.kind === "ELIMINATED" ? "Commander eliminated" : event?.kind === "GAME_OVER" ? "Campaign result" : event?.kind.replaceAll("_", " ").toLowerCase() ?? "Campaign event";
  const replayState = useMemo(() => game && event?.battle ? { ...game, attack: null, lastBattle: event.battle } : null, [event, game]);

  if (status === "loading") return <p className="py-12 text-center text-sm text-[var(--muted-ink)]">Loading campaign replay…</p>;
  if (status === "missing" || status === "error" || !game) return <div className={`${panel} text-center`}><p className="text-sm">{status === "missing" ? "This campaign could not be found." : "The campaign history could not be loaded."}</p><Link href="/" className="mt-3 inline-block text-sm text-[var(--accent-dark)] underline">Return to campaign desk</Link></div>;

  return (
    <div className="space-y-4">
      <section className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
        <div><p className="eyebrow">MATCH REPLAY</p><h2 className="section-title mt-1">Round-by-round campaign history</h2><p className="mt-1 text-xs text-[var(--muted-ink)]">{game.countries.find((country) => country.code === game.humanCountry)?.name ?? game.humanCountry} · {events.length} recorded events · {game.status === "FINISHED" ? game.outcome === "VICTORY" ? "Victory" : "Defeat" : "In progress"}</p></div>
        <Link href={`/game/${gameId}`} className="rounded-md border border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)]">Return to campaign</Link>
      </section>

      {events.length === 0 ? <section className={panel}><p className="text-sm text-[var(--muted-ink)]">No recorded moves are available yet.</p></section> : <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">EVENT {index + 1} OF {events.length}</p><p className="mt-1 text-xs text-[var(--muted-ink)]">Round {event?.round}</p></div><div className="flex items-center gap-2"><button type="button" disabled={index === 0} onClick={() => { setPlaying(false); setIndex((value) => Math.max(0, value - 1)); }} className="rounded border border-[var(--line)] px-3 py-2 text-xs disabled:opacity-40">Previous</button><button type="button" disabled={events.length < 2} onClick={() => { if (index >= events.length - 1) setIndex(0); setPlaying((value) => !value); }} className="min-w-20 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{playing ? "Pause" : index >= events.length - 1 ? "Replay" : "Play"}</button><button type="button" disabled={index >= events.length - 1} onClick={() => { setPlaying(false); setIndex((value) => Math.min(events.length - 1, value + 1)); }} className="rounded border border-[var(--line)] px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div>
          <label className="sr-only" htmlFor="replay-timeline">Move through match history</label><input id="replay-timeline" type="range" min={0} max={events.length - 1} value={index} onChange={(input) => { setPlaying(false); setIndex(Number(input.target.value)); }} className="mt-5 w-full accent-[var(--accent)]" />
          <div className="mt-4 rounded-lg border border-[var(--line)] bg-[#f8f9f8] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">ROUND {event?.round} · {eventActor?.name ?? "CAMPAIGN"}</p><h3 className="mt-1 text-base font-semibold capitalize text-[var(--ink)]">{eventHeading}</h3></div><span className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--muted-ink)]">{index + 1} / {events.length}</span></div><p className="mt-3 border-t border-[var(--line)] pt-3 text-sm leading-6 text-[var(--ink)]">{event?.text}</p>{event?.battle && <p className="mt-2 text-xs font-medium text-[var(--accent-dark)]">{event.battle.attackerName} vs {event.battle.defenderName} · Dice round {event.battle.round}</p>}{event?.reason && <p className="mt-3 border-l-2 border-[var(--accent)]/50 pl-3 text-xs leading-5 text-[var(--muted-ink)]"><strong>Decision basis:</strong> {event.reason}</p>}{event?.commentary && <p className="mt-3 text-xs italic leading-5 text-[var(--muted-ink)]">{event.commentary}</p>}</div>
          {replayState && <div className="mt-4"><p className="eyebrow mb-2">DICE REPLAY</p><BattleArena game={replayState} events={event ? [event] : []} /></div>}
        </section>

        <section className={panel}><div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">TIMELINE</p><h3 className="mt-1 text-sm font-semibold">Recorded moves</h3></div><span className="text-[10px] text-[var(--muted-ink)]">Select any entry</span></div><ol className="max-h-[70vh] space-y-1 overflow-y-auto border-t border-[var(--line)] pt-2">{events.map((entry, itemIndex) => <li key={entry.seq}><button type="button" onClick={() => { setPlaying(false); setIndex(itemIndex); }} aria-current={itemIndex === index ? "step" : undefined} className={`w-full rounded-md border px-2.5 py-2 text-left transition ${itemIndex === index ? "border-[var(--accent)] bg-[#fbf5f1]" : "border-transparent hover:border-[var(--line)] hover:bg-[#f8f9f8]"}`}><span className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-wide text-[var(--accent-dark)]">{entry.kind.replaceAll("_", " ")}</span><span className="shrink-0 text-[9px] text-[var(--muted-ink)]">R{entry.round} · {itemIndex + 1}</span></span><span className="mt-1 block text-[11px] leading-4 text-[var(--ink)]">{entry.text}</span></button></li>)}</ol></section>
      </div>}
    </div>
  );
}
