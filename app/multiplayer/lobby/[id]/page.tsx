"use client";

import { use } from "react";
import Link from "next/link";
import { MultiplayerLobby } from "@/components/game/MultiplayerLobby";

export default function MultiplayerLobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5"><div><p className="eyebrow">TINOLANDIA PROXY WARS</p><h1 className="section-title mt-1 text-3xl">Campaign lobby</h1></div><Link href="/multiplayer" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Join another lobby</Link></header>
    <MultiplayerLobby gameId={id}/>
  </div></main>;
}
