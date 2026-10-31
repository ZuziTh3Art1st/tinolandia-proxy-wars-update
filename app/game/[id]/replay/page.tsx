"use client";

import { use } from "react";
import Link from "next/link";
import { CampaignReplay } from "@/components/game/CampaignReplay";

export default function CampaignReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-9"><div className="mx-auto max-w-7xl"><header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5"><div><p className="eyebrow">TINOLANDIA PROXY WARS™ · VIEWER MODE</p><h1 className="section-title mt-1 text-2xl">Campaign replay</h1></div><Link href={`/game/${id}`} className="rounded-md border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted-ink)] hover:text-[var(--ink)]">Campaign board</Link></header><CampaignReplay gameId={id}/></div></main>;
}
