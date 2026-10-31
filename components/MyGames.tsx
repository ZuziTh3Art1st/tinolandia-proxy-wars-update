'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCountryInfo } from '@/lib/countries';
import { GameState } from '@/lib/types';
import { Flag } from './Flag';

interface Row extends GameState {
  id: string;
}

export function MyGames({ uid }: { uid: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    // single-field filter: no composite index required; sorted client-side
    const q = query(collection(db, 'games'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameState) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      (err) => {
        console.error(err);
        setRows([]);
      }
    );
  }, [uid]);

  if (rows === null) return <p className="text-sm text-slate-500">Loading your games…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-500">No games yet. Start your first one above.</p>;

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.map((g) => {
        const info = getCountryInfo(g.humanCountry);
        const badge = g.status === 'ACTIVE'
          ? 'border-sky-200 bg-sky-50 text-sky-800'
          : g.outcome === 'VICTORY'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-100 text-slate-700';
        const label = g.status === 'ACTIVE' ? 'In progress' : g.outcome === 'VICTORY' ? 'Victory' : 'Defeated';
        return (
          <li key={g.id} className="overflow-hidden rounded-md border border-[var(--line)] bg-white transition hover:border-[var(--accent)] hover:shadow-sm">
            <Link href={`/game/${g.id}`} className="group flex min-h-[72px] items-center gap-2.5 p-3">
              <Flag code={g.humanCountry} size={40} className="h-7 w-10 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{info?.name ?? g.humanCountry}</div><div className="mt-1 text-[11px] text-slate-500">Round {g.round}</div></div>
              <span aria-hidden="true" className="text-sm text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">→</span>
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-3 py-2">
              <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${badge}`}>{label}</span>
              <span className="text-[10px] text-slate-500">{new Date(g.createdAt).toLocaleDateString()}</span>
              <Link href={`/game/${g.id}/replay`} className="ml-auto text-[10px] font-semibold text-[var(--accent-dark)] underline underline-offset-2">Replay</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
