# Mahjong App — Screen Descriptions

Design reference for Hong Kong Mahjong web app. Layout inspired by the provided references; visual style aligned with **todate** design tokens for an inviting, consistent feel. Supports light and dark theme via the same semantic tokens (e.g. `--bg-primary`, `--surface-panel`, `--primary`, `--text-primary`).

**Token reference (todate):**
- **Light:** Primary teal `#2AA298`, secondary light blue `#d3e8f8`, background `#FBFBFB`, surface panels `#F0F0F0`, text primary `#403f53`, muted `#93A1A1`.
- **Dark:** Primary purple `#7e57c2`, secondary `#5f7e97`, background `#011627`, surface `#0b253a`, text `#d6deeb`, muted `#5f7e97`.
- **Components:** Use `bg-surface`, `bg-surface-panel`, `text-on-surface`, `text-muted`, `btn-primary`, `panel`, `border-border`, focus ring `ring-focus`. Prefer tokens over raw hex.

---

## 1. Main screen (post sign-in)

**Purpose:** Entry point after authentication. User can create a game, join a game (via code/link or list), or see their existing games.

**Layout (inspired by “Mood Diary” main screen):**
- **Top:** Compact header with app title (“Mahjong” or “HK Mahjong”), optional theme toggle, and user avatar/name (or sign-out). Background uses `bg-header` / `depth` so the header is visually distinct from the main content. No heavy illustration; keep it clean and welcoming with plenty of whitespace and soft contrast.
- **Center:** A single, clear value line (e.g. “Play with friends”) in `text-on-surface`, optionally with a short subtitle in `text-muted`. Below that, two primary actions in a vertical stack (or side-by-side on larger breakpoints):
  - **Create game** — Primary CTA (e.g. `btn-primary` or FAB-style). Leads to “create lobby” flow (user becomes host, gets a link/code to share).
  - **Join game** — Secondary CTA (e.g. `fab-sub` or outlined button). Opens a way to enter a lobby code or paste invite link, or to open the “join from list” experience.
- **Existing games list:** Below the CTAs, a scrollable list of games the user is in (active lobbies and in-progress games). Each row: game/lobby identifier, “Lobby” vs “In progress”, player count (e.g. “2/4”), and a “Open” or “Continue” action. Use `panel` or `panel-muted` for each row; `text-muted` for secondary info. Empty state: “No games yet. Create or join a game above.”
- **Overall:** Warm and inviting: use `bg-surface` for the page, `surface-panel` for cards, primary color for main actions only. Avoid dark-blue “game UI” heaviness; keep typography clear and touch targets at least 44px. Optional: very subtle background pattern or gradient using `secondary`/`tertiary` at low opacity instead of a literal illustration.

**Responsive:** On narrow viewports, stack “Create” and “Join” vertically; list remains full-width. Header stays single row with truncated title and icon-only secondary actions (with `aria-label` and `title`).

---

## 2. Player lobby

**Purpose:** Pre-game room where 2–4 players gather. Host shares link/code; others join. When 4 players are present, host can start the game.

**Layout (inspired by “player lobby” with slots and Find Match):**
- **Header:** Same app header as main (title, theme, user). Optional “Leave lobby” or back control. Subtitle or breadcrumb: “Lobby” and lobby code (e.g. “ABC12”) so players can share it. Use `text-muted` for the code; optionally a “Copy link” button with clear feedback.
- **Player slots:** Central area shows **four player slots** in a row (or 2×2 on small screens). Each slot is a card (`panel` / `surface-panel`) with:
  - Avatar (placeholder or initials) and display name.
  - Empty slots: “Waiting for player…” and a subtle “+” or “Invite” hint (e.g. “Share the code above”).
  - Filled slots: player name, optional “Ready” or role indicator.
  - Use a soft border (`border-border`) and maybe a light `secondary` accent for the current user’s slot. No red/green rings; use a simple primary-colored outline or dot for “you” and neutral state for others so it feels inviting, not alarming.
- **Start game:** At the bottom, a single primary button: **“Start game”** (or “Find match” style). Enabled only when there are exactly 4 players. Uses `btn-primary`. If not 4: show “Need 4 players to start” in `text-muted` below the button (disabled).
- **Chat / activity (optional):** A narrow strip or collapsible section showing “X joined”, “Game starting…” in `text-muted`, like the reference’s activity log. Not required for v1.
- **Tone:** Lobby should feel like a friendly gathering: light panels, clear typography, primary used sparingly for the main action. Avoid dark crests and heavy ornamentation; keep the todate-like simplicity.

**Responsive:** Slots wrap or stack so all four remain visible; Start button stays fixed or sticky at bottom with safe padding.

---

## 3. Game view

**Purpose:** Active Hong Kong Mahjong round. Shows other players’ areas, the “table” (discards, last discard, wall count), current player’s hand, and turn actions (Draw, Discard, Chow/Pong/Kong, Mahjong).

**Layout (inspired by card game view — adapted for tiles):**
- **Top bar:** Minimal: round/phase indicator (e.g. “Round 3”), tiles-left-in-wall count, and optional menu (settings, leave game). Use `bg-header`, `text-on-surface`, `text-muted`. No score chips in the first version unless we add scoring UI; keep the bar uncluttered.
- **Opponents (top):** Three horizontal “seats” for the other three players. Each seat shows:
  - Avatar and name.
  - **Tile count** (e.g. 13 or 14) as a number or a fan of face-down tile backs (or simple placeholder shapes) so the count is clear — no need to show actual tiles.
  - **View revealed tiles:** A button (e.g. icon or “Revealed”) next to or below the player’s name. When pressed, it opens a modal or expandable section showing **that player’s exposed melds** (Pong, Kong, Chow) — tiles they have laid face-up from claiming discards. Each meld is shown as its tiles in a small row with a label (Pong/Kong/Chow). If the player has no exposed melds, the button can be disabled or show “None”. Use `btn-icon` or a small `text-muted` control with `aria-label` (e.g. “View [name]’s revealed tiles”) and `title` for accessibility.
  - **Turn indicator:** Soft ring or glow in `primary` for the player whose turn it is; no red/green. Muted state for others.
- **Center (table):**
  - **Discard area:** Discards are **grouped by player**. Show one row or section per player (each of the three opponents, and optionally the current user). Each group displays that player’s discard pile in **chronological order** (oldest to newest) as face-up tiles. Do not mix discards from different players — the game data tracks all discards per player (`playerDiscards[playerId]`), and the UI should sort/display them by player and preserve order within each group.
  - **Last discarded tile:** Clearly visible (large or highlighted) when relevant for Chow/Pong/Kong/Mahjong claims.
  - **Wall / draw pile:** Small representation (e.g. face-down stack or “Wall” label + count) so “tiles left” is visible. No need to show full wall.
- **Current player’s hand (bottom):** Horizontal row of **face-up Mahjong tiles** (using Mahjong-match SVGs). Tiles are tappable/clickable for discard selection. When it’s the user’s turn and they must discard, selected tile is highlighted (e.g. `ring-2 ring-primary` or light `surface-panel` border).
- **Action bar (bottom):** A single, semi-transparent or solid bar (`surface-panel` with border) containing:
  - **Current user avatar** (left).
  - **Actions (center):** Context-dependent buttons:
    - **Draw** — when it’s their turn and they haven’t drawn yet.
    - **Discard** — after drawing (or on first turn); may be implicit after selecting a tile (e.g. “Discard selected” or tap tile to discard).
    - **Chow / Pong / Kong** — only when `potentialActions` includes them for the last discard; each as a small pill or button.
    - **Mahjong** — when they can win with the last discard or self-draw.
  - **Right:** Optional “Tiles left: N” or round info in `text-muted`. No currency; keep it minimal.
- **Colors and feel:** Use `bg-surface` for the main game background (slightly warmer or neutral, not dark blue). Table area can be a subtle `surface-panel` or a soft `secondary`/`tertiary` tint. Tiles and actions use primary for emphasis; rest is on-surface and muted. Goal: readable, calm, and inviting — not a dark casino look. Ensure tile images have descriptive `alt` text and that action buttons have `aria-label` and `title`.

**Data notes:** The game state includes `playerDiscards` (all discards per player, in order) and `playerExposedMelds` (each player’s face-up melds from Pong/Kong/Chow). The UI reads these to render the discard area by player and to populate the “view revealed tiles” modal.

**Responsive:** On mobile, opponents’ areas may stack or shrink; hand and action bar stay at bottom with touch-friendly targets (min 44px). Tile size scales (e.g. container queries or breakpoints) so the hand remains usable on small screens.

---

## Summary

| Screen      | Main focus                                      | Token usage                                      |
|------------|--------------------------------------------------|--------------------------------------------------|
| Main       | Create / Join / List games                       | `bg-surface`, `panel`, `btn-primary`, `text-on-surface` |
| Lobby      | 4 player slots, Start game                        | `panel`, `btn-primary`, `border`, `text-muted`   |
| Game       | Opponents, table, hand, actions                   | `bg-surface`, `surface-panel`, `primary` accents, tile assets |

All screens support light/dark via the same semantic tokens and use consistent header, focus rings, and touch targets. Next step: implement these in mahjong-frontend using the same design token approach as todate (e.g. shared CSS variables or Tailwind theme that mirrors todate’s palette).
