"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { joinGameApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function MultiplayerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = new URLSearchParams(window.location.search).get("code");
      if (pending) setCode(pending.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8));
    }
  }, []);

  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      window.sessionStorage.setItem("tinolandia-pending-lobby-code", code);
      router.push("/login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await joinGameApi(code);
      router.push(`/multiplayer/lobby/${encodeURIComponent(result.gameId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join that lobby.");
      setBusy(false);
    }
  };

  return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5"><div><p className="eyebrow">CAMPAIGN MODE</p><h1 className="section-title mt-1 text-3xl">Command together</h1></div><Link href="/" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Back to campaign desk</Link></header>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-7"><p className="eyebrow">JOIN A LOBBY</p><h2 className="mt-1 text-xl font-semibold">Enter your invite code</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">Ask the host for their 8-character code. You’ll join the room and choose your commander seat before the game starts.</p>
        <form onSubmit={(event) => void join(event)} className="mt-5 space-y-3"><label htmlFor="lobby-code" className="block text-xs font-semibold">Lobby code</label><input id="lobby-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8))} placeholder="e.g. 3A7F92C1" autoComplete="off" maxLength={8} className="w-full rounded-md border border-[var(--line)] bg-[#fafbf9] px-4 py-3 font-mono text-lg tracking-[.22em] outline-none focus:border-[var(--accent)]"/><p className="text-[10px] text-[var(--muted-ink)]">{code.length}/8 characters</p>{error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}<button type="submit" disabled={code.length !== 8 || busy} className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-45">{busy ? "Finding lobby…" : "Join lobby"}</button>{!user && <p className="text-xs text-[var(--muted-ink)]">You’ll be asked to sign in before joining. Your code will be kept.</p>}</form>
      </section>
      <section className="rounded-lg border border-[var(--line)] bg-[#f7f8f6] p-5 sm:p-7"><p className="eyebrow">HOST A CAMPAIGN</p><h2 className="mt-1 text-xl font-semibold">Create your own lobby</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--muted-ink)]"><li>Return to the campaign desk and choose your country.</li><li>Turn on “Let friends join this campaign” before starting.</li><li>Share the lobby code, then launch when everyone is ready.</li></ol><Link href="/" className="mt-5 inline-flex rounded-md border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold">Choose a country</Link></section>
    </div>
  </div></main>;
}
