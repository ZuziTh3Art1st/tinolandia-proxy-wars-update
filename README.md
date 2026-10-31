# Tinolandia Proxy Wars™

A Risk-inspired, single-player geopolitical strategy game. Pick any country in the world (234 countries, from Worldometer's 2026 population table), face 9 NPC commanders, and conquer all 10 nations to win.

🔗 **Live app:** https://tinolandia-proxy-wars-update.vercel.app  
📁 **Source:** https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update  

---

## How the app runs

### Deployed version (Vercel)
The app is deployed on Vercel and accessible at the live URL above. No installation required — open the link in any modern browser.

- **Login/Register:** Create an account with email/password, or sign in with Google.
- **Play:** Start a game, pick a nation, and take turns against 9 AI commanders.
- **Spectate:** Share your game link — anyone can watch the board update in real time. Only the game owner can play turns.

### Run locally
To run the app on your own machine:

**Requirements:** Node.js 20.9+

```powershell
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env.local   # then fill in the values below

# 3. Start the dev server
npm run dev
```

Open `http://localhost:3000`.

### Environment variables (`.env.local`)

| Variable | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config | Yes (defaults work for `tinolandia---geopolotics`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase service account email | Yes — for server writes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase service account private key | Yes — for server writes |
| `GROQ_API_KEY` | Groq LLM key for AI commentary | Optional (template fallback used if missing) |
| `GROQ_MODEL` | Groq model name | Optional (defaults to `openai/gpt-oss-20b`) |

Get `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY` from Firebase Console → Project Settings → Service Accounts → Generate new private key.

---

## How to play

1. **Sign in** with email/password or Google.
2. **Start a game:** Pick your country from the world list (search or random). 9 NPC rivals are drawn automatically.
3. **Take your turn:** Each round you may transfer soldiers, launch one attack, or skip. From round 2, you also deploy 2 reinforcements per country you control.
4. **Combat:** Dice-based battles — attacker rolls (attacker−1 dice), defender rolls (defender dice). Higher die wins each pairing; ties kill nobody. Keep rolling until you conquer, fall to 1 soldier, or stop.
5. **Win:** Conquer all 10 nations. Lose all your countries and you're eliminated.
6. **Watch live:** Copy your game URL and share it — visitors see the board update in real time as turns play out.

---

## Project structure

```
app/                    Next.js App Router pages + API routes (/api/game/create, /api/game/action)
components/             React UI components (CountryPicker, Board, BattleArena, Controls, EventFeed, etc.)
lib/rules.ts            Dice, population, conquest rules, and win-probability math
lib/engine.ts           Game state machine (pure logic, no I/O)
lib/npc.ts              NPC AI brain — scores targets using exact conquest probability
lib/commentary.ts       Groq LLM + template battle commentary
lib/server/             Firebase Admin SDK + request auth (server-side only)
firestore.rules         Security rules (public read, server-only write)
scripts/                Game simulation and API tests
```

---

## Architecture notes

- **Server-authoritative:** All dice rolls and state changes happen on the server in a single Firestore transaction. The browser cannot edit soldiers or re-roll battles.
- **NoSQL:** Game state and events are stored in Cloud Firestore.
- **Real-time:** Game pages stream updates via Firestore listeners so spectators see moves live.
- **Auth:** Firebase Authentication (email/password + Google). Firebase ID tokens are verified server-side on every API call.

---

## Deployment

The app is deployed on Vercel. To redeploy after changes:

1. Commit and push to `main` on GitHub.
2. Vercel auto-detects the Next.js project and rebuilds/deploys automatically.
3. Ensure the 4 Firebase/Groq env vars are set in **Vercel Project Settings → Environment Variables**.

---