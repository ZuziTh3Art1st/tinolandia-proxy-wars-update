'use client';

import React from 'react';
import { GameState } from '@/lib/types';

export function PlayersPanel({ game, isOwner }: { game: GameState; isOwner: boolean }) {
  const currentId = game.turnOrder[game.turnIndex];
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {game.turnOrder.map((id, i) => {
        const p = game.players.find((x) => x.id === id)!;
        const owned = game.countries.filter((c) => c.ownerId === id);
        const total = owned.reduce((a, c) => a + c.soldiers, 0);
        const active = id === currentId && game.status === 'ACTIVE';
        return (
          <li
            key={id}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
              active ? 'bg-[#f8eee9] ring-1 ring-[var(--accent)]/40' : 'bg-[#f5f6f5]'
            } ${p.eliminated ? 'opacity-40' : ''}`}
          >
            <span className="w-4 text-slate-500">{i + 1}</span>
            <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className={`min-w-0 flex-1 truncate font-bold ${p.eliminated ? 'line-through' : ''}`}>
              {p.name}
              {p.kind === 'human' ? (isOwner ? ' (you)' : ' (player)') : ' (NPC)'}
            </span>
            <span className="text-[10px] text-[var(--muted-ink)]">{p.eliminated ? 'Out' : `${owned.length} nations · ${total} troops`}</span>
            {active && <span className="text-[10px] font-semibold text-[var(--accent-dark)]">NOW</span>}
          </li>
        );
      })}
    </ul>
  );
}
