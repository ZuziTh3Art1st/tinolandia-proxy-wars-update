"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountryPicker from "@/components/CountryPicker";
import { MyGames } from "@/components/MyGames";
import { createGameApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { getCountryInfo } from "@/lib/countries";
import { OpeningLogo } from "@/components/OpeningLogo";
import { WorldBriefingHero } from "@/components/WorldBriefingHero";

const NPC_SETTINGS_KEY = "tinolandia-npc-settings-v1";

export default function HomePage() {
  const router = useRouter();
  const { user, loading, logOut } = useAuth();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);

  const selectedCountry = selectedCode ? getCountryInfo(selectedCode) : undefined;

  useEffect(() => {
    if (loading) return;
    const acknowledged = !!user && window.localStorage.getItem(`tinolandia-privacy-ack-${user.uid}`) === '2026-10-31-v1';
    setAccessGranted(acknowledged);
    if (!acknowledged) router.replace('/login');
  }, [loading, router, user]);

  useEffect(() => {
    if (loading || !user) return;
    const pending = window.sessionStorage.getItem("tinolandia-pending-country");
    if (pending && getCountryInfo(pending)) setSelectedCode(pending);
    window.sessionStorage.removeItem("tinolandia-pending-country");
  }, [loading, user]);

  const start = async () => {
    if (!user) {
      if (selectedCode) window.sessionStorage.setItem("tinolandia-pending-country", selectedCode);
      router.push("/login");
      return;
    }
    if (!selectedCode) return;
    setStarting(true);
    setError(null);
    try {
      let npcSettings: Record<string, unknown> | undefined;
      try { npcSettings = JSON.parse(window.localStorage.getItem(NPC_SETTINGS_KEY) || "{}"); } catch { npcSettings = undefined; }
      const { gameId } = await createGameApi(selectedCode, npcSettings);
      router.push(`/game/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the campaign.");
      setStarting(false);
    }
  };

  if (loading || !accessGranted || !user) return <main className="grid min-h-screen place-items-center bg-[#f3f4f2] px-5"><p className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted-ink)]">Opening commander access…</p></main>;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <OpeningLogo />
      <div className="mx-auto max-w-7xl">
        <WorldBriefingHero />

        <nav aria-label="Campaign preparation" className="mb-3 flex flex-wrap items-center gap-2">
          <Link href="/tutorial" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]">Play the strategy tutorial</Link>
          <Link href="/commanders" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]">Configure rival commanders</Link>
          <Link href="/commentary" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]">LLM commentary</Link>
          <Link href="/playthroughs" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]">Past playthroughs</Link>
        </nav>

        <div className="grid gap-10 py-9 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            <div className="mb-5 flex items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div><p className="eyebrow">01 / DEPLOYMENT</p><h2 className="section-title mt-1">Choose your country</h2></div>
              <p className="hidden text-xs text-[var(--muted-ink)] sm:block">Select a nation to begin</p>
            </div>
            {error && <p role="alert" className="mb-4 rounded-lg border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}</p>}
            <CountryPicker onSelectCountry={(code) => { setSelectedCode(code); setError(null); }} selectedCode={selectedCode} busy={starting || loading} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void start()} disabled={!selectedCode || starting || loading} className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">
                {starting ? "Preparing campaign…" : selectedCountry ? `Start campaign as ${selectedCountry.name}` : "Select a country to continue"}
              </button>
            </div>
          </section>

          <aside className="space-y-8 lg:border-l lg:border-[var(--line)] lg:pl-8">
            <section>
              <p className="eyebrow mb-3">COMMANDER PROFILE</p>
              {user ? <div className="space-y-2"><p className="truncate text-sm font-semibold">{user.displayName || user.email}</p><p className="text-xs text-[var(--muted-ink)]">Signed in and ready to command.</p><button type="button" onClick={() => void logOut()} className="rounded border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted-ink)] hover:text-[var(--ink)]">Sign out</button></div> : <div className="space-y-3"><p className="text-sm leading-6 text-[var(--muted-ink)]">Create a commander profile or sign in to save and launch your campaign.</p><Link href="/login" className="inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-dark)]">Commander sign in</Link></div>}
            </section>
            <section>
              <p className="eyebrow mb-3">YOUR CAMPAIGNS</p>
              {user ? <MyGames uid={user.uid} /> : <p className="text-sm leading-6 text-[var(--muted-ink)]">Sign in to view and continue your saved campaigns.</p>}
            </section>
            <section className="border-t border-[var(--line)] pt-5">
              <p className="eyebrow mb-2">HOW TO PLAY</p>
              <p className="text-sm leading-6 text-[var(--muted-ink)]">Reinforce your positions, choose one attack each turn and weigh risk against the chance of conquest. The last surviving nation wins.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
