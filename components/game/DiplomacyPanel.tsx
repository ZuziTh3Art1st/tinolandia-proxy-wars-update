"use client";

import { useState } from "react";
import { ApiError, diplomacyApi } from "@/lib/api";
import { GameState } from "@/lib/types";

export function DiplomacyPanel({ game, playerId, gameId }: { game: GameState; playerId: string; gameId: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const activeTurn = game.turnOrder[game.turnIndex] === playerId && game.phase === "ACTION";
  const humans = game.players.filter((player) => player.kind === "human" && !player.eliminated && player.id !== playerId);
  const pacts = (game.alliances ?? []).filter((pact) => pact.playerA === playerId || pact.playerB === playerId);
  const incoming = (game.diplomacyOffers ?? []).filter((offer) => offer.toPlayerId === playerId);
  const outgoing = (game.diplomacyOffers ?? []).filter((offer) => offer.fromPlayerId === playerId);
  const partnerName = (id: string) => game.players.find((player) => player.id === id)?.name ?? "Commander";

  const act = async (operation: "offer" | "accept" | "decline" | "break", options: { targetPlayerId?: string; offerId?: string } = {}) => {
    setBusy(true); setNotice("");
    try { await diplomacyApi(gameId, game.version, operation, options); setNotice("Diplomatic action recorded."); }
    catch (error) { setNotice(error instanceof ApiError && error.stale ? "The campaign changed. This panel is refreshing; try again." : error instanceof Error ? error.message : "Diplomacy could not be updated."); }
    finally { setBusy(false); }
  };

  if (!game.multiplayer) return null;
  return <details className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold"><span>Alliances & diplomacy</span><span className="text-xs font-normal text-[var(--muted-ink)]">{pacts.length} active pact{pacts.length === 1 ? "" : "s"}</span></summary>
    <p className="mt-3 text-xs leading-5 text-[var(--muted-ink)]">Offer a non-aggression pact to another human commander. Allies cannot attack each other; either side can end a pact during their ACTION phase.</p>
    {incoming.length > 0 && <section className="mt-3 space-y-2"><h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-ink)]">Offers for you</h3>{incoming.map((offer) => <div key={offer.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5"><p className="text-xs"><b>{partnerName(offer.fromPlayerId)}</b> proposes a pact.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void act("accept", { offerId: offer.id })} className="rounded-md bg-emerald-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Accept</button><button type="button" disabled={busy} onClick={() => void act("decline", { offerId: offer.id })} className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50">Decline</button></div></div>)}</section>}
    {pacts.length > 0 && <section className="mt-3 space-y-2"><h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-ink)]">Active non-aggression pacts</h3>{pacts.map((pact) => { const other = pact.playerA === playerId ? pact.playerB : pact.playerA; return <div key={`${pact.playerA}-${pact.playerB}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2.5"><p className="text-xs"><b>{partnerName(other)}</b> · pact active</p><button type="button" disabled={!activeTurn || busy} onClick={() => void act("break", { targetPlayerId: other })} className="rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-800 disabled:opacity-45">End pact (your ACTION phase)</button></div>; })}</section>}
    <section className="mt-3 space-y-2"><h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-ink)]">Propose a pact</h3>{humans.length ? humans.map((other) => { const linked = pacts.some((pact) => [pact.playerA, pact.playerB].includes(other.id)) || outgoing.some((offer) => offer.toPlayerId === other.id) || incoming.some((offer) => offer.fromPlayerId === other.id); return <div key={other.id} className="flex items-center justify-between gap-2 rounded-md bg-[#f7f8f6] px-3 py-2"><span className="truncate text-xs font-semibold">{other.name}{linked ? " · connected" : ""}</span><button type="button" disabled={!activeTurn || busy || linked} onClick={() => void act("offer", { targetPlayerId: other.id })} className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-45">{outgoing.some((offer) => offer.toPlayerId === other.id) ? "Offer pending" : pacts.some((pact) => [pact.playerA, pact.playerB].includes(other.id)) ? "Pact active" : "Offer pact"}</button></div>; }) : <p className="rounded-md bg-[#f7f8f6] p-3 text-xs text-[var(--muted-ink)]">No other human commanders have joined this campaign yet.</p>}</section>
    {!activeTurn && <p className="mt-3 text-[10px] text-[var(--muted-ink)]">New offers and pact cancellations are available on your ACTION phase.</p>}
    {notice && <p role="status" className="mt-3 text-xs text-[var(--muted-ink)]">{notice}</p>}
  </details>;
}
