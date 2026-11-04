"use client";

import { useState } from "react";
import Link from "next/link";
import { joinGameApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { GameState } from "@/lib/types";

export function MultiplayerPanel({ game, gameId }: { game: GameState; gameId: string }) {
  const { user } = useAuth();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const joined = !!user && (game.participantUids ?? []).includes(user.uid);
  const openSeats = game.players.filter((player) => player.kind === "npc" && !player.eliminated).length;

  if (!game.multiplayer) return null;
  const copyInvite = async () => {
    const url = `${window.location.origin}/game/${gameId}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Invite link copied. Send it to a friend.");
    } catch {
      window.prompt("Copy this multiplayer campaign link", url);
    }
  };
  const join = async () => {
    setBusy(true);
    setNotice("");
    try {
      await joinGameApi(gameId);
      setNotice("You joined the campaign. Your commander is ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not join this campaign.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4">
      <p className="eyebrow">MULTIPLAYER CAMPAIGN</p>
      <h2 className="mt-1 text-sm font-semibold">Play this world with friends</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted-ink)]">Friends who join claim an open rival nation. Turns are taken in order; NPC commanders keep playing in unclaimed seats.</p>
      {!user ? <Link href="/login" className="mt-3 inline-flex rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">Sign in to join</Link> : joined ? (
        <button type="button" onClick={() => void copyInvite()} className="mt-3 rounded-md border border-[var(--line)] px-3 py-2 text-xs font-semibold">Copy invite link</button>
      ) : openSeats === 0 ? (
        <p className="mt-3 text-xs text-[var(--muted-ink)]">All commander seats have been claimed.</p>
      ) : game.status === "ACTIVE" ? (
        <button type="button" disabled={busy} onClick={() => void join()} className="mt-3 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Joining…" : `Join as a commander · ${openSeats} seats open`}</button>
      ) : <p className="mt-3 text-xs text-[var(--muted-ink)]">This campaign has ended.</p>}
      {notice && <p role="status" className="mt-2 text-xs text-[var(--muted-ink)]">{notice}</p>}
    </section>
  );
}
