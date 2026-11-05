'use client';

import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import { GameEvent, GameState } from './types';

export type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';

/** Live (real-time) subscription to a game and its latest events. Works for anyone with the link. */
export function useGame(gameId: string | undefined) {
  const [game, setGame] = useState<GameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [eventsReady, setEventsReady] = useState(false);
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    if (!gameId) return;
    setStatus('loading');
    setEventsReady(false);
    const offGame = onSnapshot(
      doc(db, 'games', gameId),
      (snap) => {
        if (!snap.exists()) return setStatus('missing');
        setGame(snap.data() as GameState);
        setStatus('ready');
      },
      (err) => {
        console.error('Game subscription error:', err);
        setStatus('error');
      }
    );
    const offEvents = onSnapshot(
      query(collection(db, 'games', gameId, 'events'), orderBy('seq', 'desc'), limit(80)),
      (snap) => {
        setEvents(snap.docs.map((d) => d.data() as GameEvent));
        setEventsReady(true);
      },
      (err) => {
        console.error('Events subscription error:', err);
        setEventsReady(true);
      }
    );
    return () => {
      offGame();
      offEvents();
    };
  }, [gameId]);

  return { game, events, eventsReady, status };
}
