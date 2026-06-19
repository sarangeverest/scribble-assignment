# CLAUDE.md

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
specs/004-result-restart/plan.md
<!-- SPECKIT END -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiplayer drawing game ("Scribble") — a brownfield enhancement project. The scaffold has basic room creation/joining and UI; the remaining gameplay logic (host controls, lobby polling, game start, drawing, guessing, scoring, results) is left to be implemented.

## Commands

Run from each sub-directory — there is no root-level script runner.

**Backend** (`cd backend`):
```
npm run dev       # tsx watch src/server.ts (port 3001)
npm run build     # tsc -p tsconfig.json → dist/
npm run start     # node dist/server.js
npm run test      # vitest run
```

**Frontend** (`cd frontend`):
```
npm run dev       # vite dev server (port 5173)
npm run build     # tsc -b && vite build
npm run preview   # vite preview
npm run test      # vitest run
```

**Run a single test file:**
```
cd backend && npx vitest run src/services/roomStore.test.ts
cd frontend && npx vitest run src/services/api.test.ts
```

Node version: v24.13.0 (see `.nvmrc`). No environment variables required for local development; `VITE_API_URL` defaults to `http://localhost:3001`.

## Architecture

Two independent apps sharing conventions but with separate builds and `node_modules`.

### Backend (`backend/src/`)

```
api/          # Express routes + Zod request validation
  router.ts   # Route definitions (GET /health, POST /rooms, etc.)
  rooms.ts    # Handler logic
  schemas.ts  # Zod schemas for request/response
services/
  roomStore.ts  # In-memory Map<code, Room> — all game state lives here
models/
  game.ts     # Core TypeScript types: Room, Participant, RoundState, etc.
seed/
  starterData.ts  # Default word list and role definitions
```

Entry point: `src/server.ts` (binds port) → `src/app.ts` (Express setup + CORS).

**API surface:**
- `GET /health`
- `GET /api/`
- `POST /api/rooms` — create room; returns `{ participantId, room: RoomSnapshot }`
- `POST /api/rooms/:code/join` — join room; returns same shape
- `GET /api/rooms/:code?participantId=` — poll room state

### Frontend (`frontend/src/`)

```
routes/index.tsx    # React Router v6 route tree (5 routes)
pages/              # One component per route
components/         # Reusable UI pieces (AppShell, Card, GuessForm, Scoreboard, etc.)
state/roomStore.ts  # Custom store using useSyncExternalStore — source of truth for room state
services/api.ts     # fetch-based HTTP client; all backend calls go here
styles/app.css      # All CSS lives in one file
```

State flows from API → `roomStore.ts` → components via the store's `subscribe`/`getSnapshot` pattern. Polling is done with `setInterval` in `useEffect` hooks — **no WebSockets**.

## Coding Guidelines

### TypeScript
- Strict mode is on in both packages. Avoid `any`; use `unknown` for truly dynamic types.
- Backend uses `NodeNext` module resolution; frontend uses `Bundler`.

### Backend
- All request payloads must be validated with Zod schemas in `api/schemas.ts`.
- Business logic belongs in `services/`, not in route handlers.
- Keep `roomStore` footprint small; clean up inactive rooms explicitly.

### Frontend
- Functional components with hooks only.
- New state belongs in `state/`; follow the `useSyncExternalStore` pattern in `roomStore.ts`.
- All API calls go through `services/api.ts` — no inline `fetch` in components.
- CSS changes go in `app.css`.

## Hard Constraints

These are strictly off-limits regardless of task:
- **No WebSockets** — all sync must use HTTP polling (`setInterval` + `GET /api/rooms/:code`).
- **No databases** — in-memory only (`Map` in `roomStore.ts`).
- **No authentication** — no sessions, JWT, or OAuth.

## Spec Kit Artifacts

When using Spec Kit skills, artifacts are stored in `.specify/`:
- `constitution.md` — engineering principles
- `spec.md` — acceptance criteria (4 scenarios)
- `plan.md` — state model, file-level changes, data flow
- `tasks.md` — ordered, testable work items

When CLAUDE.md says "read the current plan", check `.specify/plan.md`.
