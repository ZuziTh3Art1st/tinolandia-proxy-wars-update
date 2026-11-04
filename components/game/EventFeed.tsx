"use client";

import React from "react";
import { EventKind, GameEvent } from "@/lib/types";

const LABEL: Record<EventKind, string> = {
  SYSTEM: "UPDATE",
  TURN_START: "TURN",
  REINFORCE: "REINFORCE",
  TRANSFER: "TRANSFER",
  ATTACK_START: "ATTACK",
  BATTLE_ROUND: "BATTLE",
  CONQUEST: "CONQUEST",
  ATTACK_FAILED: "FAILED",
  ATTACK_STOPPED: "STOPPED",
  TURN_END: "TURN END",
  ELIMINATED: "ELIMINATED",
  GAME_OVER: "RESULT",
};

export function EventFeed({ events, showCommentary = true }: { events: GameEvent[]; showCommentary?: boolean }) {
  if (events.length === 0) return <p className="text-sm text-[var(--muted-ink)]">Moves will appear here as the campaign progresses.</p>;
  return (
    <ol className="space-y-2 pr-1">
      {events.map((event) => (
        <li key={event.seq} className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs leading-snug">
          <div className="flex items-start gap-2"><span className="mt-0.5 shrink-0 rounded-sm bg-[#eef1f0] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--muted-ink)]">{LABEL[event.kind] ?? "UPDATE"}</span><span className="min-w-0 flex-1 text-[var(--ink)]">{event.text}</span><span className="shrink-0 text-[10px] text-[var(--muted-ink)]">R{event.round}</span></div>
          {event.reason && <p className="mt-1 pl-1 text-[11px] text-[var(--muted-ink)]"><strong className="font-semibold text-[var(--ink)]">Decision basis:</strong> {event.reason}</p>}
          {showCommentary && event.commentary && <p className="mt-1 border-l-2 border-[var(--accent)]/50 pl-2 text-[11px] leading-5 text-[var(--muted-ink)]"><strong className="font-semibold text-[var(--ink)]">{event.commentarySource === 'ai' ? 'Groq AI:' : 'Field report:'}</strong> {event.commentary}</p>}
        </li>
      ))}
    </ol>
  );
}
