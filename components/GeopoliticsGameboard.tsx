"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { gameActionApi, ApiError } from "@/lib/api";
import { useGame } from "@/lib/useGame";
import { GameAction } from "@/lib/types";
import { Board } from "@/components/game/Board";
import { BattleArena } from "@/components/game/BattleArena";
import { Controls } from "@/components/game/Controls";
import { EventFeed } from "@/components/game/EventFeed";
import { PlayersPanel } from "@/components/game/PlayersPanel";
import { CampaignMap } from "@/components/game/CampaignMap";
import { CampaignShare } from "@/components/game/CampaignShare";
import { MultiplayerPanel } from "@/components/game/MultiplayerPanel";
import { Flag } from "@/components/Flag";
import { AchievementsBoard } from "@/components/game/AchievementsBoard";
import { Leaderboard } from "@/components/game/Leaderboard";
import { recordCampaignResult } from "@/lib/leaderboard";

const panel = "rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_2px_10px_rgba(28,45,46,.035)] sm:p-5";

export function GeopoliticsGameboard({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const { game, events, status } = useGame(gameId);
  const [source, setSource] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [deployCountry, setDeployCountry] = useState<string | null>(null);
  const [autoRoll, setAutoRoll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showCommentary, setShowCommentary] = useState(true);
  const [veteranFilter, setVeteranFilter] = useState("all");

  useEffect(() => {
    setShowCommentary(window.localStorage.getItem("tinolandia-commentary") !== "off");
  }, []);
  const toggleCommentary = () => setShowCommentary((visible) => {
    const next = !visible;
    window.localStorage.setItem("tinolandia-commentary", next ? "on" : "off");
    return next;
  });

  const act = useCallback(async (action: GameAction, fast = false) => {
    if (!game) return false;
    setBusy(true); setError("");
    try {
      await gameActionApi(gameId, action, { expectedVersion: game.version, fast });
      return true;
    } catch (err) {
      if (fast && err instanceof ApiError && err.stale) return false;
      setError(err instanceof ApiError && err.stale ? "The campaign updated. Your view is refreshing; try that move again." : err instanceof Error ? err.message : "That move could not be completed.");
      return false;
    } finally { setBusy(false); }
  }, [game, gameId]);

  const turnPlayer = game ? game.players.find((player) => player.id === game.turnOrder[game.turnIndex]) : undefined;
  const myPlayer = game?.players.find((player) => player.uid === user?.uid || (player.id === "player" && game.ownerUid === user?.uid));
  const isParticipant = !!myPlayer;
  const isHumanTurn = !!isParticipant && turnPlayer?.kind === "human" && (turnPlayer.uid === user?.uid || (turnPlayer.id === "player" && game?.ownerUid === user?.uid));
  const veteranRecords = useMemo(() => {
    if (!game) return [];
    return game.countries.map((country) => {
      const experience = country.battleRounds ?? 0;
      const level = Math.min(3, Math.floor(experience / 3));
      return { country, experience, level, rank: ["New formation", "Field tested", "Veteran", "Elite"][level] };
    }).filter((record) => record.experience > 0)
      .filter((record) => veteranFilter === "all" || String(record.level) === veteranFilter)
      .sort((a, b) => b.level - a.level || b.experience - a.experience);
  }, [events, game, veteranFilter]);

  // Record game result when campaign ends
  useEffect(() => {
    if (!game || game.status !== "FINISHED" || !user || !user.uid) return;
    const human = game.players.find((p) => p.uid === user.uid || (p.id === "player" && game.ownerUid === user.uid));
    if (!human) return;
    // Record once per game end (use version to avoid double-recording)
    const key = `recorded_${gameId}`;
    if (window.sessionStorage.getItem(key)) return;
    recordCampaignResult(game, human.name, user.uid, human.id).then(() => {
      window.sessionStorage.setItem(key, "1");
    });
  }, [game, user, gameId]);

  useEffect(() => {
    if (!game || game.status !== "ACTIVE" || !isParticipant || turnPlayer?.kind !== "npc" || busy || status !== "ready") return;
    const timer = window.setTimeout(() => { void act({ type: "NPC_STEP" }, true); }, 700);
    return () => window.clearTimeout(timer);
  }, [act, busy, game, isParticipant, status, turnPlayer?.kind]);

  useEffect(() => {
    if (!game || game.phase !== "ATTACKING" || !isHumanTurn || !autoRoll || busy) return;
    const timer = window.setTimeout(() => { void act({ type: "ROLL" }); }, 500);
    return () => window.clearTimeout(timer);
  }, [act, autoRoll, busy, game, isHumanTurn]);

  const pickCountry = (code: string) => {
    if (game?.phase === "REINFORCE") {
      if (game.countries.some((country) => country.code === code && country.ownerId === myPlayer?.id)) setDeployCountry(code);
      return;
    }
    const country = game?.countries.find((item) => item.code === code);
    const isMine = country && country.ownerId === myPlayer?.id;
    if (isMine) {
      setSource((current) => current === code ? null : code);
      setTarget(null);
      return;
    }
    if (!source) return;
    if (target === code) { setTarget(null); return; }
    setTarget(code);
  };

  if (status === "loading") return <p className="py-12 text-center text-sm text-[var(--muted-ink)]">Loading campaign…</p>;
  if (status === "missing" || status === "error" || !game) return <div className="py-12 text-center"><p className="text-sm text-[var(--muted-ink)]">{status === "missing" ? "Campaign not found." : "Could not load this campaign."}</p><Link className="mt-4 inline-block text-sm text-[var(--accent-soft)] underline" href="/">Return to the campaign desk</Link></div>;

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
      <section className={`${panel} flex flex-wrap items-center justify-between gap-2 py-3`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="eyebrow">ROUND {game.round}</p><span className="text-xs text-[var(--line)]">/</span><p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-ink)]">{game.phase.replaceAll("_", " ")}</p><span className="text-xs text-[var(--line)]">/</span><p className="text-sm text-[var(--ink)]">{turnPlayer?.name ?? "Campaign complete"}{isHumanTurn ? " · your turn" : turnPlayer?.kind === "human" ? " · player turn" : " · NPC turn"}</p></div>
        <div className="flex flex-wrap items-center gap-3"><p className="text-xs text-[var(--muted-ink)]">{game.countries.length} nations · {game.players.filter((p) => !p.eliminated).length} commanders active</p><button type="button" role="switch" aria-checked={showCommentary} onClick={toggleCommentary} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${showCommentary ? "border-[var(--line)] bg-white text-[var(--ink)]" : "border-slate-300 bg-slate-100 text-slate-600"}`}>Commentary {showCommentary ? "on" : "off"}</button></div>
      </section>
      <MultiplayerPanel game={game} gameId={gameId} />
      <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1.45fr)_minmax(340px,.9fr)]">
        <div className="space-y-4">
          <section className={panel}>
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="eyebrow">WORLD CAMPAIGN MAP</p><h2 className="section-title mt-1">Territory control</h2></div><span className="text-xs text-[var(--muted-ink)]">{isHumanTurn && game.phase === "ACTION" ? "Select your force, then a target" : isHumanTurn && game.phase === "REINFORCE" ? "Select one of your countries to deploy" : "Live positions"}</span></div>
            <CampaignMap game={game} onPick={pickCountry} isOwner={isParticipant} pickable={isHumanTurn && ["ACTION", "REINFORCE"].includes(game.phase) && !busy} selectedSource={game.phase === "REINFORCE" ? deployCountry : source} selectedTarget={target} />
            <details className="mt-3 overflow-hidden rounded-md border border-[var(--line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-semibold"><span>Territory roster</span><span className="text-[10px] font-normal text-[var(--muted-ink)]">{game.countries.length} nations · expand</span></summary>
              <div className="border-t border-[var(--line)] p-3"><Board game={game} selectedSource={game.phase === "REINFORCE" ? deployCountry : source} selectedTarget={target} pickable={isHumanTurn && ["ACTION", "REINFORCE"].includes(game.phase) && !busy} onPick={pickCountry} isOwner={isParticipant} playerId={myPlayer?.id} canPick={(country) => { const owned = country.ownerId === myPlayer?.id; return game.phase === "REINFORCE" ? owned : owned || !!source; }} /></div>
            </details>
          </section>
        </div>
        <aside className="space-y-4">
          {isParticipant && game.status === "ACTIVE" && isHumanTurn && <section className={panel}><p className="eyebrow mb-3">YOUR ORDERS</p><Controls game={game} act={(action) => act(action)} busy={busy} selSource={source} selTarget={target} setSelSource={setSource} setSelTarget={setTarget} autoRoll={autoRoll} setAutoRoll={setAutoRoll} deploySelected={deployCountry} setDeploySelected={setDeployCountry} /></section>}
          {isParticipant && game.status === "ACTIVE" && !isHumanTurn && <section className={`${panel} border-l-4 border-l-sky-600`}><p className="eyebrow">RIVAL TURN</p><p className="mt-2 text-base font-semibold">{turnPlayer?.name ?? "A rival commander"} is taking their turn</p><p className="mt-1 text-xs text-[var(--muted-ink)]">The campaign board updates as moves resolve.</p></section>}
          {!isParticipant && <p className={`${panel} text-sm text-[var(--muted-ink)]`}>Public view. Join this campaign to command an open nation.</p>}
          <section className={panel}><div className="mb-2 flex items-center justify-between"><p className="eyebrow">LATEST BATTLE</p>{game.lastBattle && <span className="text-xs text-[var(--muted-ink)]">Dice round {game.lastBattle.round}</span>}</div><BattleArena game={game} events={events} showCommentary={showCommentary} compact /></section>
          {game.status === "FINISHED" && <section className={`${panel} border-emerald-200 bg-gradient-to-br from-white to-emerald-50`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-base text-emerald-800" aria-hidden="true">★</span><div><p className="eyebrow">FINAL RESULT · ROUND {game.round}</p><h2 className="mt-0.5 text-base font-semibold text-[var(--ink)]">{game.winnerId === myPlayer?.id ? "Victory secured" : "Campaign concluded"}</h2></div></div><div className="text-right"><p className="text-[10px] text-[var(--muted-ink)]">Winning commander</p><p className="text-xs font-semibold">{game.players.find((player) => player.id === game.winnerId)?.name ?? "—"}</p></div></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/70 pt-3"><p className="text-xs text-[var(--muted-ink)]">{game.winnerId === myPlayer?.id ? `Your nation held ${game.countries.filter((country) => country.ownerId === myPlayer?.id).length} of ${game.countries.length} territories.` : "Your nation was eliminated from the campaign."}</p><Link href="/" className="rounded-md bg-[var(--accent)] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[var(--accent-dark)]">New campaign</Link></div>
          </section>}
          <details className={`${panel} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold"><span>Campaign history</span><span className="flex items-center gap-2 text-xs font-normal text-[var(--muted-ink)]">{events.length} recent entries · <span className="text-[var(--accent)] transition-transform group-open:rotate-180">⌄</span></span></summary>
            <div className="mt-3 space-y-4 border-t border-[var(--line)] pt-3">
              <div className="max-h-[min(45vh,28rem)] overflow-y-auto"><EventFeed events={events} showCommentary={showCommentary} /></div>
              <section className={panel}><p className="eyebrow mb-2">COMMANDERS</p><PlayersPanel game={game} isOwner={isParticipant} currentUid={user?.uid} /></section>
              <section className={panel}>
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">FIELD EXPERIENCE</p><h2 className="mt-1 text-sm font-semibold">Veteran formations</h2></div><label className="sr-only" htmlFor="veteran-rank-filter">Filter by formation level</label><select id="veteran-rank-filter" value={veteranFilter} onChange={(event) => setVeteranFilter(event.target.value)} className="rounded border border-[var(--line)] bg-white px-2 py-1.5 text-[11px]"><option value="all">All levels</option><option value="0">New formation</option><option value="1">Field tested</option><option value="2">Veteran</option><option value="3">Elite</option></select></div>
                <p className="mt-2 text-[11px] leading-5 text-[var(--muted-ink)]">Formations earn a field rank for every three battle rounds they take part in. Use the level selector to review them. Ranks are campaign records and do not change the exam's dice rules.</p>
                {veteranRecords.length ? <ul className="mt-3 space-y-2">{veteranRecords.slice(0, 6).map(({ country, experience, level, rank }) => <li key={country.code} className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-2.5 py-2"><Flag code={country.code} size={40} className="h-4 w-6 shrink-0"/><span className="min-w-0 flex-1 truncate text-xs font-medium">{country.name}</span><span className="text-[10px] text-[var(--muted-ink)]">{experience} rounds</span><span className="rounded-full bg-[#eef3f0] px-2 py-1 text-[9px] font-semibold text-[var(--accent-dark)]">Lv {level} · {rank}</span></li>)}</ul> : <p className="mt-3 rounded-md bg-[#f7f8f7] px-3 py-2.5 text-xs text-[var(--muted-ink)]">Formation records appear after your first battle round.</p>}
              </section>
              <AchievementsBoard />
              <CampaignShare campaignId={gameId}/>
            </div>
          </details>
          {/* Leaderboard on mobile (stacked below) and desktop (right side on larger screens) */}
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}
