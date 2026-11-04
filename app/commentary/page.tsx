import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CommentaryPage() {
  const enabled = Boolean(process.env.GROQ_API_KEY);
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
          <div><p className="eyebrow">INTELLIGENCE · BATTLE NARRATION</p><h1 className="section-title mt-1 text-3xl">Groq commentary</h1></div>
          <Link href="/" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">Back to campaign desk</Link>
        </header>

        <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="eyebrow">LIVE CONFIGURATION</p><h2 className="mt-1 text-xl font-semibold">AI battle commentary</h2></div>
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              {enabled ? "Groq key configured" : "Groq key missing"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-ink)]">
            {enabled
              ? `Battle rounds are sent to ${model}. A short built-in field report appears immediately; Groq replaces it when its response arrives.`
              : "The game is currently using its built-in field reports. Add GROQ_API_KEY to the server environment and redeploy to turn on AI narration."}
          </p>
          {!enabled && <p className="mt-3 rounded-md bg-[#f8f6ee] px-3 py-2.5 text-xs leading-5 text-[var(--muted-ink)]">For Vercel: Project Settings → Environment Variables → add GROQ_API_KEY, then redeploy. Keep the key server-side; never add it to a NEXT_PUBLIC variable.</p>}
          <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs leading-5 text-[var(--muted-ink)]">Narration uses the recorded dice and casualty results. If Groq is unavailable, the game keeps the built-in report and continues normally.</p>
        </section>

        <nav aria-label="Campaign tools" className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/playthroughs" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">Past playthroughs</Link>
          <Link href="/commanders" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">NPC difficulty</Link>
        </nav>
      </div>
    </main>
  );
}
