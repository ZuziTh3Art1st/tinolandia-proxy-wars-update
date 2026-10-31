# Tinolandia Proxy Wars™

A Risk-inspired, single-player geopolitical strategy game. Pick any country in the world (234 countries, from Worldometer's 2026 population table), face 9 NPC commanders, and conquer all 10 nations to win.

🔗 **Live app:** https://tinolandia-proxy-wars-update.vercel.app  
📁 **Source:** https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update  

---

## What the game is

**Tinolandia Proxy Wars** is a turn-based geopolitical simulator played in the browser.

- **Pick your nation:** Choose any country from a list of 234 (real 2026 population data). Your starting soldiers scale with population — small nations start fragile, large nations start strong.
- **Face 9 NPC commanders:** Each AI has a personality profile (aggressive, defensive, expansionist) and scores attack targets using exact conquest probability derived from the dice rules.
- **Take turns:** Each round you may transfer soldiers between your countries, launch one attack, or skip. From round 2 you deploy 2 reinforcements per country you control.
- **Combat:** Dice-based battles. Attacker rolls (attacker − 1 dice), defender rolls (defender dice). Dice are paired die-for-die: higher roll wins each pairing, ties kill nobody. Keep rolling until you conquer, fall to 1 soldier, or call it off.
- **Conquest:** Wiping out a country's defenders lets you take it and gain bonus soldiers (Max(2, half the country's original soldier value)).
- **Win / lose:** Conquer all 10 nations to win. Lose every country and you're eliminated.
- **Spectate live:** Share your game URL — anyone can watch the board update in real time. Only the game owner can play turns.

---

## Technologies (deployed on Vercel)

| Layer | Technology |
|---|---|
| Frontend framework | Next.js (App Router), React 19 |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Authentication | Firebase Authentication (email/password + Google) |
| Database | Cloud Firestore (NoSQL) |
| Server SDK | Firebase Admin SDK |
| AI commentary | Groq LLM (optional — template fallback if no API key) |
| Hosting | Vercel (serverless functions) |

---

## Architecture

- **Server-authoritative:** All dice rolls and state changes execute on the server inside a single Firestore transaction. The browser cannot edit soldiers or re-roll battles.
- **API routes:** `/api/game/create` starts a game; `/api/game/action` validates the Firebase ID token, checks ownership, runs the rules engine, and saves state + events atomically.
- **Real-time updates:** Game pages use Firestore live listeners so spectators see moves as they happen.
- **Security:** Firestore rules allow public read (so shared links work) but deny all client writes. Only the authenticated server (Firebase Admin) can mutate game state.
- **Authentication:** Firebase ID tokens are verified server-side on every API request; session expiry and stale-version conflicts are handled explicitly.

---

## Project structure

```
app/                    Next.js App Router pages + API routes
  game/[id]/page.tsx    The live game board (client component)
  api/game/create/route.ts   POST — create a new game session
  api/game/action/route.ts   POST — execute a human or NPC action
components/             React UI: CountryPicker, Board, BattleArena, Controls, EventFeed, PlayersPanel, etc.
lib/rules.ts            Dice math, population→soldiers table, conquest bonus, win-probability DP
lib/engine.ts           Pure game state machine (turns, phases, attacks, transfers, conquest)
lib/npc.ts              NPC decision engine — scores (source, target) pairs using exact conquest probability
lib/commentary.ts       Groq LLM battle narration with instant template fallback
lib/server/             Firebase Admin initialization + request authentication (server only)
firestore.rules         Security rules
scripts/                Game simulation (invariant checks) and API route tests
```

---

## Troubleshooting (deployed app)

| Symptom | Likely cause / fix |
|---|---|
| Sign-in fails with "could not record privacy notice" | Server lacks `FIREBASE_ADMIN_*` credentials. They are set in **Vercel Project Settings → Environment Variables**. |
| Google sign-in: "unauthorized domain" | Add `tinolandia-proxy-wars-update.vercel.app` to Firebase Console → Authentication → Settings → Authorized domains. |
| Game page won't load / "Could not read this game" | Firestore rules not published, or invalid game ID. |
| Commentary is plain text, not AI | `GROQ_API_KEY` is missing or invalid in Vercel env vars. Gameplay is unaffected. |
| "Server is not configured" error | `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` missing from Vercel env vars. |
| Changes not appearing after pushing to GitHub | Vercel auto-deploys on push to `main`; check the Vercel dashboard deploy logs. |

---

## Free-tier note

A full game writes roughly 700 Firestore documents. The Firebase Spark free plan allows 20,000 writes/day (~25+ games/day).