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

## Run locally

### Requirements

- Node.js 20.9 or newer
- npm
- A Firebase project with Authentication and Cloud Firestore enabled
- A Firebase service account for the server API
- A Groq API key only if you want AI battle narration; it is optional

### Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update.git
   cd tinolandia-proxy-wars-update
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the Firebase Admin credentials:

   ```dotenv
   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   `FIREBASE_ADMIN_PROJECT_ID` is optional if the project ID can be inferred from the public Firebase configuration. Keep `.env.local` private and never commit service account credentials.

3. For AI narration, optionally add:

   ```dotenv
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=openai/gpt-oss-20b
   ```

4. Configure Firebase Authentication providers (Email/Password and Google), add your local and deployed domains to the Firebase authorized domains list, and publish the repository’s `firestore.rules` to Cloud Firestore.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Yes | Firebase service account email for server-side operations |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Yes | Firebase service account private key; keep secret |
| `FIREBASE_ADMIN_PROJECT_ID` | Optional | Explicit Firebase project ID for the Admin SDK |
| `GROQ_API_KEY` | No | Enables Groq battle narration; built in narration is used otherwise |
| `GROQ_MODEL` | No | Groq model name; defaults to `openai/gpt-oss-20b` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Usually no | Override the app’s configured Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Usually no | Override the app’s configured Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Usually no | Override the app’s Firebase Authentication domain |

The `NEXT_PUBLIC_` values are browser configuration, not server secrets. Never expose Firebase Admin credentials or Groq keys in client code.

## Useful commands

```bash
npm run dev        # Run the development server
npm run build      # Create a production build
npm run start      # Serve a production build
npm run typecheck  # Run TypeScript checks
npm run simulate   # Simulate campaigns and check game invariants
npm run test:api   # Exercise API routes and game access rules
```

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

The project is configured for Vercel. Set the Firebase Admin environment variables in the Vercel project settings (and `GROQ_API_KEY` if desired), ensure the deployed domain is authorized in Firebase Authentication, and deploy the `main` branch. Confirm the deployment build succeeds before sharing it.

## Known limitations and review notes

- The privacy notice at `/privacy` is explicitly a draft and still needs the project operator’s contact information and retention details before public use.
- Achievements use local browser storage and can be edited or lost by clearing browser data.
- The leaderboard client currently uses Firestore client reads and writes, while `firestore.rules` denies client access outside campaign documents. Ranking updates may therefore fail until a server-side leaderboard API and appropriate validation are implemented.
- Multiplayer diplomacy currently implements non-aggression pacts; it does not include a broader negotiation or trade system.

## Assessment brief coverage

The app includes the core campaign loop, authentication, a NoSQL database, server-side game actions, input validation, battle and NPC behavior, a live UI, and additional campaign, tutorial, replay, achievement, and multiplayer features. `npm run typecheck`, `npm run simulate`, and `npm run test:api` provide local verification. These checks do not replace a manual review of deployed Firebase settings, multiplayer behavior across separate accounts, or the completed privacy notice. Marks depend on the examiner’s review; this README does not claim a particular score or full compliance.
