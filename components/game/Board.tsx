"use client";

import React from "react";
import { GameState } from "@/lib/types";
import { Flag } from "../Flag";

interface Props {
  game: GameState;
  selectedSource: string | null;
  selectedTarget: string | null;
  pickable: boolean; // human is choosing attack source/target
  onPick: (code: string) => void;
  canPick?: (country: GameState['countries'][number]) => boolean;
  isOwner: boolean;
  playerId?: string;
}

export function Board({ game, selectedSource, selectedTarget, pickable, onPick, canPick = () => true, isOwner, playerId = 'player' }: Props) {
  const currentId = game.turnOrder[game.turnIndex];
  const playerOf = (id: string) => game.players.find((p) => p.id === id)!;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {game.countries.map((c) => {
        const owner = playerOf(c.ownerId);
        const isMine = owner.id === playerId && isOwner;
        const isSource = game.attack?.sourceId === c.code;
        const isTarget = game.attack?.targetId === c.code;
        const picked = selectedSource === c.code || selectedTarget === c.code;
        const hasTurn = c.ownerId === currentId && game.status === 'ACTIVE';
        const clickable = pickable && canPick(c);
        return (
          <button
            key={c.code}
            type="button"
            disabled={!clickable}
            onClick={() => onPick(c.code)}
            style={{ borderTopColor: owner.color }}
            className={`relative min-w-0 rounded-lg border border-[var(--line)] border-t-[4px] p-2 text-left transition ${isMine ? 'bg-[#fffaf7]' : 'bg-white'} ${
              clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-[#f9faf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]' : 'cursor-default'
            } ${picked ? 'ring-2 ring-[var(--accent)]' : ''} ${hasTurn ? 'turn-glow' : ''}`}
          >
            {(isSource || isTarget) && (
              <span
                className={`absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-black ${
                  isSource ? 'bg-[var(--accent)] text-white' : 'bg-rose-700 text-white'
                }`}
              >
                {isSource ? 'ATTACKER' : 'UNDER ATTACK'}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Flag code={c.code} size={40} className="h-4 w-6 shrink-0" />
              <span className="truncate text-[10px] font-semibold sm:text-xs">{c.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-1" title={isMine ? "This nation is under your command" : `Commanded by ${owner.name}`}>
              <span className="flex min-w-0 items-center gap-1 truncate text-[9px]" style={{ color: owner.color }}><span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: owner.color }} /><span className="truncate">{isMine ? 'YOUR COMMAND' : owner.name}</span></span>
              {isMine && <span className="shrink-0 rounded-sm bg-[#f2e5de] px-1 py-0.5 text-[7px] font-bold tracking-wide text-[var(--accent-dark)]">CONTROLLED</span>}
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <span key={c.soldiers} className="pop text-lg font-semibold leading-none text-[var(--ink)]">
                {c.soldiers}
              </span>
              <span className="text-[8px] text-[var(--muted-ink)]">base {c.initialSoldiers}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
