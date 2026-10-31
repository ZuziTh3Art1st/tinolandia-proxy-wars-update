import TiltedGridHero, { type TiltedGridImage } from "@/components/TiltedGridHero";
import Image from "next/image";

const briefings = [
  { code: "ZA", name: "South Africa", region: "Southern Africa", accent: "#1800ad" },
  { code: "JP", name: "Japan", region: "East Asia", accent: "#537c80" },
  { code: "BR", name: "Brazil", region: "South America", accent: "#788765" },
  { code: "EG", name: "Egypt", region: "North Africa", accent: "#b48b4e" },
  { code: "IN", name: "India", region: "South Asia", accent: "#7c6f92" },
  { code: "NG", name: "Nigeria", region: "West Africa", accent: "#3f7d68" },
];

function cardImage(code: string, name: string, region: string, accent: string): TiltedGridImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580"><defs><linearGradient id="paper" x2="1" y2="1"><stop stop-color="#fafbf9"/><stop offset="1" stop-color="#dfe6e4"/></linearGradient><pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#6c7d7b" stroke-opacity=".13"/></pattern></defs><rect width="900" height="580" rx="30" fill="url(#paper)"/><rect width="900" height="580" rx="30" fill="url(#grid)"/><circle cx="660" cy="225" r="205" fill="none" stroke="${accent}" stroke-opacity=".17" stroke-width="2"/><ellipse cx="660" cy="225" rx="85" ry="205" fill="none" stroke="${accent}" stroke-opacity=".18" stroke-width="2"/><path d="M455 225h410M475 145h370M475 305h370" stroke="${accent}" stroke-opacity=".16" stroke-width="2"/><path d="M520 201l34-45 35 21 31-52 39 24 35-15 39 63-22 29-48-8-23 41-46-11-28 31-49-28z" fill="${accent}" fill-opacity=".16"/><text x="58" y="76" font-family="Arial,sans-serif" font-size="20" letter-spacing="5" fill="#657174">FIELD NOTE / ${region.toUpperCase()}</text><text x="54" y="385" font-family="Georgia,serif" font-size="174" fill="${accent}" fill-opacity=".88">${code}</text><text x="62" y="443" font-family="Arial,sans-serif" font-size="34" font-weight="600" fill="#293436">${name}</text><text x="62" y="482" font-family="Arial,sans-serif" font-size="18" letter-spacing="3" fill="#657174">NATION PROFILE · ACTIVE THEATRE</text></svg>`;
  return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, alt: `${name} field note` };
}

const images = briefings.map(({ code, name, region, accent }) => cardImage(code, name, region, accent));

export function WorldBriefingHero() {
  return (
    <TiltedGridHero
      images={images}
      speed={7}
      tileHeight={78}
      aspectRatio={1.48}
      gap={8}
      axis={58}
      curve={56}
      fade={18}
      className="mb-7 min-h-[250px] rounded-xl border border-[var(--line)] bg-[#e8eceb] shadow-[0_2px_10px_rgba(28,45,46,.035)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#f7f8f6] via-[#f7f8f6]/90 to-[#f7f8f6]/15" />
      <div className="relative z-10 flex min-h-[250px] flex-wrap items-center justify-between gap-6 px-5 py-7 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7e3dd] p-1"><Image src="/brand/tinolandia-mark.png" alt="" width={563} height={582} className="h-full w-full object-contain" /></span><p className="eyebrow">A BUZUZI STRATEGY SIMULATION</p></div>
          <h1 className="display-title">Tinolandia <span>Proxy Wars</span><sup className="ml-1 align-super text-base tracking-normal">™</sup></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-ink)]">A turn-based strategy exercise in power, territory and political decision-making. Choose a country and lead it against nine rival commanders.</p>
        </div>
        <div className="rounded-lg border border-white/80 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-sm">
          <span className="block text-lg font-semibold tabular-nums text-[var(--ink)]">10</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-ink)]">nations · one campaign</span>
        </div>
      </div>
    </TiltedGridHero>
  );
}
