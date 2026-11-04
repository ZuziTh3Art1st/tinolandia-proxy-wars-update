"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DEFAULT_NPC_SETTINGS, NPC_PROFILES, NpcSettings, normaliseNpcSettings } from '@/lib/npcProfiles';
import TeamLanyardRail from '@/components/TeamLanyardRail';

const STORE_KEY = 'tinolandia-npc-settings-v1';
const panel = 'rounded-lg border border-[var(--line)] bg-white p-5';

export default function CommandersPage() {
  const [settings, setSettings] = useState<Record<string,NpcSettings>>(()=>Object.fromEntries(NPC_PROFILES.map(profile=>[profile.id,{...DEFAULT_NPC_SETTINGS}])));
  const [ready,setReady]=useState(false);
  useEffect(()=>{ try { const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'{}') as Record<string,unknown>; setSettings(Object.fromEntries(NPC_PROFILES.map(profile=>[profile.id,normaliseNpcSettings(saved[profile.id])]))); } catch { /* Start with sensible defaults if stored settings cannot be read. */ } finally { setReady(true); } },[]);
  const update=(id:string, patch:Partial<NpcSettings>)=>setSettings(current=>({...current,[id]:{...current[id],...patch}}));
  useEffect(()=>{ if(ready) localStorage.setItem(STORE_KEY,JSON.stringify(settings)); },[ready,settings]);
  const npcBadges = NPC_PROFILES.map((profile, index) => ({
    id: profile.id,
    name: profile.name,
    role: `Difficulty ${settings[profile.id]?.difficulty ?? DEFAULT_NPC_SETTINGS.difficulty}/5`,
    team: `${settings[profile.id]?.personality ?? DEFAULT_NPC_SETTINGS.personality} strategy · Profile ${String(index + 1).padStart(2, '0')}`,
    image: '/brand/tinolandia-mark.png',
    bio: `Historical study references: ${profile.leaders.map((leader) => `${leader.name} — ${leader.note}`).join(' ')}`,
    tags: profile.leaders.map((leader) => leader.name),
    tone: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5"><div><p className="eyebrow">CAMPAIGN SETUP · RIVAL COMMANDERS</p><h1 className="section-title mt-1 text-3xl">Shape the opposition</h1></div><Link href="/" className="rounded-md border border-[var(--line)] px-3 py-2 text-sm">Back to campaign desk</Link></header>
    <nav aria-label="Campaign tools" className="mt-5 flex flex-wrap gap-2 text-xs"><Link href="/commentary" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">LLM commentary</Link><Link href="/playthroughs" className="rounded-md border border-[var(--line)] bg-white px-3 py-2 font-semibold">Past playthroughs</Link></nav>
    <p className="my-5 max-w-3xl text-sm leading-6 text-[var(--muted-ink)]">Tune each rival’s challenge and decision style before starting a new campaign. Settings are saved in this browser and applied to the next campaign you create.</p>
    <div className="mb-5 rounded-md border border-[#d9c8bd] bg-[#fbf6f2] p-4 text-xs leading-5 text-[var(--muted-ink)]"><strong className="text-[var(--ink)]">Historical context:</strong> Leaders below are offered as study references for broad strategic approaches, not as character identities or role models. Their inclusion does not endorse or condone their actions, violence, policies, or regimes. Descriptions note harms and contested records where relevant.</div>
    <TeamLanyardRail items={npcBadges} eyebrow="RIVAL ROSTER · 09" heading="Meet the commanders" caption="Turn a badge over to see its historical study references, then set each rival’s challenge below." labels={{ flip: 'Inspect commander', back: 'Return to the roster', show: 'Commander' }} />
    <div className="grid gap-4 lg:grid-cols-2">{NPC_PROFILES.map(profile=>{const value=settings[profile.id]||{...DEFAULT_NPC_SETTINGS}; return <section key={profile.id} className={panel}>
      <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{profile.id.replace('_',' ').toUpperCase()}</p><h2 className="mt-1 text-lg font-semibold">{profile.name}</h2></div><label className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-ink)]">Difficulty <span className="block text-lg tracking-normal text-[var(--accent-dark)]">{value.difficulty}/5</span></label></div>
      <label className="mt-4 block text-xs font-medium">Challenge level <input aria-label={`${profile.name} difficulty`} type="range" min="1" max="5" step="1" value={value.difficulty} onChange={event=>update(profile.id,{difficulty:Number(event.target.value)})} className="mt-2 block w-full accent-[var(--accent)]"/><span className="mt-1 flex justify-between text-[10px] text-[var(--muted-ink)]"><span>Relaxed</span><span>Expert</span></span></label>
      <label className="mt-4 block text-xs font-medium">Decision style<select aria-label={`${profile.name} personality`} value={value.personality} onChange={event=>update(profile.id,{personality:event.target.value as NpcSettings['personality']})} className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"><option value="balanced">Balanced</option><option value="aggressive">Aggressive · accepts more risk</option><option value="defensive">Defensive · protects holdings</option><option value="opportunist">Opportunist · favours valuable openings</option></select></label>
      <label className="mt-4 block text-xs font-medium">Aggression <span className="float-right text-[var(--muted-ink)]">{value.aggression}%</span><input aria-label={`${profile.name} aggression`} type="range" min="0" max="100" value={value.aggression} onChange={event=>update(profile.id,{aggression:Number(event.target.value)})} className="mt-2 block w-full accent-[var(--accent)]"/></label>
      <label className="mt-3 block text-xs font-medium">Caution <span className="float-right text-[var(--muted-ink)]">{value.caution}%</span><input aria-label={`${profile.name} caution`} type="range" min="0" max="100" value={value.caution} onChange={event=>update(profile.id,{caution:Number(event.target.value)})} className="mt-2 block w-full accent-[var(--accent)]"/></label>
      <details className="mt-4 border-t border-[var(--line)] pt-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--accent-dark)]">Historical leaders for context</summary><ul className="mt-3 space-y-3">{profile.leaders.map(leader=><li key={leader.name} className="text-xs leading-5 text-[var(--muted-ink)]"><strong className="text-[var(--ink)]">{leader.name}.</strong> {leader.note}</li>)}</ul></details>
    </section>})}</div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={()=>setSettings(Object.fromEntries(NPC_PROFILES.map(profile=>[profile.id,{...DEFAULT_NPC_SETTINGS}])))} className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm">Reset defaults</button><Link href="/" className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Save and choose a country</Link></div>
  </div></main>;
}
