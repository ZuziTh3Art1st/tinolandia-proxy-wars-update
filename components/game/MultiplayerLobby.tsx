"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startLobbyApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { getCountryInfo } from "@/lib/countries";
import { useGame } from "@/lib/useGame";

export function MultiplayerLobby({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { game, status } = useGame(gameId);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const host = !!game && !!user && game.ownerUid === user.uid;
  const participant = !!game && !!user && (game.participantUids ?? []).includes(user.uid);

  useEffect(() => {
    if (game?.status === "ACTIVE") router.replace(`/game/${encodeURIComponent(gameId)}`);
  }, [game?.status, gameId, router]);

  const copyCode = async () => {
    const code = game?.lobbyCode ?? "";
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Lobby code copied. Send it to your friends.");
    } catch {
      window.prompt("Copy this lobby code", code);
    }
  };
  const start = async () => {
    setBusy(true);
    setNotice("");
    try {
      await startLobbyApi(gameId);
      router.replace(`/game/${encodeURIComponent(gameId)}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start this campaign.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <p className="mt-8 text-center text-sm text-[var(--muted-ink)]">Opening lobby…</p>;
  if (status !== "ready" || !game) return <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6 text-center"><h2 className="font-semibold">Lobby not found</h2><p className="mt-2 text-sm text-[var(--muted-ink)]">Check the invite link or return to the multiplayer page and enter the code again.</p><Link href="/multiplayer" className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Back to multiplayer</Link></section>;
  if (game.status !== "LOBBY") return <p className="mt-8 text-center text-sm text-[var(--muted-ink)]">Campaign started. Opening the game…</p>;

  const seats = game.players.map((player) => ({
    player,
    country: getCountryInfo(game.startingCountries?.[player.id] ?? ""),
  }));
  const joined = seats.filter(({ player }) => player.kind === "human");
  const open = seats.filter(({ player }) => player.kind === "npc");

  return <section className="mx-auto mt-7 max-w-4xl rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
      <div><p className="eyebrow">MULTIPLAYER LOBBY · WAITING TO START</p><h2 className="section-title mt-1 text-2xl">Gather your commanders</h2><p className="mt-2 text-sm text-[var(--muted-ink)]">Share the lobby code. Players who join claim an available nation before the campaign begins.</p></div>
      <div className="rounded-lg border border-[var(--line)] bg-[#f7f8f6] px-4 py-3 text-center"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--muted-ink)]">JOIN CODE</p><p className="mt-1 font-mono text-2xl font-bold tracking-[.22em] text-[var(--accent-dark)]">{game.lobbyCode}</p><button type="button" onClick={() => void copyCode()} className="mt-2 rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold">Copy code</button></div>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">{joined.length} commander{joined.length === 1 ? "" : "s"} joined · {open.length} seats open</p><p className="text-xs text-[var(--muted-ink)]">{participant ? "You are in this lobby." : "Sign in with the invited account to join."}</p></div>
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {seats.map(({ player, country }) => <li key={player.id} className={`flex items-center gap-3 rounded-lg border p-3 ${player.kind === "human" ? "border-emerald-200 bg-emerald-50/50" : "border-dashed border-[var(--line)] bg-[#fafbf9]"}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: player.color }}>{player.kind === "human" ? player.name.slice(0, 1).toUpperCase() : "· · ·"}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{player.kind === "human" ? player.name : "Open seat"}</span><span className="mt-0.5 block text-xs text-[var(--muted-ink)]">{player.kind === "human" ? country?.name ?? "Commander joined" : "NPC takes over if left open"}</span></span>
        {player.kind === "human" && <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[9px] font-semibold text-emerald-800">READY</span>}
      </li>)}
    </ul>
    {notice && <p role="status" className="mt-4 text-sm text-[var(--muted-ink)]">{notice}</p>}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5"><p className="max-w-xl text-xs leading-5 text-[var(--muted-ink)]">As host, you can start with any number of friends. Unclaimed seats become NPC commanders when the game begins.</p>{host ? <button type="button" disabled={busy} onClick={() => void start()} className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Starting campaign…" : "Start campaign"}</button> : <Link href="/" className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm font-semibold">Back to campaign desk</Link>}</div>
  </section>;
}
