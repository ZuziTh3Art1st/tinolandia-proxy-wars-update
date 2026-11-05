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
    let owned: Row[] | null = null;
    let joined: Row[] | null = null;
    const update = () => {
      if (owned === null || joined === null) return;
      const byId = new Map<string, Row>();
      [...owned, ...joined].forEach((game) => byId.set(game.id, game));
      setRows([...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    const ownedQuery = query(collection(db, 'games'), where('ownerUid', '==', uid));
    const joinedQuery = query(collection(db, 'games'), where('participantUids', 'array-contains', uid));
    const offOwned = onSnapshot(ownedQuery, (snap) => { owned = snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameState) })); update(); }, (err) => { console.error(err); owned = []; update(); });
    const offJoined = onSnapshot(joinedQuery, (snap) => { joined = snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameState) })); update(); }, (err) => { console.error(err); joined = []; update(); });
    return () => { offOwned(); offJoined(); };
  }, [uid]);

  if (rows === null) return <p className="text-sm text-slate-500">Loading your games…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-500">No games yet. Start your first one above.</p>;

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.map((g) => {
        const mine = g.players.find((player) => player.uid === uid) ?? g.players.find((player) => player.id === 'player' && g.ownerUid === uid);
        const myCountry = mine ? g.startingCountries?.[mine.id] ?? g.humanCountry : g.humanCountry;
        const info = getCountryInfo(myCountry);
        const badge = g.status === 'LOBBY'
          ? 'border-violet-200 bg-violet-50 text-violet-800'
          : g.status === 'ACTIVE'
          ? 'border-sky-200 bg-sky-50 text-sky-800'
          : g.outcome === 'VICTORY'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-100 text-slate-700';
        const label = g.status === 'LOBBY' ? 'Lobby open' : g.status === 'ACTIVE' ? 'In progress' : g.outcome === 'VICTORY' ? 'Victory' : 'Defeated';
        const gameHref = g.status === 'LOBBY' ? `/multiplayer/lobby/${g.id}` : `/game/${g.id}`;
        return (
          <li key={g.id} className="overflow-hidden rounded-md border border-[var(--line)] bg-white transition hover:border-[var(--accent)] hover:shadow-sm">
            <Link href={gameHref} prefetch={false} aria-label={`${g.status === 'ACTIVE' ? 'Continue' : g.status === 'LOBBY' ? 'Open' : 'Review'} ${info?.name ?? myCountry} campaign`} className="group flex min-h-[72px] items-center gap-2.5 p-3">
              <Flag code={myCountry} size={40} className="h-7 w-10 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{info?.name ?? myCountry}</div><div className="mt-1 text-[11px] text-slate-500">Round {g.round}</div></div>
              <span aria-hidden="true" className="text-sm text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">→</span>
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-3 py-2">
              <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${badge}`}>{label}</span>
              <span className="text-[10px] text-slate-500">{new Date(g.createdAt).toLocaleDateString()}</span>
              {g.status !== 'LOBBY' && <Link prefetch={false} href={`/game/${encodeURIComponent(g.id)}/replay`} className="ml-auto text-[10px] font-semibold text-[var(--accent-dark)] underline underline-offset-2">Replay</Link>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
