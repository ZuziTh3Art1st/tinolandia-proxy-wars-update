import { auth } from './firebase';
import { GameAction } from './types';

export class ApiError extends Error {
  status: number;
  stale: boolean;
  constructor(message: string, status: number, stale = false) {
    super(message);
    this.status = status;
    this.stale = stale;
  }
}

async function post(path: string, body: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new ApiError('Please log in first.', 401);
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.stale === true);
  return data;
}

export const createGameApi = (countryCode: string, npcSettings?: Record<string, unknown>, multiplayer = false): Promise<{ gameId: string; lobbyCode?: string }> => post('/api/game/create', { countryCode, npcSettings, multiplayer });

export const joinGameApi = (lobbyCode: string): Promise<{ ok: true; gameId: string; commander: string }> => post('/api/game/join', { lobbyCode });

export const startLobbyApi = (gameId: string): Promise<{ ok: true }> => post('/api/game/start', { gameId });

export const gameActionApi = (
  gameId: string,
  action: GameAction,
  opts: { expectedVersion?: number; fast?: boolean } = {}
): Promise<{ ok: true; version: number }> => post('/api/game/action', { gameId, action, ...opts });
