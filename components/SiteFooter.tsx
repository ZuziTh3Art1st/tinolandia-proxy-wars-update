import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--line)] bg-white/55 px-5 py-7 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[.16em] text-[var(--ink)]">TINOLANDIA PROXY WARS<sup className="ml-0.5 align-super text-[9px]">™</sup></p>
          <p className="mt-1 text-xs text-[var(--muted-ink)]">Developed by Ashley Tinotenda Buzuzi · Head Developer &amp; Philanthropist</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <a href="https://github.com/ZuziTh3Art1st" target="_blank" rel="noreferrer" className="text-[var(--accent-dark)] underline underline-offset-2">GitHub · ZuziTh3Art1st</a>
            <a href="https://www.linkedin.com/in/ashley-buzuzi-911a79376/" target="_blank" rel="noreferrer" className="text-[var(--accent-dark)] underline underline-offset-2">LinkedIn · Ashley Buzuzi</a>
          </div>
        </div>
        <div className="text-xs font-semibold tracking-[.18em] text-[var(--accent-dark)]">PROUDLY SOUTH AFRICAN</div>
        <Link href="/privacy" className="text-xs text-[var(--muted-ink)] underline underline-offset-2">Privacy &amp; simulation notice</Link>
      </div>
    </footer>
  );
}
