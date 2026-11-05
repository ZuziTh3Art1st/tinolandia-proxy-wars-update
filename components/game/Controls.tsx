"use client";

import React, { useEffect, useState } from 'react';
import { GameState, HumanAction } from '@/lib/types';
import { HUMAN_ID } from '@/lib/engine';
import { conquerProbability } from '@/lib/rules';

interface Props {
  game: GameState;
  act: (a: HumanAction) => Promise<boolean>;
  busy: boolean;
  selSource: string | null;
  selTarget: string | null;
  setSelSource: (c: string | null) => void;
  setSelTarget: (c: string | null) => void;
  autoRoll: boolean;
  setAutoRoll: (v: boolean) => void;
  deploySelected: string | null;
  setDeploySelected: (c: string | null) => void;
  playerId?: string;
}

const btn = 'rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 min-h-[44px]';
const primary = `${btn} bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]`;
const ghost = `${btn} border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[#f1f3f2]`;
const danger = `${btn} border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100`;
const select = 'w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none min-h-[44px]';

// ---------------------------------------------------------------------------
function DeployPanel({ game, act, busy, selected, onSelect, playerId }: Pick<Props, 'game' | 'act' | 'busy' | 'playerId'> & { selected: string | null; onSelect: (code: string | null) => void }) {
  const mine = game.countries.filter((c) => c.ownerId === (playerId ?? HUMAN_ID));
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const used = Object.values(alloc).reduce((a, b) => a + b, 0);
  const left = game.reinforcementsLeft - used;
  const set = (code: string, v: number) => setAlloc((a) => ({ ...a, [code]: Math.max(0, v) }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--ink)]">
        Deploy your <b className="text-[var(--accent-soft)]">{game.reinforcementsLeft}</b> new soldiers (2 per country you hold).{' '}
        <span className={left === 0 ? 'text-emerald-800' : 'text-[var(--muted-ink)]'}>{left} left to place.</span>
      </p>
      {selected && mine.some((country) => country.code === selected) && <p className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs text-[var(--muted-ink)]">Selected from map: <strong className="text-[var(--ink)]">{mine.find((country) => country.code === selected)?.name}</strong>. Use the row controls below to assign troops.</p>}
      <ul className="space-y-1.5">
        {mine.map((c) => (
          <li key={c.code} onClick={() => onSelect(c.code)} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${selected === c.code ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-transparent bg-[#f5f6f5]'}`}>
            <span className="min-w-0 flex-1 truncate font-bold">{c.name}</span>
            <span className="text-[var(--muted-ink)]">{c.soldiers}</span>
            <span className="w-8 text-center font-semibold text-emerald-800">{alloc[c.code] ? `+${alloc[c.code]}` : ''}</span>
            <button className="h-8 w-8 rounded border border-[var(--line)] bg-white font-semibold hover:bg-[#eef1f0] disabled:opacity-30 min-h-[40px]" disabled={!alloc[c.code]} onClick={() => set(c.code, (alloc[c.code] || 0) - 1)}>
              −
            </button>
            <button className="h-8 w-8 rounded border border-[var(--line)] bg-white font-semibold hover:bg-[#eef1f0] disabled:opacity-30 min-h-[40px]" disabled={left <= 0} onClick={() => set(c.code, (alloc[c.code] || 0) + 1)}>
              +
            </button>
            <button className="rounded border border-[var(--line)] bg-white px-2 text-[10px] font-semibold hover:bg-[#eef1f0] disabled:opacity-30 min-h-[40px]" disabled={left <= 0} onClick={() => set(c.code, (alloc[c.code] || 0) + left)}>
              all
            </button>
          </li>
        ))}
      </ul>
      <button className={primary} disabled={busy || left !== 0} onClick={() => act({ type: 'DEPLOY', allocations: alloc })}>
        Confirm deployment
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TransferPanel({
  game,
  act,
  busy,
  playerId,
  defaultFrom,
  defaultTo,
}: Pick<Props, 'game' | 'act' | 'busy' | 'playerId'> & { defaultFrom?: string; defaultTo?: string }) {
  const mine = game.countries.filter((c) => c.ownerId === (playerId ?? HUMAN_ID));
  const [from, setFrom] = useState(defaultFrom ?? '');
  const [to, setTo] = useState(defaultTo ?? '');
  const [count, setCount] = useState(1);

  const src = mine.find((c) => c.code === from);
  const max = src ? src.soldiers - 1 : 0;
  const valid = !!src && !!to && from !== to && count >= 1 && count <= max;

  useEffect(() => {
    if (count > max && max >= 1) setCount(max);
  }, [max, count]);

  if (mine.length < 2) return <p className="text-xs text-slate-500">Transfers need at least two countries under your control.</p>;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select className={select} value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">From…</option>
          {mine.map((c) => (
            <option key={c.code} value={c.code} disabled={c.soldiers < 2}>
              {c.name} ({c.soldiers})
            </option>
          ))}
        </select>
        <select className={select} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">To…</option>
          {mine.filter((c) => c.code !== from).map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.soldiers})
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={Math.max(1, max)}
          value={count}
          onChange={(e) => setCount(Math.floor(Number(e.target.value)) || 1)}
          className={`${select} w-24`}
        />
        <span className="text-xs text-slate-500">{src ? `up to ${max} (1 must stay behind)` : 'choose a source'}</span>
        <button className={`${ghost} ml-auto`} disabled={busy || !valid} onClick={() => act({ type: 'TRANSFER', fromId: from, toId: to, count })}>
          Transfer
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function Controls(props: Props) {
  const { game, act, busy, selSource, selTarget, setSelSource, setSelTarget, autoRoll, setAutoRoll } = props;
  const playerId = props.playerId ?? HUMAN_ID;
  const mine = game.countries.filter((c) => c.ownerId === playerId);
  const allies = (game.alliances ?? []).filter((alliance) => alliance.playerA === playerId || alliance.playerB === playerId).map((alliance) => alliance.playerA === playerId ? alliance.playerB : alliance.playerA);
  const foes = game.countries.filter((c) => c.ownerId !== playerId && !allies.includes(c.ownerId)).sort((a, b) => a.soldiers - b.soldiers);

  // ---- REINFORCE
  if (game.phase === 'REINFORCE') {
    return <DeployPanel key={`deploy-${game.round}-${game.turnIndex}`} game={game} act={act} busy={busy} playerId={playerId} selected={props.deploySelected} onSelect={props.setDeploySelected} />;
  }

  // ---- ATTACKING
  if (game.phase === 'ATTACKING' && game.attack) {
    const src = game.countries.find((c) => c.code === game.attack!.sourceId)!;
    const tgt = game.countries.find((c) => c.code === game.attack!.targetId)!;
    const p = conquerProbability(src.soldiers, tgt.soldiers);
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink)]">
          <b className="text-[var(--accent-soft)]">{src.name}</b> ({src.soldiers}) is attacking <b className="text-rose-700">{tgt.name}</b> ({tgt.soldiers}).{' '}
          <span className="text-[var(--muted-ink)]">Estimated chance to conquer: {Math.round(p * 100)}%.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button className={primary} disabled={busy || autoRoll} onClick={() => act({ type: 'ROLL' })}>
            Roll dice
          </button>
          <button className={ghost} disabled={busy && !autoRoll} onClick={() => setAutoRoll(!autoRoll)}>
            {autoRoll ? 'Pause auto-roll' : 'Auto-roll'}
          </button>
          <button
            className={danger}
            disabled={busy}
            onClick={() => {
              setAutoRoll(false);
              act({ type: 'STOP_ATTACK' });
            }}
          >
          Stop attack (ends turn)
          </button>
        </div>
        <p className="text-[11px] text-slate-500">The attack ends when you conquer {tgt.name}, are left with 1 soldier, or stop. Transfers are locked until then.</p>
      </div>
    );
  }

  // ---- POST_ATTACK (conquered)
  if (game.phase === 'POST_ATTACK' && game.attack) {
    const conquered = game.countries.find((c) => c.code === game.attack!.targetId)!;
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-800">
          You conquered <b>{conquered.name}</b> and it now holds {conquered.soldiers} soldiers. Reinforce it from your attacking country if you like, then end your turn.
        </p>
        <TransferPanel key={`post-${game.version}`} game={game} act={act} busy={busy} playerId={playerId} defaultFrom={game.attack.sourceId} defaultTo={game.attack.targetId} />
        <button className={primary} disabled={busy} onClick={() => act({ type: 'END_TURN' })}>
          End turn
        </button>
      </div>
    );
  }

  // ---- ACTION
  const src = mine.find((c) => c.code === selSource);
  const tgt = foes.find((c) => c.code === selTarget);
  const canAttack = !!src && !!tgt && src.soldiers >= 2;
  const p = src && tgt ? conquerProbability(src.soldiers, tgt.soldiers) : null;

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-ink)]">Attack (one per turn)</h3>
        <p className="text-[11px] text-slate-500">Tip: tap your country, then tap an enemy country on the map.</p>
        <div className="grid grid-cols-2 gap-2">
          <select className={select} value={selSource ?? ''} onChange={(e) => setSelSource(e.target.value || null)}>
            <option value="">Attack from…</option>
            {mine.map((c) => (
              <option key={c.code} value={c.code} disabled={c.soldiers < 2}>
                {c.name} ({c.soldiers})
              </option>
            ))}
          </select>
          <select className={select} value={selTarget ?? ''} onChange={(e) => setSelTarget(e.target.value || null)}>
            <option value="">Target…</option>
            {foes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.soldiers})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={primary}
            disabled={busy || !canAttack}
            onClick={async () => {
              if (src && tgt) await act({ type: 'ATTACK', sourceId: src.code, targetId: tgt.code });
            }}
          >
            Launch attack
          </button>
          {p !== null && (
            <span className="text-xs text-slate-400">
              Estimated chance to conquer: <b className={p >= 0.5 ? 'text-emerald-800' : 'text-amber-800'}>{Math.round(p * 100)}%</b>
            </span>
          )}
          {src && src.soldiers < 2 && <span className="text-xs text-rose-700">Needs 2+ soldiers.</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-ink)]">Transfer soldiers</h3>
        <TransferPanel key={`t-${game.version}`} game={game} act={act} busy={busy} playerId={playerId} />
      </section>

      <button className={ghost} disabled={busy} onClick={() => act({ type: 'END_TURN' })}>
        End turn
      </button>
    </div>
  );
}
