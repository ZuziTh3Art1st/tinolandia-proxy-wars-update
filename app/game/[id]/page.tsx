"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { GeopoliticsGameboard } from "@/components/GeopoliticsGameboard";

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e7e3dd] p-1"><Image src="/brand/tinolandia-mark.png" alt="" width={563} height={582} className="h-full w-full object-contain" /></span><div><p className="eyebrow">CAMPAIGN ROOM</p><h1 className="section-title mt-1 text-2xl">Tinolandia Proxy Wars<sup className="ml-0.5 align-super text-xs">™</sup></h1></div></div>
          <Link href="/" className="rounded-md border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted-ink)] transition hover:text-[var(--ink)]">Campaign desk</Link>
        </header>
        <GeopoliticsGameboard gameId={id} />
      </div>
    </main>
  );
}
