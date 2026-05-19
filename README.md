# Mahjong with Friends (frontend)

Web client for **Hong Kong (Cantonese) Mahjong**. **React 18**, **Vite**, **Tailwind 4**, **Firebase Auth**. Talks to **[mahjong-backend](../mahjong-backend)** for lobbies, seats, and game state.

**Live:** [mahjong.irfan-f.com](https://mahjong.irfan-f.com)  
**API (production):** [irfquake.tech](https://irfquake.tech) (see backend README)  
**Deploy:** [deploy/README.md](deploy/README.md)

## Docs

- **HTTP API** — [mahjong-backend](../mahjong-backend) README and [openapi.yaml](../mahjong-backend/openapi.yaml).

## Run locally

```bash
npm install
cp .env.example .env
# Set Firebase web config and VITE_API_URL (e.g. http://localhost:3000)
npm run dev
```

The dev server defaults to **port 3001** (`vite.config.ts`). Run the backend on **3000** (or set `VITE_API_URL` to match).

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:3000`, or `https://irfquake.tech`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

Use `.env.example` as a template. Do not commit `.env`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript check + Vite build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest watch |
| `npm run test:run` | Vitest once |

## Routes

- `/` — Home (sign in; create or join lobby)  
- `/lobby/:id` — Lobby (ready up; start when four players)  
- `/game/:gameId` — Table (draw, discard, declare Mahjong)  

## Stack

- React 18, React Router 6  
- Vite 6, TypeScript  
- Tailwind CSS 4  
- Firebase Auth (ID token as `Authorization: Bearer` on API calls)

## Hosting

Production is static files on **mahjong.irfan-f.com** (Vite `base: '/'`, **HashRouter** for deep links). CI runs on GitHub; deploy with rsync — see [deploy/README.md](deploy/README.md).

## Firebase Auth

Add **`mahjong.irfan-f.com`** under Firebase **Authentication → Settings → Authorized domains**.
