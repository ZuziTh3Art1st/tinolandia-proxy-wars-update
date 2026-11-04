"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCountryInfo } from "@/lib/countries";
import { useAuth } from "@/lib/AuthContext";
import { GameState } from "@/lib/types";
import { Flag } from "@/components/Flag";

interface CampaignRow extends GameState { id: string }

export default function PlaythroughsPage() {
  const { user, loading } = useAuth();
  const [games, setGames] = useState<CampaignRow[] | null>(null);

  useEffect(() => {
    if (!user) { setGames([]); return; }
    setGames(null);
    let owned: CampaignRow[] | null = null;
    let joined: CampaignRow[] | null = null;
    const update = () => {
      if (owned === null || joined === null) return;
      const byId = new Map<string, CampaignRow>();
      [...owned, ...joined].forEach((game) => byId.set(game.id, game));
      setGames([...byId.values()]
        .filter((game) => game.status === "FINISHED")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    const ownedQuery = query(collection(db, "games"), where("ownerUid", "==", user.uid));
    const joinedQuery = query(collection(db, "games"), where("participantUids", "array-contains", user.uid));
    const offOwned = onSnapshot(ownedQuery, (snapshot) => {
      owned = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as GameState) }));
      update();
    }, (error) => { console.error("Owned campaign history subscription failed:", error); owned = []; update(); });
    const offJoined = onSnapshot(joinedQuery, (snapshot) => {
      joined = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as GameState) }));
      update();
    }, (error) => { console.error("Joined campaign history subscription failed:", error); joined = []; update(); });
    return () => { offOwned(); offJoined(); };
  }, [user]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
          <div><p className="eyebrow">CAMPAIGN ARCHIVE</p><h1 className="section-title mt-1 text-3xl">Old campaigns</h1><p className="mt-2 text-sm text-[var(--muted-ink)]">Every completed operation, newest first.</p></div>
          <Link href="/" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Back to campaign desk</Link>
        </header>
        <nav aria-label="Campaign tools" className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/commanders" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">NPC difficulty</Link>
          <Link href="/multiplayer" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">Multiplayer</Link>
        </nav>

        {loading ? <p className="mt-8 text-sm text-[var(--muted-ink)]">Checking your commander profile…</p> : !user ? (
          <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6"><h2 className="text-lg font-semibold">Sign in to view your archive</h2><p className="mt-2 text-sm text-[var(--muted-ink)]">Completed campaigns you started or joined appear here.</p><Link href="/login" className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Commander sign in</Link></section>
        ) : games === null ? <p className="mt-8 text-sm text-[var(--muted-ink)]">Loading your playthroughs…</p> : games.length === 0 ? (
          <section className="mt-8 rounded-lg border border-dashed border-[var(--line)] bg-white/70 p-8 text-center"><p className="text-sm font-semibold">No completed campaigns yet</p><p className="mt-2 text-sm text-[var(--muted-ink)]">Your finished campaigns will appear here in date order.</p><Link href="/" className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Start a campaign</Link></section>
        ) : <section className="mt-6" aria-label="Completed campaigns">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{games.length} completed {games.length === 1 ? "campaign" : "campaigns"}</h2><span className="text-xs text-[var(--muted-ink)]">Newest to oldest</span></div>
          <ol className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
            {games.map((game) => {
              const myCommander = game.players.find((player) => player.uid === user.uid) ?? game.players.find((player) => player.id === "player" && game.ownerUid === user.uid);
              const myCountryCode = myCommander ? game.startingCountries?.[myCommander.id] ?? game.humanCountry : game.humanCountry;
              const home = getCountryInfo(myCountryCode);
              const starts = game.startingCountries ? Object.values(game.startingCountries) : game.countries.map((country) => country.code);
              const countries = [...new Set(starts)].map((code) => getCountryInfo(code)?.name ?? code);
              const victory = game.winnerId ? game.winnerId === myCommander?.id : game.outcome === "VICTORY";
              return <li key={game.id}>
                <article className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <Flag code={myCountryCode} size={64} className="h-10 w-14 shrink-0 rounded-sm shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-base font-semibold">{home?.name ?? game.humanCountry}</h3><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${victory ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-700"}`}>{victory ? "Victory" : "Defeat"}</span>{game.multiplayer && <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">Multiplayer</span>}</div>
                      <p className="mt-1 text-xs text-[var(--muted-ink)]">Round {game.round} · {game.players.length} commanders · {new Date(game.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/game/${encodeURIComponent(game.id)}/replay`} className="rounded-md bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white">Open replay</Link>
                  </div>
                  <details className="mt-4 border-t border-[var(--line)] pt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-[var(--accent-dark)]">Starting nations ({countries.length})</summary>
                    <ul className="mt-2 flex flex-wrap gap-1.5">{countries.map((country) => <li key={country} className="rounded-full border border-[var(--line)] bg-[#f8f9f8] px-2.5 py-1 text-[10px] text-[var(--muted-ink)]">{country}</li>)}</ul>
                  </details>
                </article>
              </li>;
            })}
          </ol>
        </section>}
      </div>
    </main>
  );
}
