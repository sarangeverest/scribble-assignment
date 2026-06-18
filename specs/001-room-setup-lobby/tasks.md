---
description: "Task list for Room Setup & Lobby feature"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**TDD**: Tests are **mandatory** per Constitution Principle I (NON-NEGOTIABLE). Every story phase begins with failing tests before any implementation task.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every task description

## Path Conventions

- Backend source: `backend/src/`
- Frontend source: `frontend/src/`

---

## Phase 1: Setup

**Purpose**: Establish a clean baseline before any changes.

- [X] T001 Confirm baseline — run `npm run build` and `npm run test` in both `backend/` and `frontend/`; all existing tests MUST pass before story work begins

**Checkpoint**: Both packages build cleanly and all existing tests pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type-level changes that every user story depends on. No business logic — only model definitions. These MUST be complete before any story phase begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add `isHost: boolean` to `Participant` interface and add `"in-game"` to `RoomStatus` union in `backend/src/models/game.ts`
- [X] T003 [P] Mirror `isHost: boolean` on `Participant` interface in `frontend/src/services/api.ts`

**Checkpoint**: Both packages compile with zero TypeScript errors after model changes.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, becomes the host automatically, and reaches the lobby. Room code is 4 uppercase letters. Empty player name is rejected before any request is sent.

**Independent Test**: Create a room with name "Alice" → confirm a 4-letter code is returned, Alice appears in participants with `isHost: true`, redirected to lobby.

### Tests for User Story 1 ⚠️ Write FIRST — confirm ALL fail before T005

- [X] T004 [US1] Write failing tests in `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts`:
  - `createRoom("Alice")` → `participants[0].isHost === true`
  - `createRoom("Alice")` → `room.code` matches `/^[A-Z]{4}$/`
  - `createRoom("")` / schema parse with `{ playerName: "" }` → validation error
  - `POST /api/rooms` with `{ playerName: "" }` → 400

### Implementation for User Story 1

- [X] T005 [US1] Change `generateCode()` alphabet from alphanumeric to `ABCDEFGHJKLMNPQRSTUVWXYZ` (letters only, I/O excluded) in `backend/src/services/roomStore.ts`
- [X] T006 [US1] Update `createParticipant(name, isHost)` to accept and stamp `isHost` param; update `createRoom()` to call `createParticipant(playerName, true)`; update `toRoomSnapshot()` to spread `isHost` on each mapped participant in `backend/src/services/roomStore.ts`
- [X] T007 [US1] Change `createRoomSchema.playerName` from `z.string().optional()` to `z.string().min(1)` in `backend/src/api/schemas.ts`
- [X] T008 [P] [US1] Add client-side empty-name guard: trim name, set validation error state and return early before calling `roomStore.createRoom` if blank in `frontend/src/pages/CreateRoomPage.tsx`

**Checkpoint**: T004 tests all pass. Room creation works end-to-end with host flag and 4-letter code.

---

## Phase 4: User Story 2 — Player Joins a Room via Code (Priority: P1)

**Goal**: A second player joins via code, appears in lobby as non-host. Invalid/empty codes and names are rejected with clear feedback before any request is sent.

**Independent Test**: With an existing room, join as "Bob" with correct code → Bob appears in participants with `isHost: false`. Join with invalid code → error shown, no navigation.

### Tests for User Story 2 ⚠️ Write FIRST — confirm ALL fail before T010

- [X] T009 [US2] Write failing tests in `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts`:
  - `joinRoom(code, "Bob")` → returned participant has `isHost === false`
  - `POST /api/rooms/:code/join` with `{ playerName: "" }` → 400
  - `joinRoom("ZZZZ", "Bob")` → returns `null`
  - `joinRoom("kart", "Bob")` (lowercase) → succeeds when room code is `"KART"` — verifies FR-010 case-insensitivity *(C2 fix)*
  - Create Room A and Room B; join Bob to Room A; assert Room B's `participants` does not contain Bob — verifies FR-009 room isolation *(C1 fix)*

### Implementation for User Story 2

- [X] T010 [US2] Update `joinRoom()` to call `createParticipant(playerName, false)` so the joining participant gets `isHost: false` in `backend/src/services/roomStore.ts`
- [X] T011 [US2] Change `joinRoomSchema.playerName` from `z.string().optional()` to `z.string().min(1)` in `backend/src/api/schemas.ts`
- [X] T012 [P] [US2] Add client-side guards: trim both `playerName` and `roomCode`, show distinct validation errors and return early before calling `roomStore.joinRoom` if either is blank in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: T009 tests all pass. Joining works end-to-end; invalid code and empty fields show clear errors without making a network request.

---

## Phase 5: User Story 3 — Lobby Shows Live Participant List (Priority: P2)

**Goal**: Once in the lobby, the participant list auto-refreshes every 2 seconds. If a poll request fails, an inline error banner appears immediately and clears on the next success.

**Independent Test**: Open lobby in two tabs; join from one → other tab shows new participant within 4 s without manual action. Stop backend → banner appears within 2 s; restart → banner clears.

### Tests for User Story 3 ⚠️ Write FIRST — confirm ALL fail before T014

- [X] T013 [US3] Write failing tests in `frontend/src/pages/LobbyPage.test.tsx` (new file):
  - `setInterval` is called with 2000 ms on mount; `clearInterval` is called on unmount
  - When `fetchRoom` rejects, an inline error banner is rendered
  - When `fetchRoom` resolves after a previous rejection, the error banner is gone

### Implementation for User Story 3

- [X] T014 [US3] Replace the `handleRefresh` function and manual "Refresh Room" button with a `useEffect` that calls `setInterval(() => { roomStore.fetchRoom().catch(...) }, 2000)` and returns `clearInterval` as cleanup in `frontend/src/pages/LobbyPage.tsx`
- [X] T015 [US3] Add `pollError` local state (`string | null`); set it when the poll promise rejects; clear it (`setPollError(null)`) at the start of each poll attempt that succeeds; render as an inline banner above the participant list in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: T013 tests all pass. Lobby polls automatically; error banner appears and disappears correctly.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: The host sees a "Start Game" button (disabled with "Need 2+ players" when fewer than 2 participants). Clicking it transitions the room to in-game; all participants navigate to `/game` on the next poll.

**Independent Test**: With 2 players in lobby, only host sees the active Start Game button. Guest sees none. Host clicks → within ~2 s both tabs navigate to `/game`.

### Tests for User Story 4 ⚠️ Write FIRST — confirm ALL fail before T018

- [X] T016 [P] [US4] Write failing backend tests in `backend/src/services/roomStore.test.ts`:
  - `startGame(code, nonHostId)` → throws or returns error with 403-equivalent
  - `startGame(code, hostId)` when only 1 participant → throws with 400-equivalent
  - `startGame(code, hostId)` with ≥2 participants → returned room has `status === "in-game"`
- [X] T017 [P] [US4] Write failing frontend tests in `frontend/src/pages/LobbyPage.test.tsx`:
  - Start Game button rendered when `participantId` matches host's `id`
  - Start Game button NOT rendered when `participantId` does not match host
  - Button is disabled when `room.participants.length < 2`
  - Component navigates to `/game` when `room.status` becomes `"in-game"`

### Implementation for User Story 4

- [X] T018 [US4] Add `startGameSchema` with `{ participantId: z.string().min(1) }` in `backend/src/api/schemas.ts`
- [X] T019 [US4] Add `startGame(code: string, participantId: string)` function: look up room, verify caller is host (403 if not), verify `participants.length >= 2` (400 if not), set `room.status = "in-game"`, save and return snapshot in `backend/src/services/roomStore.ts`
- [X] T020 [US4] Add `POST /:code/start` route handler: parse `startGameSchema`, call `startGame()`, return `{ room: snapshot }` on success in `backend/src/api/rooms.ts`
- [X] T021 [P] [US4] Add `startGame(code: string, participantId: string)` method to the `api` object in `frontend/src/services/api.ts`
- [X] T022 [US4] Derive `isHost` by finding participant where `p.id === participantId && p.isHost`; render Start Game button only when `isHost` is true; disable button with "Need 2+ players" label when `room.participants.length < 2`; call `api.startGame` on click in `frontend/src/pages/LobbyPage.tsx`
- [X] T023 [US4] Add a `useEffect` that watches `room?.status`; when value becomes `"in-game"`, call `navigate("/game", { replace: true })` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: T016 and T017 tests all pass. Host can start game; non-host cannot; all participants transition to game route automatically.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T024 [P] Run `npm run build` in `backend/` and `frontend/`; resolve any remaining TypeScript compilation errors
- [X] T025 Run `npm run test` in `backend/` and `frontend/`; verify coverage ≥ 80% per Constitution Principle I; fix any failing tests
- [ ] T026 Follow all 7 scenarios in `specs/001-room-setup-lobby/quickstart.md` to validate end-to-end behaviour with both dev servers running

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — no story dependencies
- **US2 (Phase 4)**: Depends on Foundational — no story dependencies; can start after Foundational alongside US1
- **US3 (Phase 5)**: Depends on Foundational — no story dependencies
- **US4 (Phase 6)**: Depends on US1 + US2 (needs `isHost` plumbed through create + join to be meaningful end-to-end)
- **Polish (Phase 7)**: Depends on all story phases complete

### Within Each User Story

1. Write tests → confirm ALL fail (Red)
2. Implement → confirm tests pass (Green)
3. Refactor if needed (Refactor)
4. Commit

### Parallel Opportunities

- T002 and T003 can run in parallel (different packages)
- T008 (frontend) can run in parallel with T005/T006/T007 (backend) in Phase 3
- T012 (frontend) can run in parallel with T010/T011 (backend) in Phase 4
- T016 (backend tests) and T017 (frontend tests) can run in parallel in Phase 6
- T021 (frontend API method) can run in parallel with T018/T019/T020 (backend) in Phase 6
- T024 (build) can be run in parallel across both packages

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1 — Host Creates Room)
3. Complete Phase 4 (US2 — Player Joins)
4. **STOP and VALIDATE**: Two players can create and join; both appear in participant list; host flag is correct
5. Deploy/demo if ready

### Full Delivery

1. Setup + Foundational → baseline
2. US1 + US2 → players in lobby (MVP)
3. US3 → auto-refreshing lobby with error recovery
4. US4 → host starts game, all redirect
5. Polish → build, coverage, quickstart validation

---

## Notes

- `[P]` = different files, safe to parallelize
- `[USn]` = traceability back to spec.md user story
- Tests written per story MUST be confirmed failing before implementation starts (Constitution I)
- Tasks T005–T006 share `backend/src/services/roomStore.ts` — implement sequentially
- Tasks T022–T023 share `frontend/src/pages/LobbyPage.tsx` — implement sequentially; commit together
- `LobbyPage.test.tsx` is a new file created in T013; T017 adds more tests to the same file
