import Link from "next/link";
import { AchievementsBoard } from "@/components/game/AchievementsBoard";
import HalftoneWordmarkFooter from "@/components/HalftoneWordmarkFooter";

export default function AchievementsPage() {
  return <main className="min-h-screen bg-[#f3f4f2] px-4 py-6 sm:px-8 sm:py-9">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div><p className="eyebrow">TINOLANDIA · COMMANDER RECORD</p><h1 className="section-title mt-1 text-3xl">Achievements & armoury</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">Track your campaign milestones and inspect the armour you have earned.</p></div>
        <Link href="/" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Back to campaign desk</Link>
      </header>
      <div id="achievement-list"><AchievementsBoard /></div>
    </div>
    <div className="mx-auto mt-8 max-w-7xl overflow-hidden rounded-lg">
      <HalftoneWordmarkFooter
        wordmark="tinolandia"
        label="Buzuzi · Tinolandia"
        meta="Cape Town · Campaign honours"
        columns={[
          { title: "Campaign", links: [{ label: "Campaign desk", href: "/" }, { label: "Old victories", href: "/playthroughs" }] },
          { title: "Command", links: [{ label: "Rival commanders", href: "/commanders" }, { label: "Multiplayer", href: "/multiplayer" }] },
          { title: "Collection", links: [{ label: "Achievement archive", href: "#achievement-list" }, { label: "GitHub", href: "https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update" }] },
        ]}
        preset="night"
        palette={{ background: "#071920", ink: "#f2eddf", warm: "#c9a45c" }}
        height="390px"
        dotGap={7}
        crop={0.16}
        grain={0.28}
      />
    </div>
  </main>;
}
