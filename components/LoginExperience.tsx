"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/AuthPanel";
import DataRain from "@/components/DataRain";
import { useAuth } from "@/lib/AuthContext";

export function LoginExperience() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  useEffect(() => {
    if (!user) { setPrivacyAcknowledged(false); return; }
    const update = () => setPrivacyAcknowledged(window.localStorage.getItem(`tinolandia-privacy-ack-${user.uid}`) === '2026-10-31-v1');
    update();
    window.addEventListener('tinolandia:privacy-ack', update);
    return () => window.removeEventListener('tinolandia:privacy-ack', update);
  }, [user]);

  useEffect(() => { if (!loading && user && privacyAcknowledged) router.replace("/"); }, [loading, privacyAcknowledged, router, user]);

  return (
    <main className="grid min-h-screen bg-[#f3f4f2] lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
      <section className="relative isolate flex min-h-[58vh] flex-col justify-between overflow-hidden bg-[#142321] px-6 py-7 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
        <DataRain
          className="login-data-rain"
          count={1250}
          flowSpeed={0.7}
          obstacleRadius={125}
          autopilot
          fullscreen={false}
          palette={{ calm: "#79b5c3", mid: "#4d55d8", hot: "#a18cff" }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_54%_48%,transparent_0%,rgba(10,22,21,.2)_60%,rgba(10,22,21,.84)_100%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e7e3dd] p-1.5">
            <Image src="/brand/tinolandia-mark.png" alt="" width={563} height={582} className="h-full w-full object-contain" />
          </span>
          <p className="font-serif text-base">Tinolandia Proxy Wars<sup className="ml-0.5 align-super text-[8px]">™</sup></p>
        </div>

        <div className="relative z-10 my-10 max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#aeb9ff]">A strategy simulation</p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl leading-[1.05] tracking-[-.035em] sm:text-6xl">Every nation changes the balance.</h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/70">Build alliances of necessity, reinforce your borders and decide when the odds are worth the risk.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/80">10 nations per campaign</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/80">One move at a time</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/15 pt-4 text-[10px] uppercase tracking-[.18em] text-white/45"><span>World strategy / 01</span><span>One world. One campaign.</span></div>
      </section>

      <section className="flex min-h-[42vh] flex-col justify-center px-6 py-9 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/tutorial" className="text-xs text-[var(--muted-ink)] underline-offset-4 hover:text-[var(--ink)] hover:underline">Explore the practice briefing →</Link>
          <p className="eyebrow mt-9">COMMANDER ACCESS</p>
          <h2 className="mt-2 font-serif text-3xl text-[var(--ink)]">Enter the campaign</h2>
          <p className="mb-7 mt-2 text-sm leading-6 text-[var(--muted-ink)]">Sign in to continue or create a profile to save your campaign.</p>
          <AuthPanel />
        </div>
      </section>
    </main>
  );
}
