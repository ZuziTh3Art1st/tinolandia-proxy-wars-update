"use client";

import { useState } from "react";

const platforms = [
  { label: "Twitch", href: "https://www.twitch.tv/" },
  { label: "TikTok", href: "https://www.tiktok.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "Kick", href: "https://kick.com/" },
];

export function CampaignShare({ campaignId }: { campaignId: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/game/${campaignId}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Tinolandia Proxy Wars™", text: "Follow my campaign", url }); return; } catch { /* A cancelled share keeps the link available below. */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this campaign link", url);
    }
  };

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold">Share this campaign</p><p className="mt-1 text-xs text-[var(--muted-ink)]">Invite viewers to follow the live board.</p></div>
        <button type="button" onClick={() => void share()} className="rounded-md bg-[var(--ink)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-dark)]">{copied ? "Link copied" : "Share campaign"}</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3" aria-label="Streaming and social platforms">
        {platforms.map(({ label, href }) => <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded border border-[var(--line)] px-2.5 py-1.5 text-[11px] text-[var(--muted-ink)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]">{label}</a>)}
      </div>
    </section>
  );
}
