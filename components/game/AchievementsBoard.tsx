"use client";

import React, { useState } from "react";
import Script from "next/script";
import {
  ACHIEVEMENTS,
  DEFAULT_STATS,
  getUnlockedAchievements,
  isArmourKitUnlocked,
  loadArmourKitLevel,
  loadStats,
  PlayerStats,
  saveArmourKitLevel,
} from "@/lib/achievements";

const ModelViewer = "model-viewer" as unknown as React.ComponentType<Record<string, unknown>>;

const kits = [
  { level: 1, name: "Line soldier", type: "Breastplate", model: "/assets/armor/Breastplate.glb", detail: "Standard issue · entry level" },
  { level: 2, name: "Field veteran", type: "Chalcidian", model: "/assets/armor/Chalcidian.glb", detail: "Battle tested · veteran tier" },
  { level: 3, name: "Veteran guard", type: "Chalcidian", model: "/assets/armor/Chalcidian.glb", detail: "Senior formation · advanced tier" },
  { level: 4, name: "Elite guard", type: "Chalcidian", model: "/assets/armor/Chalcidian.glb", detail: "Elite formation · specialist tier" },
  { level: 5, name: "Sovereign guard", type: "Plate armour", model: null, detail: "Highest rank · ceremonial tier" },
];

function kitForLevel(level: number) {
  return kits.find((k) => k.level === level)!;
}

function lockedReason(level: number, stats: PlayerStats): string {
  const ach = ACHIEVEMENTS.find((a) => a.armourKit.level === level);
  return ach ? ach.requirement : "Unlock by playing";
}

export function AchievementsBoard() {
  const [stats] = useState<PlayerStats>(() => loadStats());
  const [selected, setSelected] = useState(() => loadArmourKitLevel());
  const unlockedIds = getUnlockedAchievements(stats);

  const choose = (next: number) => {
    if (!isArmourKitUnlocked(next, stats)) return;
    setSelected(next);
    saveArmourKitLevel(next);
  };

  const kit = kitForLevel(selected);
  const isUnlocked = isArmourKitUnlocked(selected, stats);
  const nextLocked = ACHIEVEMENTS.find((a) => !unlockedIds.includes(a.id));

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[0_2px_10px_rgba(28,45,46,.035)]">
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js" strategy="afterInteractive" />
      <div className="border-b border-[var(--line)] px-4 py-4 sm:px-5">
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">SOLDIER ARMOURY · ACHIEVEMENTS</p>
            <h2 className="text-base font-semibold">Armour Collectibles</h2>
            <p className="mt-1 text-xs text-[var(--muted-ink)]">Unlock armour models by earning campaign achievements.</p>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-[#f7f8f7] px-2.5 py-1 text-[10px] font-semibold">
            LEVEL {kit.level}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {/* Armour kit carousel */}
        <div className="relative mb-3 overflow-x-auto px-1 pb-1 pt-3">
          <div aria-hidden="true" className="absolute left-6 right-6 top-[18px] h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"/>
          <div className="relative flex min-w-max gap-2" role="group" aria-label="Armour kits">
            {kits.map((k) => {
              const unlocked = isArmourKitUnlocked(k.level, stats);
              const active = selected === k.level;
              let className = "relative mt-1 w-32 rounded-md border p-2.5 pt-5 text-left transition";
              if (active) {
                className += " border-[var(--accent)] bg-[#fbf3ee] ring-1 ring-[var(--accent)]/20";
              } else if (unlocked) {
                className += " border-[var(--line)] bg-white hover:border-[var(--accent)]";
              } else {
                className += " border-[var(--line)]/30 bg-[#f7f8f7] opacity-60 grayscale";
              }
              let indicatorClass = "absolute left-1/2 top-[-9px] h-4 w-3 -translate-x-1/2 rounded-t-full border-2 border-b-0";
              if (active) {
                indicatorClass += " border-[var(--accent)]";
              } else if (unlocked) {
                indicatorClass += " border-slate-400";
              } else {
                indicatorClass += " border-slate-200";
              }

              return (
                <button
                  key={k.level}
                  type="button"
                  onClick={() => (unlocked ? choose(k.level) : undefined)}
                  aria-pressed={active}
                  aria-disabled={!unlocked}
                  disabled={!unlocked}
                  className={className}
                >
                  <span aria-hidden="true" className={indicatorClass} />
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-dark)]">LEVEL {k.level}</span>
                    {active && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--accent)]" />}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[var(--ink)]">{k.name}</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted-ink)]">{k.type}</span>
                  {!unlocked && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">
                      <span className="h-2 w-2 rounded-full bg-rose-700" /> LOCKED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D model preview */}
        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-md border border-[var(--line)] bg-[radial-gradient(ellipse_at_center,#fff_0%,#eef2ef_75%)] p-3">
          {kit.level === 5 ? (
            <div className="w-full overflow-hidden rounded-md">
              <iframe title="PLATE ARMOR by Taygun Gencosmanoğlu on Sketchfab" src="https://sketchfab.com/models/591cbc77c72b4510865bcb69be95a460/embed" className="h-[280px] w-full rounded-md border-0" allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
              <p className="px-2 py-1.5 text-[10px] text-[var(--muted-ink)]">
                <a href="https://sketchfab.com/3d-models/plate-armor-591cbc77c72b4510865bcb69be95a460" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-dark)] underline">PLATE ARMOR</a>{" "}
                by{" "}
                <a href="https://sketchfab.com/taygungencosman" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-dark)] underline">Taygun Gencosmanoğlu</a>{" "}
                on{" "}
                <a href="https://sketchfab.com" target="_blank" rel="noreferrer" className="underline">Sketchfab</a>
              </p>
            </div>
          ) : (
            <ModelViewer
              key={kit.model}
              src={kit.model}
              alt={`Interactive 3D preview of the ${kit.type} soldier armour`}
              camera-controls
              auto-rotate
              rotation-per-second="18deg"
              shadow-intensity="0.7"
              exposure="1.05"
              interaction-prompt="none"
              loading="lazy"
              touch-action="pan-y"
              style={{ width: "100%", height: "280px", background: "transparent", "--poster-color": "transparent" } as React.CSSProperties}
            >
              <span slot="progress-bar" className="text-xs text-slate-500">Loading armour preview…</span>
            </ModelViewer>
          )}
        </div>

        {/* Kit detail + lock reason */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-4 py-2.5 text-[10px] text-[var(--muted-ink)]">
          <span>{kit.name} · {kit.detail}</span>
          {!isUnlocked && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-700" /> Locked · {lockedReason(selected, stats)}
            </span>
          )}
          {isUnlocked && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-800" /> UNLOCKED
            </span>
          )}
        </div>
      </div>

      {/* Progress summary */}
      <div className="border-t border-[var(--line)] bg-[#fbfcfb] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-ink)]">CAMPAIGN PROGRESS</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-[var(--line)] bg-white p-2.5">
            <p className="text-[9px] font-semibold text-[var(--muted-ink)]">Games played</p>
            <p className="text-xs font-bold text-[var(--ink)]">{stats.gamesPlayed}</p>
          </div>
          <div className="rounded-md border border-[var(--line)] bg-white p-2.5">
            <p className="text-[9px] font-semibold text-[var(--muted-ink)]">Wins</p>
            <p className="text-xs font-bold text-emerald-800">{stats.wins}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-[var(--line)] bg-white p-2.5">
            <p className="text-[9px] font-semibold text-[var(--muted-ink)]">Conquests</p>
            <p className="text-xs font-bold text-[var(--ink)]">{stats.conquests}</p>
          </div>
          <div className="rounded-md border border-[var(--line)] bg-white p-2.5">
            <p className="text-[9px] font-semibold text-[var(--muted-ink)]">Rivals eliminated</p>
            <p className="text-xs font-bold text-[var(--ink)]">{stats.rivalsEliminated}</p>
          </div>
        </div>

        {/* Next unlock */}
        {nextLocked && (
          <div className="mt-3 rounded-md border border-[var(--line)] bg-white p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted-ink)]">NEXT UNLOCK</p>
            <div className="mt-1 flex items-start gap-2">
              <div className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{nextLocked.armourKit.level}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--ink)]">{nextLocked.title}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted-ink)]">{nextLocked.requirement}</p>
              </div>
            </div>
          </div>
        )}
        {!nextLocked && (
          <div className="mt-3 rounded-md border border-[var(--line)] bg-emerald-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted-ink)]">ALL UNLOCKED</p>
            <p className="mt-1 text-xs text-emerald-800">You have collected every armour model.</p>
          </div>
        )}
      </div>
    </section>
  );
}
