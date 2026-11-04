"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ConveyorDish } from "@/components/SushiConveyorMenu";
import { useAuth } from "@/lib/AuthContext";

const SushiConveyorMenu = dynamic(() => import("@/components/SushiConveyorMenu"), { ssr: false });

const spotlights: ConveyorDish[] = [
  {
    id: "buzuzi",
    name: "Ashley Tinotenda Buzuzi",
    description: "Developer and creator of Tinolandia Proxy Wars, built in Cape Town, South Africa.",
    price: "CREATOR · CAPE TOWN",
    tier: 4,
    image: "/brand/tinolandia-logo.png",
    details: ["Head developer", "South Africa", "Open LinkedIn profile"],
  },
  {
    id: "tinolandia",
    name: "Tinolandia Proxy Wars",
    description: "A turn-based world strategy simulation about shifting borders, risk and rival commanders.",
    price: "WORLD CAMPAIGN · 01",
    tier: 2,
    image: "/brand/tinolandia-mark.png",
    details: ["Strategy simulation", "Nine rival commanders", "Open project on GitHub"],
  },
];

export function SiteFooter() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (pathname === "/login" || (pathname === "/" && (loading || !user))) return null;

  const visitSpotlight = (item: ConveyorDish) => {
    const href = item.id === "buzuzi"
      ? "https://www.linkedin.com/in/ashley-buzuzi-911a79376/"
      : "https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update";
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="site-footer mt-10 overflow-hidden border-t border-white/10 bg-[#071920] text-white">
      <div className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_80%_0%,rgba(24,0,173,.38),transparent_52%),linear-gradient(135deg,#071920_0%,#102f37_58%,#102420_100%)] px-5 py-9 sm:px-8 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full border border-[#c9a45c]/20 shadow-[0_0_100px_rgba(201,164,92,.08)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#c9a45c]/30 bg-white/5 p-2 shadow-[0_12px_40px_rgba(0,0,0,.22)]">
              <Image src="/brand/tinolandia-mark.png" alt="" width={563} height={582} className="size-full object-contain" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#c9a45c]">Built by Buzuzi · Cape Town</p>
              <h2 className="mt-2 font-serif text-2xl tracking-[-.025em] sm:text-3xl">One world. Ten nations. Your move.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Tinolandia Proxy Wars is a strategy simulation by Ashley Tinotenda Buzuzi, proudly made in South Africa.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/tutorial" className="rounded-full border border-white/15 px-3.5 py-2 text-white/75 transition hover:border-[#c9a45c]/70 hover:text-white">Field briefing</Link>
            <Link href="/commanders" className="rounded-full border border-white/15 px-3.5 py-2 text-white/75 transition hover:border-[#c9a45c]/70 hover:text-white">Rival commanders</Link>
            <Link href="/commentary" className="rounded-full border border-white/15 px-3.5 py-2 text-white/75 transition hover:border-[#c9a45c]/70 hover:text-white">Groq dispatches</Link>
          </div>
        </div>
      </div>

      <section className="dark site-footer-theme border-y border-white/10 bg-[#071920]">
        <SushiConveyorMenu
          items={spotlights}
          eyebrow="THE PEOPLE · THE PROJECT"
          heading="Made with a world in mind"
          caption="Meet the developer or explore the campaign project."
          speed={11}
          labels={{ add: "Open link", close: "Close", previous: "Previous spotlight", next: "Next spotlight", pause: "Pause spotlights" }}
          onAdd={visitSpotlight}
          className="!bg-transparent"
        />
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-[11px] text-white/55 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold tracking-[.16em] text-white/80">TINOLANDIA PROXY WARS<sup className="ml-0.5 align-super text-[8px]">™</sup></span>
          <span aria-hidden="true" className="text-white/25">/</span>
          <span>Proudly South African</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="https://github.com/ZuziTh3Art1st" target="_blank" rel="noreferrer" className="transition hover:text-[#d9bd7a]">GitHub</a>
          <a href="https://www.linkedin.com/in/ashley-buzuzi-911a79376/" target="_blank" rel="noreferrer" className="transition hover:text-[#d9bd7a]">LinkedIn</a>
          <Link href="/privacy" className="transition hover:text-[#d9bd7a]">Privacy &amp; simulation notice</Link>
          <span>© {new Date().getFullYear()} Ashley Tinotenda Buzuzi</span>
        </div>
      </div>
    </footer>
  );
}
