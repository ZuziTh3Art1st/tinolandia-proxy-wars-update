# Tinolandia Proxy Wars™

Tinolandia Proxy Wars is a browser based, turn based geopolitical strategy simulation created by Ashley Tinotenda Buzuzi. Choose a nation, command its forces, and compete with rival commanders on a live world map.

- **Live app:** <https://tinolandia-proxy-wars-update.vercel.app>
- **Source:** <https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update>

## Features

- Campaigns with 10 nations: the player and nine NPC commanders.
- Country selection across the world, with starting forces determined by population.
- Dice based attacks, reinforcements, troop transfers, conquest bonuses, elimination, and victory conditions.
- NPC personalities, configurable difficulty, and decision explanations in the event history.
- Live interactive campaign map, battle reports, commentary, campaign replay, and completed campaign archive.
- Optional Groq generated battle narration. The game uses built in factual narration if Groq is not configured or unavailable. Groq narrates battles; NPC decisions are made by the game’s rules and strategy engine.
- Multiplayer lobbies with join codes, player turns, and diplomacy pacts.
- Tutorial, achievements, commander profiles, and campaign rankings.
- Account sign in with Firebase Authentication.

## Game rules

Each campaign contains 10 countries. Starting soldiers are based on the selected country’s population band. During a turn, a commander may deploy reinforcements, make one attack or end their turn, and transfer soldiers between owned countries when the rules allow. At least one soldier must remain in a country after a transfer.

An attack requires at least two soldiers. The attacker rolls up to one fewer die than the number of attacking soldiers; the defender rolls up to one die per defending soldier. Dice are compared in descending pairs. The lower die loses one soldier; tied dice cause no loss. Attacks continue until the country is conquered, the attacker is reduced to one soldier, or the attacker stops. Conquest grants a troop bonus based on the country’s original strength. A commander who loses all their countries is eliminated; the last surviving commander wins.

In multiplayer, the lobby host starts the game after players join. Unfilled commander seats are controlled by NPCs. Non-aggression pacts prevent the participating commanders from attacking each other while the pact remains active.

## Technology

| Area | Technology |
|---|---|
| Web app | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Authentication | Firebase Authentication (email/password and Google) |
| Database | Cloud Firestore (NoSQL) |
| Server side access | Firebase Admin SDK, Next.js route handlers |
| Optional battle narration | Groq API |
| Hosting | Vercel |

## Architecture and security

- `lib/engine.ts`, `lib/rules.ts`, and `lib/npc.ts` implement the game state transitions, combat rules, and NPC strategy.
- `app/api/game/` contains the server routes for creating campaigns, actions, multiplayer joins/starts, and diplomacy.
- Game actions are validated server side. Dice and authoritative state changes are performed in Firestore transactions; the browser submits actions and displays the resulting state.
- Firebase ID tokens are verified by the server. Firestore rules permit reading shared campaign state and events but deny client writes; the Firebase Admin SDK performs server writes.
- Groq calls are made server side. An unavailable or unconfigured Groq service does not prevent play.
- Achievements are currently stored in browser `localStorage`, so they are tied to that browser and should not be treated as tamper proof. Game state is server authoritative, but this does not make locally stored achievements cheat resistant.

## Project map

```text
app/                         Pages and API routes
  api/game/                  Campaign, action, multiplayer, and diplomacy endpoints
  game/[id]/                 Active campaign and replay
  multiplayer/               Multiplayer lobby and join flow
  playthroughs/              Completed campaign archive
  achievements/              Achievements page
  tutorial/                  Interactive tutorial
components/                  Game board, map, controls, reports, and pages
lib/                         Rules, state engine, NPCs, Firebase, and commentary
firestore.rules              Client database access rules
scripts/                     Simulation and API verification scripts
```

## Deployment

The application is deployed on Vercel. Its production environment uses Firebase Authentication, Cloud Firestore, and Firebase Admin credentials for server-side game operations. Groq credentials are optional; built in battle narration remains available when Groq is not configured.

| Vercel environment variable | Purpose |
|---|---|
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase service account email used by server routes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Secret Firebase service account private key |
| `FIREBASE_ADMIN_PROJECT_ID` | Optional explicit project ID for the Admin SDK |
| `GROQ_API_KEY` | Optional key for AI battle narration |
| `GROQ_MODEL` | Optional narration model name; defaults to `openai/gpt-oss-20b` |

Firebase Authentication must have the deployed domain authorized, and the repository’s `firestore.rules` must be published to Cloud Firestore. Keep Admin and Groq credentials private.

## Current limitations

- The privacy notice at `/privacy` is explicitly a draft and still needs the project operator’s contact information and retention details before public use.
- Achievements use local browser storage and can be edited or lost by clearing browser data.
- The leaderboard client currently uses Firestore client reads and writes, while `firestore.rules` denies client access outside campaign documents. Ranking updates may therefore fail until a server-side leaderboard API and appropriate validation are implemented.
- Multiplayer diplomacy currently implements non-aggression pacts; it does not include a broader negotiation or trade system.

