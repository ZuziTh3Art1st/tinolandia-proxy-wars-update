"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import SushiConveyorMenu from "@/components/SushiConveyorMenu";
import type { ConveyorDish } from "@/components/SushiConveyorMenu";
import { db } from "@/lib/firebase";
import { getCountryInfo, flagUrl } from "@/lib/countries";
import { useAuth } from "@/lib/AuthContext";
import { GameState } from "@/lib/types";

interface CampaignRow extends GameState { id: string }

export default function PlaythroughsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
        .filter((game) => {
          const commander = game.players.find((player) => player.uid === user.uid)
            ?? game.players.find((player) => player.id === "player" && game.ownerUid === user.uid);
          const countryCode = commander
            ? game.startingCountries?.[commander.id] ?? game.humanCountry
            : game.humanCountry;
          return countryCode !== "AO";
        })
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

  const victories = useMemo<ConveyorDish[]>(() => (games ?? []).map((game) => {
    const commander = game.players.find((player) => player.uid === user?.uid)
      ?? game.players.find((player) => player.id === "player" && game.ownerUid === user?.uid);
    const countryCode = commander
      ? game.startingCountries?.[commander.id] ?? game.humanCountry
      : game.humanCountry;
    const countries = game.startingCountries
      ? Object.values(game.startingCountries)
      : game.countries.map((country) => country.code);
    const countryNames = [...new Set(countries)].map((code) => getCountryInfo(code)?.name ?? code);
    const home = getCountryInfo(countryCode);
    const victory = game.winnerId ? game.winnerId === commander?.id : game.outcome === "VICTORY";
    return {
      id: game.id,
      name: home?.name ?? countryCode,
      description: `${victory ? "Victory" : "Defeat"} in round ${game.round}. Select this wheel to open the full campaign replay.`,
      price: `${victory ? "VICTORY" : "DEFEAT"} · R${game.round}`,
      tier: victory ? 4 : 2,
      image: flagUrl(countryCode, 160),
      details: [...countryNames, `${game.players.length} commanders`, new Date(game.createdAt).toLocaleDateString()],
    };
  }), [games, user?.uid]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
          <div><p className="eyebrow">CAMPAIGN ARCHIVE</p><h1 className="section-title mt-1 text-3xl">Old victories</h1><p className="mt-2 text-sm text-[var(--muted-ink)]">Every completed operation, newest first.</p></div>
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
        ) : <div className="mt-6 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          <SushiConveyorMenu
            items={victories}
            eyebrow="CAMPAIGN ARCHIVE"
            heading="Victories"
            caption="Each rotating plate shows the nation you commanded. Browse from newest to oldest, then open a plate to replay the campaign and see all starting nations."
            speed={14}
            labels={{ add: "Open replay", close: "Close", previous: "Previous campaign", next: "Next campaign", pause: "Pause archive" }}
            onAdd={(item) => router.push(`/game/${encodeURIComponent(item.id)}/replay`)}
          />
        </div>}
      </div>
    </main>
  );
}
