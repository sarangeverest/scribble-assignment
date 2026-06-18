---
description: "Task list for Game Start & Drawer Flow feature"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api-rooms.md ✅

**TDD**: Tests are **mandatory** per Constitution Principle I (NON-NEGOTIABLE). Every story phase begins with failing tests before any implementation task.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
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

**Purpose**: Type-level changes that US2 and US3 depend on. No business logic — only model and type definitions. Must be complete before Phase 4+ can begin.

**⚠️ CRITICAL**: US2 and US3 work cannot begin until this phase is complete. US1 (name validation) may proceed in parallel since it does not use the new types.

- [X] T002 Update `backend/src/models/game.ts`: add `Round` interface (`{ drawerId: string; word: string; status: "active" }`); add `currentRound?: Round` to `Room`; replace `availableWords: string[]` and `roles: ParticipantRole[]` in `RoomSnapshot` with `drawerId: string | null` and `secretWord?: string` — ⚠️ TypeScript build will fail until T014 updates `toRoomSnapshot` to supply `drawerId`; proceed directly to T014 if working sequentially
- [X] T003 [P] Update `RoomSnapshot` in `frontend/src/services/api.ts`: replace `availableWords` and `roles` with `drawerId: string | null` and `secretWord?: string`
- [X] T004 [P] Update `RoomSnapshot` in `frontend/src/state/roomStore.ts`: same replacement as T003 (`drawerId: string | null`, `secretWord?: string`)

**Checkpoint**: Both packages compile with zero TypeScript errors after type changes.

---

## Phase 3: User Story 1 — Player Name Validation (Priority: P1)

**Goal**: Player names are trimmed before storage. Empty/whitespace-only names and names longer than 20 characters are rejected with clear error messages at both server and client layers.

**Independent Test**: Submit `"  Alice  "` → stored as `"Alice"`. Submit `"   "` → rejected with message. Submit a 21-character name → rejected with message. Submit a 20-character name → accepted.

### Tests for User Story 1 ⚠️ Write FIRST — confirm ALL fail before T008

- [X] T005 [US1] Write failing schema tests in `backend/src/api/schemas.test.ts` (new file); test via `createRoomSchema.parse({ playerName: "..." })` — do NOT import `playerNameSchema` directly since it may not be exported yet:
  - `createRoomSchema.parse({ playerName: "  Alice  " }).playerName` === `"Alice"` (trim applied)
  - `createRoomSchema.parse({ playerName: "  " })` → throws ZodError (whitespace-only rejected)
  - `createRoomSchema.parse({ playerName: "" })` → throws ZodError (empty rejected)
  - `createRoomSchema.parse({ playerName: "A".repeat(21) })` → throws ZodError (>20 chars rejected)
  - `createRoomSchema.parse({ playerName: "A".repeat(20) }).playerName` has length 20 (exactly 20 accepted)
- [X] T006 [P] [US1] Write failing tests in `frontend/src/pages/CreateRoomPage.test.tsx` (new file):
  - Submitting a name of 21 characters shows error "Name must be 20 characters or fewer" and does not call `roomStore.createRoom`
- [X] T007 [P] [US1] Write failing tests in `frontend/src/pages/JoinRoomPage.test.tsx` (new file):
  - Submitting a name of 21 characters shows error "Name must be 20 characters or fewer" and does not call `roomStore.joinRoom`

### Implementation for User Story 1

- [X] T008 [US1] Update `backend/src/api/schemas.ts`: extract `export const playerNameSchema = z.string().trim().min(1, "Name cannot be empty").max(20, "Name must be 20 characters or fewer")` (named export required); use it in both `createRoomSchema` and `joinRoomSchema` (makes T005 pass)
- [X] T009 [P] [US1] Update `frontend/src/pages/CreateRoomPage.tsx`: add length guard before API call (`const trimmed = playerName.trim(); if (trimmed.length > 20) { setError("Name must be 20 characters or fewer"); return; }`); add `maxLength={20}` to name `<input>` (makes T006 pass)
- [X] T010 [P] [US1] Update `frontend/src/pages/JoinRoomPage.tsx`: add same length guard as T009 before API call; add `maxLength={20}` to name `<input>` (makes T007 pass)

**Checkpoint**: T005–T007 tests all pass. Name trimming and max-20 enforcement works end-to-end on both server and client.

---

## Phase 4: User Story 2 — Host as Drawer at Round Start (Priority: P1)

**Goal**: When `startGame` is called, the host is assigned as drawer and a round is created. All participants see the drawer's name after the next poll. The drawer sees a distinct role indicator in the game screen.

**Independent Test**: Start a game with host Alice and guesser Bob. Poll as Bob → response has `drawerId === Alice's participantId`. Bob's GamePage shows "Drawing: Alice". Alice's GamePage shows "You are drawing!".

### Tests for User Story 2 ⚠️ Write FIRST — confirm ALL fail before T012

- [X] T011 [US2] Write failing tests in `backend/src/services/roomStore.test.ts` (extend existing file):
  - After `startGame(code, hostId)`: the room's internal `currentRound.drawerId === hostId`
  - After `startGame(code, hostId)`: `currentRound.word === "rocket"` (STARTER_WORDS[0])
  - After `startGame(code, hostId)`: `currentRound.status === "active"`
  - `toRoomSnapshot(inGameRoom, hostId).drawerId === hostId`
  - `toRoomSnapshot(lobbyRoom, hostId).drawerId === null`
  - `toRoomSnapshot(inGameRoom, guesserId).drawerId !== guesserId` — confirms a non-host participant is identifiably not the drawer (covers FR-004 guesser derivation)
- [X] T012 [P] [US2] Write failing tests in `frontend/src/pages/GamePage.test.tsx` (new file):
  - When `participantId === room.drawerId`: component renders an element containing "You are drawing!" (or equivalent drawer indicator text)
  - When `participantId !== room.drawerId`: component renders drawer's display name (e.g., text matching the drawer participant's name)
  - When `participantId !== room.drawerId`: "You are drawing!" text is NOT present anywhere in the rendered output

### Implementation for User Story 2

- [X] T013 [US2] Update `startGame` in `backend/src/services/roomStore.ts`: after existing host and player-count guards pass, add a defensive guard `if (STARTER_WORDS.length === 0) throw new Error("400: No words available to start the game")`; then set `room.currentRound = { drawerId: caller.id, word: STARTER_WORDS[0], status: "active" }` before updating `room.updatedAt` (makes T011 first three assertions pass; defensive guard covers spec edge case)
- [X] T014 [US2] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts`: derive `const drawerId = room.currentRound?.drawerId ?? null`; replace `availableWords: listWords()` and `roles: [...STARTER_ROLES]` with `drawerId` in the returned object (makes T011 last two assertions pass)
- [X] T015 [US2] Update `frontend/src/pages/GamePage.tsx`: derive `const isDrawer = participantId === room.drawerId`; render a drawer role banner ("You are drawing!") when `isDrawer` is true; render drawer's display name (find participant where `p.id === room.drawerId`, show e.g. `"Drawing: ${drawerName}"`) when `isDrawer` is false (makes T012 pass)

**Checkpoint**: T011–T012 tests all pass. After game start, every participant can identify the drawer; drawer sees their own role indicator.

---

## Phase 5: User Story 3 — Secret Word Visible Only to Drawer (Priority: P1)

**Goal**: The secret word travels only to the drawer's polling response. Guessers receive no `secretWord` field. The drawer's GamePage displays the word prominently; the guesser's GamePage contains no trace of it.

**Independent Test**: Start game, poll as host (drawer) → response contains `secretWord: "rocket"`. Poll as second player (guesser) → response has no `secretWord` key at all. Drawer's GamePage shows "rocket"; guesser's GamePage does not contain "rocket" anywhere.

### Tests for User Story 3 ⚠️ Write FIRST — confirm ALL fail before T017

- [X] T016 [US3] Write failing tests in `backend/src/services/roomStore.test.ts` (extend existing file, depends on T013/T014 being implemented):
  - `toRoomSnapshot(inGameRoom, drawerId).secretWord === "rocket"`
  - `toRoomSnapshot(inGameRoom, guesserId).secretWord` is `undefined` (key absent)
  - `toRoomSnapshot(inGameRoom, undefined).secretWord` is `undefined` (no viewer ID)
  - `toRoomSnapshot(lobbyRoom, drawerId).secretWord` is `undefined` (no round in lobby)
- [X] T017 [P] [US3] Write failing tests in `frontend/src/pages/GamePage.test.tsx` (extend existing file from T012):
  - When `room.secretWord === "rocket"` and `isDrawer` is true: component renders "rocket" (e.g., in "Your word: rocket" label)
  - When `room.secretWord` is `undefined` and `isDrawer` is false: text "rocket" (or any word from STARTER_WORDS) is NOT present anywhere in the rendered output

### Implementation for User Story 3

- [X] T018 [US3] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts`: add `const secretWord = (viewerParticipantId && viewerParticipantId === drawerId) ? room.currentRound!.word : undefined`; include `secretWord` (when defined) or omit the key from the returned snapshot (makes T016 pass)
- [X] T019 [US3] Update `frontend/src/pages/GamePage.tsx`: in the drawer branch (`isDrawer === true`), render the secret word from `room.secretWord` (e.g., `<p>Your word: {room.secretWord}</p>`); ensure the guesser branch renders no text derived from `room.secretWord` (makes T017 pass)

**Checkpoint**: T016–T017 tests all pass. Secret word is server-enforced: absent from guesser API responses and absent from guesser UI.

---

## Phase 6: Polish & Verification

**Purpose**: Confirm the full feature compiles and all tests pass across both packages before the branch is ready for review.

- [X] T020 [P] Run `npx vitest run --coverage` in `backend/` — all tests green (including T005, T011, T016 and all pre-existing tests); confirm the coverage summary shows ≥80% for statements, functions, and lines (Constitution Principle I MUST)
- [X] T021 [P] Run `npx vitest run --coverage` in `frontend/` — all tests green (including T006, T007, T012, T017 and all pre-existing tests); confirm the coverage summary shows ≥80% for statements, functions, and lines (Constitution Principle I MUST)
- [X] T022 Run `npm run build` in `backend/` — zero TypeScript errors
- [X] T023 [P] Run `npm run build` in `frontend/` — zero TypeScript errors (can run after T022 starts, different package)

**Checkpoint**: All tasks complete. Branch is ready for `/speckit-git-commit` and PR.

---

## Dependencies

```
T001 (baseline)
  └─ T002, T003 [P], T004 [P]  (foundational types — parallel)
       └─ T011, T012 [P]        (US2 tests — can start once types are set)

T001 (baseline)
  └─ T005, T006 [P], T007 [P]  (US1 tests — parallel, independent of types)
       ├─ T008                  (US1 backend impl)
       ├─ T009 [P]              (US1 frontend CreateRoom impl)
       └─ T010 [P]              (US1 frontend JoinRoom impl)

T011
  └─ T013 → T014               (US2 backend impl: startGame then toRoomSnapshot drawerId)
       └─ T016                  (US3 tests, needs drawerId working)
            └─ T018             (US3 backend impl: secretWord)

T012
  └─ T015                       (US2 frontend: drawer banner, needs drawerId type from T002-T004)
       └─ T017                  (US3 frontend tests: secretWord display)
            └─ T019             (US3 frontend impl: secretWord display)

T018, T019 → T020, T021, T022, T023 [P]  (verification)
```

## Parallel Execution Opportunities

**US1 is fully independent** — T005/T006/T007 can start as soon as T001 passes, with no dependency on Phase 2 type changes.

**Within Phase 2**: T003 and T004 are parallel (different files, same shape change).

**Within US1 implementation**: T009 and T010 are parallel (different page files).

**Within US2 tests**: T011 and T012 are parallel (backend test file vs. frontend test file).

**Verification**: T020/T021/T022/T023 — T020 and T021 are parallel (different packages); T023 can start alongside T022.

## Implementation Strategy

**MVP**: Phases 1–3 (T001–T010) deliver US1 name validation as a fully shippable increment with no dependency on Phase 2 types.

**Core game mechanics**: Phases 4–5 (T011–T019) deliver US2 and US3 together — drawer assignment and word secrecy are implemented sequentially since US3 extends the `toRoomSnapshot` function touched by US2.

**Recommended delivery order**: US1 → US2 backend → US3 backend → US2+US3 frontend (GamePage) → verification. This ensures the server-side contract is stable before the UI is wired up.
