"use client";

import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "./Flag";
import { Globe3D } from "./Globe3D";

export interface CountryPickerProps {
  onSelectCountry: (code: string) => void;
  selectedCode?: string | null;
  busy?: boolean;
}

function regionFor(name: string) {
  const n = name.toLowerCase();
  if (/algeria|angola|benin|botswana|burkina|burundi|cameroon|cape verde|central african|chad|comoros|congo|djibouti|egypt|eritrea|eswatini|ethiopia|gabon|gambia|ghana|guinea|ivory coast|kenya|lesotho|liberia|libya|madagascar|malawi|mali|mauritania|mauritius|morocco|mozambique|namibia|niger|nigeria|rwanda|senegal|seychelles|sierra leone|somalia|south africa|south sudan|sudan|tanzania|togo|tunisia|uganda|zambia|zimbabwe/.test(n)) return "Africa";
  if (/afghanistan|armenia|azerbaijan|bahrain|bangladesh|bhutan|brunei|cambodia|china|cyprus|georgia|india|indonesia|iran|iraq|israel|japan|jordan|kazakhstan|kuwait|kyrgyzstan|laos|lebanon|malaysia|maldives|mongolia|myanmar|nepal|north korea|oman|pakistan|palestine|philippines|qatar|saudi|singapore|south korea|sri lanka|syria|taiwan|tajikistan|thailand|timor|turkey|turkmenistan|uae|united arab|uzbekistan|vietnam|yemen/.test(n)) return "Asia & Middle East";
  if (/albania|andorra|austria|belarus|belgium|bosnia|bulgaria|croatia|czech|denmark|estonia|finland|france|germany|greece|hungary|iceland|ireland|italy|kosovo|latvia|liechtenstein|lithuania|luxembourg|malta|moldova|monaco|montenegro|netherlands|north macedonia|norway|poland|portugal|romania|russia|san marino|serbia|slovakia|slovenia|spain|sweden|switzerland|ukraine|united kingdom|vatican/.test(n)) return "Europe";
  if (/antigua|argentina|bahamas|barbados|belize|bolivia|brazil|canada|chile|colombia|costa rica|cuba|dominica|dominican|ecuador|el salvador|grenada|guatemala|guyana|haiti|honduras|jamaica|mexico|nicaragua|panama|paraguay|peru|saint|suriname|trinidad|united states|uruguay|venezuela/.test(n)) return "Americas";
  if (/american samoa|australia|cook islands|fiji|micronesia|marshall islands|nauru|new zealand|niue|palau|papua new guinea|samoa|solomon islands|tonga|tuvalu|vanuatu|wallis|tokelau/.test(n)) return "Oceania";
  return "Asia & Middle East";
}

export default function CountryPicker({ onSelectCountry, selectedCode = null, busy = false }: CountryPickerProps) {
  const [search, setSearch] = useState("");
  const [openRegion, setOpenRegion] = useState<string | null>("Africa");
  const grouped = useMemo(() => {
    const map = new Map<string, typeof COUNTRIES>();
    for (const country of COUNTRIES) {
      const region = regionFor(country.name);
      map.set(region, [...(map.get(region) ?? []), country]);
    }
    const order = ["Africa", "Europe", "Asia & Middle East", "Americas", "Oceania"];
    return [...map.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  }, []);
  const filtered = useMemo(() => COUNTRIES.filter((country) =>
    `${country.name} ${country.code}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [search]);
  const selected = COUNTRIES.find((country) => country.code === selectedCode);

  return (
    <div className={busy ? "pointer-events-none opacity-60" : ""}>
      <div className="grid gap-4 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-5 lg:grid-cols-[minmax(250px,330px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center rounded-lg bg-[#eef1f0] px-3 pt-2">
          <Globe3D selectedCode={selectedCode ?? undefined} onSelectCountry={onSelectCountry} />
          <p className="pb-3 text-center text-xs text-[var(--muted-ink)]">Select a highlighted country, or browse all 234 below.</p>
        </div>
        <div className="min-w-0">
          <label htmlFor="country-search" className="sr-only">Search countries</label>
          <input id="country-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search countries by name or code"
            className="mb-3 w-full rounded-md border border-[var(--line)] bg-[#f8f9f8] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted-ink)]" />
          {search.trim() ? (
            <ul className="max-h-[390px] space-y-1 overflow-y-auto pr-1" aria-label="Country search results">
              {filtered.length ? filtered.map((country) => (
                <li key={country.code}>
                  <button type="button" disabled={busy} onClick={() => onSelectCountry(country.code)} className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${selectedCode === country.code ? "border-[var(--accent)] bg-[#f6eee9]" : "border-transparent hover:bg-[#eef1f0]"}`}>
                    <Flag code={country.code} size={40} className="h-5 w-8 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                    <span className="text-[10px] tracking-wider text-[var(--muted-ink)]">{country.code}</span>
                  </button>
                </li>
              )) : <li className="p-4 text-sm text-[var(--muted-ink)]">No countries match that search.</li>}
            </ul>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {grouped.map(([region, countries], index) => {
                const isOpen = openRegion === region;
                return <div key={region} className={`min-w-0 rounded-lg border p-2 transition-colors ${isOpen ? "border-[var(--accent)]/45 bg-white shadow-sm" : "border-[var(--line)] bg-[#f8f9f8]"}`}>
                  <button type="button" disabled={busy} aria-expanded={isOpen} onClick={() => setOpenRegion(isOpen ? null : region)} className="group relative flex min-h-24 w-full items-center justify-between gap-3 overflow-hidden rounded-md border border-white bg-gradient-to-br from-white via-[#f3f6f5] to-[#e5ecea] px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 78% 22%, rgba(83,124,128,.22) 0 1px, transparent 1.5px), radial-gradient(circle at 86% 38%, rgba(24,0,173,.18) 0 1px, transparent 1.5px), linear-gradient(130deg, transparent 45%, rgba(83,124,128,.08) 46%, transparent 68%)", backgroundSize: "14px 14px, 18px 18px, auto" }} />
                    <span className="relative min-w-0"><span className="block text-[9px] font-semibold uppercase tracking-[.2em] text-[var(--muted-ink)]">Region {String(index + 1).padStart(2, "0")}</span><span className="mt-1 block truncate text-sm font-semibold text-[var(--ink)]">{region}</span><span className="mt-1 block text-[10px] text-[var(--muted-ink)]">{countries.length} countries</span></span>
                    <span aria-hidden="true" className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--muted-ink)] transition-transform ${isOpen ? "rotate-180" : ""}`}><svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  </button>
                  {isOpen && <ul aria-label={`${region} countries`} className="mt-2 grid max-h-48 grid-cols-2 gap-1 overflow-y-auto border-t border-[var(--line)] pt-2">
                    {countries.map((country) => <li key={country.code}>
                      <button type="button" disabled={busy} aria-pressed={selectedCode === country.code} onClick={() => onSelectCountry(country.code)} className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${selectedCode === country.code ? "bg-[#f8eee9] font-semibold text-[var(--accent-dark)]" : "text-[var(--ink)] hover:bg-white"}`}>
                        <Flag code={country.code} size={40} className="h-4 w-6 shrink-0" /><span className="min-w-0 flex-1 truncate">{country.name}</span>
                      </button>
                    </li>)}
                  </ul>}
                </div>;
              })}
            </div>
          )}
          {selected && <p className="mt-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted-ink)]">Selected nation: <strong className="text-[var(--ink)]">{selected.name}</strong></p>}
        </div>
      </div>
    </div>
  );
}
