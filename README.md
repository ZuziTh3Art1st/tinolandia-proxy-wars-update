# Tinolandia Proxy Wars™

A Risk-inspired, single-player geopolitics game. Pick **any country in the world** (234, from Worldometer's 2026 population table), face **9 configurable NPC commanders**, and conquer all 10 nations to win.

🔗 **Live on Vercel:** https://tinolandia-proxy-wars-update.vercel.app  
📁 **Source:** https://github.com/ZuziTh3Art1st/tinolandia-proxy-wars-update

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Firebase Authentication · Cloud Firestore · Firebase Admin SDK · optional Groq LLM battle commentary

---

## 1. Run it locally

You need [Node.js 20.9+](https://nodejs.org). In a terminal, inside this folder:

```powershell
npm install
copy .env.example .env.local   # then fill in .env.local (step 2 and 3 below)
npm run dev
```

Open `http://localhost:3000`.

---

## 2. Firebase setup (console.firebase.google.com → your project)

1. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
2. **Firestore Database:** create a database (Native mode).
3. **Firestore → Rules:** paste [`firestore.rules`](firestore.rules) and click **Publish**.  
   (Public read for shared links; no browser writes — only the server can write.)
4. **Project settings → Service accounts → Generate new private key.** Open the `.json` and copy  
   `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL` and `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`  
   into `.env.local` (keep the `\n` characters and quotes). **Never commit this file.**

---

## 3. Groq key (optional AI battle commentary)

Create a key at https://console.groq.com/keys and set `GROQ_API_KEY` in `.env.local`.  
Without it, the game still works — it falls back to built-in template commentary.  
`GROQ_MODEL` defaults to `openai/gpt-oss-20b`.

---

## 4. Deploy to Vercel

**Via GitHub (recommended):**

```powershell
git init
git add .
git commit -m "Tinolandia geopolitics"
```

1. Create an empty repo on GitHub and push to it.
2. On https://vercel.com → **Add New → Project → Import** the repo (Next.js auto-detected).
3. Before deploying, open **Project Settings → Environment Variables** and add:
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
4. Click **Deploy**. Copy the `https://….vercel.app` URL.
5. Firebase console → **Authentication → Settings → Authorized domains** → add your `….vercel.app` host (needed for Google sign-in).

**CLI alternative:** `npm i -g vercel`, `vercel login`, `vercel link --repo`, then `vercel deploy --prod`.

---

## 5. How it meets the brief

| Requirement | Where |
|---|---|
| Pick any country; 9 NPC rivals | `components/CountryPicker.tsx`, `lib/engine.ts → createGame` |
| Soldiers from population table | `lib/rules.ts → soldiersFromPopulation` |
| Random first player, rounds, +2/country from round 2 | `lib/engine.ts` (`beginTurn`, `advanceTurn`) |
| One attack + transfers per turn | `doStartAttack`, `doTransfer` |
| Dice: `min(attacker−1, defender)`, die-vs-die, ties kill nobody | `lib/rules.ts → resolveRound` |
| Conquest bonus `Max(2, ⌊value/2⌋)` | `conquestBonus`, `POST_ATTACK` phase |
| Elimination / win at 10/10 | `afterConquest` |
| NPC turns with AI decisions | `lib/npc.ts`, `lib/npcProfiles.ts`, `app/commanders/page.tsx` |
| Live board, campaign map, dice, results | `Board`, `CampaignMap`, `BattleArena` |
| Shareable campaign links, live spectating | `CampaignShare`, real-time WebSocket/firestore updates |
| Saved timeline with replay | `CampaignReplay` |
| 5-level armour models (breastplate, Chalcidian) | `SoldierKitPicker`, `public/assets/armor/` |
| Guided tutorial mini-game | `app/tutorial/page.tsx` |
| Privacy notice acknowledgement per account | `app/privacy/page.tsx`, `app/api/privacy/acknowledge/route.ts` |
| LLM commentary (Groq + template fallback) | `lib/commentary.ts` |
| Server-authoritative dice (anti-cheat) | `app/api/game/action/route.ts` |
| Firestore + deployed | Cloud Firestore, Vercel |

**NPC strategy:** scores every (own → enemy) country pair using exact conquest probability (dynamic programming over dice rules) plus payoff (territory gained, armies destroyed, rival eliminated). Difficulty adjusts the odds threshold; personality tunes attack/withdraw behaviour.

**Bonus:** anti-cheating (dice rolled only server-side, every change a transaction) + share a URL to let anyone watch live.

---

## 6. Tests (no Firebase needed)

```powershell
npm run simulate   # hundreds of full games, checking invariants every step
npm run test:api   # real API routes against in-memory Firestore
```

---

## 7. Project layout

```
app/                    pages + API routes (/api/game/create, /api/game/action)
components/             UI (picker, board, battle arena, controls, event feed)
lib/rules.ts            dice / population / conquest rules + win probability
lib/engine.ts           game state machine (pure, no I/O)
lib/npc.ts              NPC brain
lib/commentary.ts       Groq + template commentary
lib/server/             Firebase Admin + request auth (server only)
firestore.rules         security rules
scripts/                simulation + API tests
```

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| "Could not find the Next.js package" | Run `npm install` inside this project folder (the one with `package.json`). |
| "Server is not configured…" | `FIREBASE_ADMIN_*` vars missing (`.env.local` locally, Vercel env vars live). Restart / redeploy. |
| "Could not read this game" | Publish `firestore.rules` (step 2). |
| Google sign-in: "unauthorized domain" | Add your domain under Authentication → Settings → Authorized domains. |
| "operation-not-allowed" | Enable that sign-in method in Firebase Authentication. |
| Commentary is plain, not AI | `GROQ_API_KEY` missing or invalid; gameplay is unaffected. |

---

**Free-tier note:** a full game writes ~700 Firestore documents; the Spark free plan allows 20,000 writes/day (~25+ games/day).