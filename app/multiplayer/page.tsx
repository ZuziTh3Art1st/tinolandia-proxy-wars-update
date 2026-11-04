import Link from "next/link";

export default function MultiplayerPage() {
  return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5"><div><p className="eyebrow">CAMPAIGN MODE</p><h1 className="section-title mt-1 text-3xl">Command together</h1></div><Link href="/" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Back to campaign desk</Link></header>
    <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 sm:p-7"><p className="text-sm leading-6 text-[var(--muted-ink)]">Start a campaign with <strong className="text-[var(--ink)]">Let friends join this campaign</strong> selected. Once the map opens, copy its invite link and send it to other players. Anyone who signs in and opens the link can claim an open rival nation.</p><ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Each commander takes their turn when their name is shown at the top of the board.</li><li>Players can join while a campaign is active. They take over an unclaimed rival nation.</li><li>NPC commanders continue to play any seats that have not been claimed.</li><li>The live map and campaign history update for everyone in the room.</li></ol><Link href="/" className="mt-6 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Set up a multiplayer campaign</Link></section>
  </div></main>;
}
