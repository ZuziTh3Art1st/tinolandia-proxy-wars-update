"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import * as React from "react";

const kits = [
  { level: 1, name: "Line soldier", type: "Breastplate", detail: "Standard issue · entry level", model: "/assets/armor/Breastplate.glb" },
  { level: 2, name: "Field veteran", type: "Chalcidian", detail: "Battle tested · veteran tier", model: "/assets/armor/Chalcidian.glb" },
  { level: 3, name: "Veteran guard", type: "Chalcidian", detail: "Senior formation · advanced tier", model: "/assets/armor/Chalcidian.glb" },
  { level: 4, name: "Elite guard", type: "Chalcidian", detail: "Elite formation · specialist tier", model: "/assets/armor/Chalcidian.glb" },
  { level: 5, name: "Sovereign guard", type: "Plate armour", detail: "Highest rank · ceremonial tier", model: null },
];

const ModelViewer = "model-viewer" as unknown as React.ComponentType<Record<string, unknown>>;

export function SoldierKitPicker() {
  const [level, setLevel] = useState(1);
  const selected = kits[level - 1];
  useEffect(() => {
    const stored = Number(window.localStorage.getItem("tinolandia-soldier-kit-level"));
    if (stored >= 1 && stored <= kits.length) setLevel(stored);
  }, []);
  const choose = (next: number) => {
    setLevel(next);
    window.localStorage.setItem("tinolandia-soldier-kit-level", String(next));
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[0_2px_10px_rgba(28,45,46,.035)]">
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js" strategy="afterInteractive" />
      <div className="border-b border-[var(--line)] px-4 py-4 sm:px-5"><p className="eyebrow">SOLDIER ARMOURY</p><div className="mt-1 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold">Choose a soldier level</h2><p className="mt-1 text-xs text-[var(--muted-ink)]">Select a rank to inspect its armour.</p></div><span className="rounded-full border border-[var(--line)] bg-[#f7f8f7] px-2.5 py-1 text-[10px] font-semibold">LEVEL {selected.level}</span></div></div>
      <div className="p-3 sm:p-4">
        <div className="relative mb-3 overflow-x-auto px-1 pb-1 pt-3">
          <div aria-hidden="true" className="absolute left-6 right-6 top-[18px] h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"/>
          <div className="relative flex min-w-max gap-2" role="group" aria-label="Soldier level">
            {kits.map((kit) => <button key={kit.level} type="button" onClick={() => choose(kit.level)} aria-pressed={level === kit.level} className={`relative mt-1 w-32 rounded-md border p-2.5 pt-5 text-left transition ${level === kit.level ? "border-[var(--accent)] bg-[#fbf3ee] ring-1 ring-[var(--accent)]/20" : "border-[var(--line)] bg-white hover:border-[var(--accent)]"}`}><span aria-hidden="true" className={`absolute left-1/2 top-[-9px] h-4 w-3 -translate-x-1/2 rounded-t-full border-2 border-b-0 ${level === kit.level ? "border-[var(--accent)]" : "border-slate-400"}`}/><span className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-dark)]">LEVEL {kit.level}</span>{level === kit.level && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--accent)]"/>}</span><span className="mt-1 block text-xs font-semibold text-[var(--ink)]">{kit.name}</span><span className="mt-0.5 block text-[10px] text-[var(--muted-ink)]">{kit.type}</span></button>)}
          </div>
        </div>
        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-md border border-[var(--line)] bg-[radial-gradient(ellipse_at_center,#fff_0%,#eef2ef_75%)] p-3">
          {level === 5 ? <div className="w-full overflow-hidden rounded-md"><iframe title="PLATE ARMOR by Taygun Gencosmanoğlu on Sketchfab" src="https://sketchfab.com/models/591cbc77c72b4510865bcb69be95a460/embed" className="h-[280px] w-full rounded-md border-0" allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/><p className="px-2 py-1.5 text-[10px] text-[var(--muted-ink)]"><a href="https://sketchfab.com/3d-models/plate-armor-591cbc77c72b4510865bcb69be95a460" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-dark)] underline">PLATE ARMOR</a> by <a href="https://sketchfab.com/taygungencosman" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-dark)] underline">Taygun Gencosmanoğlu</a> on <a href="https://sketchfab.com" target="_blank" rel="noreferrer" className="underline">Sketchfab</a></p></div> : <ModelViewer key={selected.model} src={selected.model} alt={`Interactive 3D preview of the ${selected.type} soldier armour`} camera-controls auto-rotate rotation-per-second="18deg" shadow-intensity="0.7" exposure="1.05" interaction-prompt="none" loading="lazy" touch-action="pan-y" style={{ width: "100%", height: "280px", background: "transparent", "--poster-color": "transparent" } as React.CSSProperties}><span slot="progress-bar" className="text-xs text-slate-500">Loading armour preview…</span></ModelViewer>}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-4 py-2.5 text-[10px] text-[var(--muted-ink)]"><span>{selected.name} · {selected.detail}</span><span>{level === 5 ? "Hosted by Sketchfab · creator credited above" : "Interactive 3D armour · drag to inspect"}</span></div>
    </section>
  );
}
