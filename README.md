# Mahjong Frontend

Web client for **Hong Kong (Cantonese) Mahjong**. React 18, Vite, Tailwind 4, Firebase Auth. Connects to [mahjong-backend](https://github.com/irfan-f/mahjong-express) for lobbies and game state.

## Docs

- **API** — Backend OpenAPI spec and run instructions: see the [mahjong-backend](../mahjong-backend) README and [openapi.yaml](../mahjong-backend/openapi.yaml).

## Run locally

```bash
npm install
cp .env.example .env
# Fill in Firebase config and VITE_API_URL (e.g. http://localhost:3000)
npm run dev
```

App runs at `http://localhost:5173` (or Vite default). Ensure the backend is running and `VITE_API_URL` points to it.

### Run frontend without backend (mock API)

To step through the UI and test every action without the backend or sign-in:

1. In `.env`, set `VITE_USE_MOCK_API=true` (or any non-empty value).
2. Run `npm run dev`. You’re automatically signed in as a mock user.

**Full scenario walkthrough**

1. **Home** → Create game (or go to `/lobby/any-id` and Start game) → you land on **pre-deal**.
2. **pre-deal** — Click **Roll & Deal** → **my-turn-draw**.
3. **my-turn-draw** — Click **Draw** → **my-turn-discard**.
4. **my-turn-discard** — Click any tile to **discard** → **claim**.
5. **claim** — Click **Pong**, **Kong**, or **Chow** → back to **my-turn-discard**.
6. **my-turn-discard** — Click **Mahjong** → **ended**.

This cycle exercises: Roll & Deal, Draw, Discard, Claim (Pong/Kong/Chow), and Mahjong.

**Manual URLs** (to test a specific UI without clicking through):

| URL | What you see |
|-----|----------------|
| `/game/pre-deal` | Roll & Deal button |
| `/game/my-turn-draw` | Draw button |
| `/game/my-turn-discard` | Your hand (clickable) + Mahjong button |
| `/game/claim` | Pong / Kong / Chow buttons (claim from last discard) |
| `/game/opponent-turn` | Read-only hand (not your turn) |
| `/game/ended` | Game over, winner and scores |

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:3000`) |
| `VITE_USE_MOCK_API` | If set (e.g. `true`), use mock API and mock user — no backend or sign-in required |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

See [.env.example](./.env.example). Do not commit `.env`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

## Routes

- `/` — Home (sign in / create or join lobby)
- `/lobby/:id` — Lobby room (join, start game when 4 players)
- `/game/:gameId` — Game table (draw, discard, declare Mahjong)

## Stack

- React 18, React Router 6
- Vite 6, TypeScript
- Tailwind CSS 4
- Firebase Auth (sign-in; ID token sent to backend as Bearer)
