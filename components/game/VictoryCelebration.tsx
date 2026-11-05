"use client";

import { useEffect, useState } from "react";
import MurmurationWordmark from "@/components/MurmurationWordmark";

export function VictoryCelebration({ nation, commander, mode = "victory", onClose }: { nation?: string; commander?: string; mode?: "victory" | "tutorial"; onClose: () => void }) {
  const [canClose, setCanClose] = useState(false);
  const tutorial = mode === "tutorial";

  useEffect(() => {
    const timer = window.setTimeout(() => setCanClose(true), 30_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#07131e]">
      <MurmurationWordmark
        word={tutorial ? "COMPLETE" : "VICTORY"}
        birds={2600}
        preset="dusk"
        palette={{ skyTop: "#091a2a", skyLow: "#b96856", sun: "#f0c77b", ink: "#101723" }}
        flyFor={4.5}
        holdFor={4}
        height="100svh"
        className="min-h-[100svh]"
      >
        <div role="dialog" aria-modal="true" aria-labelledby="victory-celebration-title" className="grid h-full w-full grid-rows-[auto_1fr_auto] px-5 py-6 sm:px-10 sm:py-8">
          <div className="mx-auto w-full max-w-6xl text-center text-white drop-shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-[.34em] text-[#ffe5ad]">TINOLANDIA PROXY WARS · {tutorial ? "FIELD BRIEFING" : "CAMPAIGN COMPLETE"}</p>
          </div>
          <div aria-hidden="true" />
          <section className="mx-auto mb-8 w-full max-w-xl rounded-2xl border border-white/25 bg-[#081a25]/85 p-5 text-center text-white shadow-[0_18px_60px_rgba(3,11,17,.4)] backdrop-blur-md sm:mb-10 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#e9c779]">{tutorial ? "TUTORIAL · COMPLETE" : "WORLD CAMPAIGN · VICTORY"}</p>
            <h1 id="victory-celebration-title" className="mt-2 font-serif text-2xl sm:text-3xl">{tutorial ? "Field training complete." : `The world is yours, ${commander ?? "Commander"}.`}</h1>
            <p className="mt-2 text-sm text-white/75">{tutorial ? "You reinforced, weighed the odds, fought a battle and secured a new border. You are ready to command." : `${nation ?? "Your nation"} secured the final territory. The campaign is complete.`}</p>
            {canClose ? <button type="button" data-interactive onClick={onClose} className="mt-5 min-h-11 rounded-full bg-[#e9c779] px-6 py-2.5 text-sm font-bold text-[#17202b] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#f5d995]">Close celebration</button> : <p className="mt-5 text-xs text-white/65">Victory celebration · close will be available after 30 seconds</p>}
          </section>
        </div>
      </MurmurationWordmark>
    </div>
  );
}
