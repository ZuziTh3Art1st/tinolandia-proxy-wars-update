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
    const gamesQuery = query(collection(db, "games"), where("ownerUid", "==", user.uid));
    return onSnapshot(gamesQuery, (snapshot) => {
      setGames(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as GameState) }))
        .filter((game) => game.status === "FINISHED")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (error) => {
      console.error("Playthrough history subscription failed:", error);
      setGames([]);
    });
  }, [user]);

  const items = useMemo<ConveyorDish[]>(() => (games ?? []).map((game) => {
    const selected = game.startingCountries
      ? Object.values(game.startingCountries)
      : game.countries.map((country) => country.code);
    const countries = [...new Set(selected)].map((code) => getCountryInfo(code)?.name ?? code);
    const home = getCountryInfo(game.humanCountry);
    return {
      id: game.id,
      name: home?.name ?? game.humanCountry,
      description: `${game.outcome === "VICTORY" ? "Victory" : "Defeat"} in round ${game.round}. Select this plate to open the campaign replay.`,
      price: `${game.outcome === "VICTORY" ? "VICTORY" : "DEFEAT"} · R${game.round}`,
      tier: game.outcome === "VICTORY" ? 4 : 2,
      image: flagUrl(game.humanCountry, 160),
      details: [...countries, `${game.players.length} commanders`, new Date(game.createdAt).toLocaleDateString()],
    };
  }), [games]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
          <div><p className="eyebrow">CAMPAIGN ARCHIVE</p><h1 className="section-title mt-1 text-3xl">Old campaigns</h1></div>
          <Link href="/" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Back to campaign desk</Link>
        </header>
        <nav aria-label="Campaign tools" className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/commentary" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">LLM commentary</Link>
          <Link href="/commanders" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">NPC difficulty</Link>
        </nav>

        {loading ? <p className="mt-8 text-sm text-[var(--muted-ink)]">Checking your commander profile…</p> : !user ? (
          <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6"><h2 className="text-lg font-semibold">Sign in to view your archive</h2><p className="mt-2 text-sm text-[var(--muted-ink)]">Completed playthroughs are saved with your campaign profile.</p><Link href="/login" className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Commander sign in</Link></section>
        ) : games === null ? <p className="mt-8 text-sm text-[var(--muted-ink)]">Loading your playthroughs…</p> : items.length === 0 ? (
          <section className="mt-8 rounded-lg border border-dashed border-[var(--line)] bg-white/70 p-8 text-center"><p className="text-sm font-semibold">No completed campaigns yet</p><p className="mt-2 text-sm text-[var(--muted-ink)]">Finish a campaign and its ten starting countries will appear here.</p><Link href="/" className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Start a campaign</Link></section>
        ) : <div className="mt-5 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          <SushiConveyorMenu
            items={items}
            eyebrow="COMPLETED CAMPAIGNS"
            heading="Choose a past operation"
            caption="Each plate shows the nation you commanded. Open it to see all starting nations and replay the campaign events."
            speed={14}
            labels={{ add: "Open replay", close: "Close", previous: "Previous campaign", next: "Next campaign", pause: "Pause archive" }}
            onAdd={(item) => router.push(`/game/${encodeURIComponent(item.id)}/replay`)}
          />
        </div>}
      </div>
    </main>
  );
}
