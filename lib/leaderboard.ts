/**
 * Tinolandia Leaderboard System
 *
 * Tracks player campaign stats across games in Firestore.
 * Updated when a game ends (VICTORY or DEFEAT).
 */

import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { GameState } from "./types";

export interface PlayerLeaderboardEntry {
  uid: string;
  name: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  conquests: number;
  battlesWon: number;
  roundsSurvived: number;
  rivalsEliminated: number;
  winRate: number;
  lastPlayed: string;
}

export const LEADERBOARD_COLLECTION = "player_leaderboard";

export function playerDocRef(uid: string) {
  return doc(db, LEADERBOARD_COLLECTION, uid);
}

/** Record the result of a finished campaign for the human player. */
export async function recordCampaignResult(game: GameState, humanName: string, humanUid: string, playerId = "player") {
  const human = game.players.find((p) => p.id === playerId);
  if (!human) return;

  const won = game.winnerId === human.id || (!game.winnerId && human.id === "player" && game.outcome === "VICTORY");
  const humanCountries = game.countries.filter((c) => c.ownerId === human.id);
  const conquests = Math.max(0, humanCountries.length - 1); // subtract starting country
  // Count battles won from lastBattle if it was a conquest by the human
  const battlesWon = game.lastBattle && game.lastBattle.conquered && game.lastBattle.attackerOwnerName === humanName ? 1 : 0;
  const roundsSurvived = game.round;
  const rivalsEliminated = game.players.filter((p) => p.id !== human.id && p.eliminated).length;

  const ref = playerDocRef(humanUid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Create new entry
    const gamesPlayed = 1;
    const entry: PlayerLeaderboardEntry = {
      uid: humanUid,
      name: humanName,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      gamesPlayed,
      conquests,
      battlesWon,
      roundsSurvived,
      rivalsEliminated,
      winRate: won ? 100 : 0,
      lastPlayed: new Date().toISOString(),
    };
    await setDoc(ref, entry);
  } else {
    // Update existing entry
    await updateDoc(ref, {
      wins: increment(won ? 1 : 0),
      losses: increment(won ? 0 : 1),
      gamesPlayed: increment(1),
      conquests: increment(conquests),
      battlesWon: increment(battlesWon),
      roundsSurvived: increment(roundsSurvived),
      rivalsEliminated: increment(rivalsEliminated),
      lastPlayed: new Date().toISOString(),
      name: humanName, // keep name current
    });
    // winRate will be computed on read
  }
}

/** Fetch top N players from the leaderboard, ranked by wins then win rate. */
export async function fetchLeaderboard(limitCount = 10): Promise<PlayerLeaderboardEntry[]> {
  const q = query(collection(db, LEADERBOARD_COLLECTION), orderBy("wins", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => d.data() as PlayerLeaderboardEntry);
  // Compute win rate client-side
  return entries.map((e) => ({
    ...e,
    winRate: e.gamesPlayed > 0 ? Math.round((e.wins / e.gamesPlayed) * 100) : 0,
  }));
}
