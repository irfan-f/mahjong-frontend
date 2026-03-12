# Mahjong Frontend

Web client for **Hong Kong (Cantonese) Mahjong**. React 18, Vite, Tailwind 4, Firebase Auth. Connects to [mahjong-backend](../mahjong-backend) for lobbies and game state.

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

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:3000`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

See `.env.example`. Do not commit `.env`.

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

- `/` — Home (sign in / create or join lobby, and entry to the single-player tutorial)
- `/lobby/:id` — Lobby room (join, start game when 4 players)
- `/game/:gameId` — Game table (draw, discard, declare Mahjong)
- `/learn` — Guided single-player tutorial using scripted mock game states

## Stack

- React 18, React Router 6
- Vite 6, TypeScript
- Tailwind CSS 4
- Firebase Auth (sign-in; ID token sent to backend as Bearer)

