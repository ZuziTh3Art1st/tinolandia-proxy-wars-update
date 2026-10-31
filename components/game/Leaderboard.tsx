"use client";

import React, { useEffect, useState } from "react";
import { fetchLeaderboard, PlayerLeaderboardEntry } from "@/lib/leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard() {
  const [entries, setEntries] = useState<PlayerLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard(10).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-[0_2px_10px_rgba(28,45,46,.035)]">
        <p className="eyebrow">GLOBAL COMMANDER RANKINGS</p>
        <h2 className="text-base font-semibold">Live Leaderboard</h2>
        <p className="mt-2 text-xs text-[var(--muted-ink)]">Loading rankings…</p>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-[0_2px_10px_rgba(28,45,46,.035)]">
        <p className="eyebrow">GLOBAL COMMANDER RANKINGS</p>
        <h2 className="text-base font-semibold">Live Leaderboard</h2>
        <p className="mt-2 rounded-md bg-[#f7f8f7] px-3 py-2 text-xs text-[var(--muted-ink)]">No campaigns recorded yet. Play your first game to appear on the leaderboard.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white shadow-[0_2px_10px_rgba(28,45,46,.035)]">
      <div className="px-4 py-3 sm:px-5 border-b border-[var(--line)]">
        <p className="eyebrow">GLOBAL COMMANDER RANKINGS</p>
        <h2 className="text-base font-semibold">Live Leaderboard</h2>
        <p className="mt-1 text-xs text-[var(--muted-ink)]">Commander standings across all campaigns</p>
      </div>
      <div className="p-4 sm:p-5">
        <ol className="space-y-2">
          {entries.map((entry, i) => (
            <li key={entry.uid} className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-white p-2.5">
              <span className="w-6 text-center font-black text-[var(--ink)]">{MEDALS[i] ?? i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--ink)] truncate">{entry.name}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted-ink)]">
                  {entry.wins}W · {entry.losses}L · {entry.gamesPlayed} games
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--ink)]">{entry.winRate}%</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted-ink)]">win rate</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
