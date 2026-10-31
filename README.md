# Tinolandia Proxy Wars™

A Risk-inspired, single-player geopolitics game. Pick **any country in the world** (234, from Worldometer's 2026 population
table), face **9 configurable NPC commanders**, and conquer all 10 nations to win.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Firebase Authentication · Cloud Firestore · Firebase Admin SDK · optional Groq battle commentary.

---------------------------------------------------------------------------------------------------

## 1. Run it locally

You need [Node.js 20.9+](https://nodejs.org). In a terminal, inside this folder:

```powershell
npm install
copy .env.example .env.local      # then fill in .env.local (step 2 and 3 below)
npm run dev
```

Open http://localhost:3000.

The campaign desk links to a short interactive tutorial and rival commander setup. NPC settings are saved in the current
browser and copied into newly created campaigns. The campaign map uses Natural Earth country boundaries, commander colors,
clickable campaign territories, troop markers and zoom. Battle results use pip dice to show the server-recorded rolls.

## 2. One-time Firebase setup (console.firebase.google.com → your project)

1. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
2. **Firestore Database:** make sure a database exists (Native mode).
3. **Firestore Database → Rules:** replace everything with the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
   These rules let *anyone read* a game (so shared links work) but let *no browser write*. Only the server can.
4. **Project settings → Service accounts → Generate new private key.** Open the downloaded `.json` file and copy
   `client_email` and `private_key` into `.env.local` as `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`
   (keep the `\n` characters; keep the quotes). **Never commit or share this file.**

## 3. Groq key (optional battle commentary)

Create a key at https://console.groq.com/keys and set `GROQ_API_KEY` in `.env.local`.
Without a key the game still works. It falls back to built-in template commentary.
`GROQ_MODEL` defaults to `openai/gpt-oss-20b`; choose another active Groq model if preferred.

## 4. Deploy (the final product must not be local)

**Vercel, via GitHub (easiest):**

```powershell
git init
git add .
git commit -m "Tinolandia geopolitics"
```

1. Create an empty repo on github.com and push to it (GitHub shows the 3 commands).
2. On https://vercel.com → **Add New → Project →** import the repo (Framework: Next.js is auto-detected).
3. Before pressing Deploy, open **Environment Variables** and add the 4 names from `.env.example`:
   `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`.
4. Deploy. Copy the `https://….vercel.app` URL.
5. Firebase console → **Authentication → Settings → Authorized domains → Add domain** → paste your `….vercel.app` host
   (needed for the Google button).

*(CLI alternative: `npm i -g vercel`, `vercel login`, `vercel --prod`, then add the env vars in the Vercel dashboard and redeploy.)*

## 5. Submission checklist

- [ ] Zip of the source (**without** `node_modules`, `.next`, `.env.local`).
- [ ] Firebase console → **Project settings → Users and permissions → Add member:** `ammarcanani@gmail.com`,
      `mc.tanner@uct.ac.za`, `ridewaan.hanslo@uct.ac.za`.
- [ ] Add the deployed live URL and marker account details through the official submission channel.
- [ ] This README.
- [ ] Complete the draft privacy notice in `app/privacy/page.tsx`: supply the responsible party's name and contact address,
      verify actual Firebase regions/transfers, confirm lawful bases and retention/deletion practices, and have the notice reviewed before public use.

---------------------------------------------------------------------------------------------------

## How it meets the brief

| Requirement | Where |
|---|---|
| Select any country; 9 other nations | `components/CountryPicker.tsx` (search, region folders and rotating globe), `lib/engine.ts → createGame` |
| Soldiers from population table | `lib/rules.ts → soldiersFromPopulation` |
| Random first player, round structure, +2 per country from round 2 | `lib/engine.ts` (`beginTurn`, `advanceTurn`) |
| One attack per turn, transfers (keep ≥1) only when no attack is in progress | `doStartAttack`, `doTransfer` |
| Dice: `min(attacker−1, defender)` dice, die-vs-die, ties kill nobody | `lib/rules.ts → resolveRound` |
| Keep rolling until win / left with 1 / stop | `doBattleRound`, `doStopAttack` |
| Conquest bonus `Max(2, ⌊value/2⌋)`, optional transfer into the conquered country | `conquestBonus`, `POST_ATTACK` phase |
| Elimination, win at 10/10 | `afterConquest` |
| NPC turn progression | The campaign owner advances each NPC decision and battle round automatically; each step is recorded in the event feed |
| Live board, selectable campaign map, dice and results | `Board`, `CampaignMap`, `BattleArena` |
| Shareable campaign links, commentary preference and formation field records | `CampaignShare`, `GeopoliticsGameboard` |
| Saved event timeline with play/pause, scrubbing and battle dice replay | `CampaignReplay` |
| Five-level soldier armour preview: breastplate, Chalcidian tiers and credited Sketchfab plate armour | `SoldierKitPicker`, `public/assets/armor/` |
| Interactive guided mini-game | `app/tutorial/page.tsx` |
| NPC difficulty, personalities and strategy sliders | `app/commanders/page.tsx`, `lib/npcProfiles.ts`, `lib/npc.ts` |
| Privacy notice acknowledgement stored per account | `app/privacy/page.tsx`, `app/api/privacy/acknowledge/route.ts` |
| **LLM commentary** | `lib/commentary.ts` (Groq, with instant template fallback) |
| NPCs play to win, with a visible justification for every decision | `lib/npc.ts`; each event's **Why:** line |
| Public viewing, login to play, no playing for someone else | `firestore.rules` (public read, no client writes) + token + owner check in `app/api/game/action/route.ts` |
| NoSQL DB + deployed | Cloud Firestore, Vercel |
| "Play whichever session you want" | **Your games** list on the home page |

### NPC strategy
Concentrate reinforcements into one strike base · score every (own country → enemy country) pair using the **exact**
probability of conquest (dynamic programming over the dice rules) plus payoff (territory gained, enemy armies destroyed,
rival eliminated). Difficulty adjusts the odds threshold, while personality, aggression and caution tune attack selection,
reinforcement and withdrawal behaviour. NPC settings are assigned to stable commander profiles.

### Bonus features
* **Anti-cheating (server-authoritative):** dice are rolled only on the server and every state change is a transaction, so refreshing or
  closing the browser mid-attack can't undo or re-roll it, and the browser console can't edit soldiers.
* **Share the URL → watch live:** every game page streams updates in real time to any visitor.

---------------------------------------------------------------------------------------------------

## Tests (no Firebase needed)

```powershell
npm run simulate      # plays hundreds of full games, checking game invariants after every step
npm run test:api      # runs the real API routes against an in-memory Firestore: auth, ownership, stale versions, a full game, Groq upgrade
```

## Project layout

```
app/                  pages + API routes (api/game/create, api/game/action)
components/           UI (picker, board, battle arena, controls, event feed)
lib/rules.ts          dice / population / conquest rules + win probability
lib/engine.ts         the game state machine (pure, no I/O)
lib/npc.ts            NPC brain
lib/commentary.ts     Groq + template commentary
lib/server/           Firebase Admin + request auth (server only)
firestore.rules       security rules
scripts/              simulation + API tests
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Could not find the Next.js package" | In this project folder (the one containing `package.json`), run `npm install`, then `npm run dev`. Do not install from your Windows user folder. |
| "Server is not configured…" | `FIREBASE_ADMIN_*` variables missing (local: `.env.local`, live: Vercel env vars). Restart / redeploy after changing. |
| "Could not read this game" | Publish `firestore.rules` (step 2.3). |
| Google sign-in: "unauthorized domain" | Add the site's domain under Authentication → Settings → Authorized domains. |
| "operation-not-allowed" | Enable that sign-in method in Firebase Authentication. |
| Commentary is plain, not AI | `GROQ_API_KEY` missing/invalid, or the model name changed (`GROQ_MODEL`). Gameplay is unaffected. |
| Free-tier limits | A full game writes ~700 Firestore documents; the free Spark plan allows 20,000 writes/day (~25+ games/day). |
