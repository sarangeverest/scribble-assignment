# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Branch**: `003-gameplay-interaction`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api-rooms.md ✅

**TDD**: Constitution Principle I is NON-NEGOTIABLE — every implementation task is preceded by a failing test. Task execution order per story: write failing tests → implement → verify tests pass → commit.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the codebase is in a known-green state before any changes.

- [x] T001 Run `cd backend && npm run test` and `cd frontend && npm run test` to confirm all existing tests pass before any changes

---

## Phase 2: Foundational — Data Model & Type Changes

**Purpose**: Shared type definitions that ALL user stories depend on. No story work can begin until this phase is complete.

**⚠️ CRITICAL**: US1–US4 all depend on these type changes being compiled and test-covered first.

> **TDD**: Write the failing tests in T002 first. Verify they fail. Then implement T003–T006.

- [x] T002 Write failing tests for foundational changes in `backend/src/services/roomStore.test.ts`: (a) `createParticipant` produces `score: 0`; (b) `startGame` initialises `currentRound.guesses = []` and `currentRound.canvasData = ""`; (c) `toRoomSnapshot` includes `guesses: []` and `canvasData: ""` in lobby snapshot
- [x] T003 Add `Guess` interface; add `score: number` to `Participant`; add `guesses: Guess[]` and `canvasData: string` to `Round`; add `guesses: Guess[]` and `canvasData: string` to `RoomSnapshot` in `backend/src/models/game.ts`
- [x] T004 Update `createParticipant` to set `score: 0`; update `startGame` to initialise `guesses: []` and `canvasData: ""`; update `toRoomSnapshot` to return `guesses: room.currentRound?.guesses ?? []` and `canvasData: room.currentRound?.canvasData ?? ""` in `backend/src/services/roomStore.ts`
- [x] T005 [P] Add `Guess` interface; add `score: number` to `Participant`; add `guesses: Guess[]` and `canvasData: string` to `RoomSnapshot`; add `submitGuess` and `updateCanvas` functions to `api` object in `frontend/src/services/api.ts`
- [x] T006 [P] Mirror same type additions (`Guess`, `score` on `Participant`, `guesses`/`canvasData` on `RoomSnapshot`); add `submitGuess` and `updateCanvas` async methods to `RoomStore` class in `frontend/src/state/roomStore.ts`

**Checkpoint**: Run `npm run test` in backend — T002 tests must pass. Run `npm run build` in both packages — zero TypeScript errors before proceeding.

---

## Phase 3: User Story 1 — Drawer Canvas Interaction (Priority: P1) 🎯 MVP

**Goal**: The drawer sees an interactive `<canvas>` element, can draw freely with their pointer, and can clear the canvas. All changes are visible on the drawer's own screen in real time.

**Independent Test**: Start a game with 2 participants. As the drawer, open the game screen. Confirm a canvas is present (not a placeholder `<div>`), that drawing with a pointer produces strokes, and that clicking "Clear" wipes the canvas blank.

> **TDD**: Write T007–T008 first and confirm they fail before implementing T009–T010.

- [x] T007 Write failing tests in `frontend/src/pages/GamePage.test.tsx`: (a) drawer view renders a `<canvas>` element (not a div placeholder); (b) "Clear" button is present in drawer view; (c) guesser view does NOT render a `<canvas>` element
- [x] T008 Write failing test in `frontend/src/pages/GamePage.test.tsx`: drawer view does not render `<GuessForm>`
- [x] T009 [US1] Replace the canvas placeholder `<div>` with `<canvas ref={canvasRef} className="drawing-canvas" width={800} height={500} />`; wire `useEffect` to attach `pointerdown` (begin path + moveTo), `pointermove` (lineTo + stroke if pressing), and `pointerup` (end path) handlers with a black 3 px stroke style in `frontend/src/pages/GamePage.tsx`
- [x] T010 [US1] Add "Clear" `<button>` below the canvas for the drawer view that calls `ctx.clearRect(0, 0, canvas.width, canvas.height)` in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Run `npm run test` (frontend) — T007–T008 pass. Manually open the game screen as drawer and confirm drawing and clearing work locally.

---

## Phase 4: User Story 2 — Drawing Visible to All Participants (Priority: P1)

**Goal**: Within one polling cycle, all guessers see the drawer's current canvas state rendered as an image. Clearing the canvas is also reflected for guessers.

**Independent Test**: Open two browser tabs — one as drawer, one as guesser. Draw a stroke in the drawer tab. Within ~2 seconds, the guesser tab shows the drawing. Trigger "Clear" — the guesser tab shows a blank canvas on the next poll.

> **TDD**: Write T011–T013 first and confirm they fail before implementing T014–T018.

- [x] T011 Write failing tests in `backend/src/services/roomStore.test.ts` for `updateCanvas`: (a) stores `canvasData` on `currentRound` for the drawer; (b) throws 403 when caller is not the drawer; (c) throws 400 when no active round; (d) `toRoomSnapshot` returns updated `canvasData` after an update
- [x] T012 Write failing tests in `backend/src/api/schemas.test.ts` for `updateDrawingSchema`: (a) accepts valid `{ participantId, canvasData }`; (b) rejects missing `participantId`; (c) accepts `canvasData: ""`
- [x] T013 Write failing tests in `frontend/src/pages/GamePage.test.tsx`: (a) guesser view renders `<img>` with `src` equal to `room.canvasData` when non-empty; (b) guesser view renders `<img>` with no `src` (undefined) when `canvasData === ""`
- [x] T014 [P] Add `updateDrawingSchema = z.object({ participantId: z.string().min(1), canvasData: z.string() })` to `backend/src/api/schemas.ts`
- [x] T015 [US2] Implement `updateCanvas(code, participantId, canvasData)` with guards (404 room not found, 400 no active round, 403 not drawer) and `room.currentRound.canvasData = canvasData` in `backend/src/services/roomStore.ts`
- [x] T016 [US2] Add `POST /:code/drawing` handler to `backend/src/api/rooms.ts`: parse `updateDrawingSchema`, call `updateCanvas`, return `{ ok: true }`, forward errors via `next` with `HttpError` mapping
- [x] T017 [US2] Wire the `pointerup` handler added in T009 to call `store.updateCanvas(room.code, participantId, canvasRef.current.toDataURL("image/png"))` in `frontend/src/pages/GamePage.tsx`; wire the "Clear" button from T010 to also call `store.updateCanvas(room.code, participantId, "")` after clearing
- [x] T018 [US2] Replace any remaining canvas placeholder for the guesser view with `<img src={room.canvasData || undefined} className="canvas-display" alt="Drawing canvas" />` in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Run `npm run test` (backend + frontend) — T011–T013 pass. Manual end-to-end: draw in drawer tab, confirm guesser tab reflects it within ~2 s.

---

## Phase 5: User Story 3 — Guess Submission with Validation (Priority: P1)

**Goal**: Guessers can submit guesses that are trimmed and compared case-insensitively. Empty guesses are rejected client- and server-side. Correct guesses show "Correct!" and clear the input; the drawer cannot guess. Guess history appears for all participants via polling.

**Independent Test**: With secret word "rocket": submit empty guess → rejected with message. Submit "ROCKET" → correct, input clears, "Correct!" shown. Submit "banana" → incorrect, guess appears in history. Attempt to guess as drawer → fails. Verify guess history visible to all participants on next poll.

> **TDD**: Write T019–T021 first and confirm they fail before implementing T022–T026.

- [x] T019 Write failing tests in `backend/src/services/roomStore.test.ts` for `submitGuess`: (a) case-insensitive match returns `isCorrect: true`; (b) non-match returns `isCorrect: false`; (c) drawer calling `submitGuess` throws 403; (d) empty guess (after Zod trim) throws 400; (e) first correct guess increments `participant.score` by 100; (f) second correct guess by same participant does NOT increment score again; (g) incorrect guess leaves score unchanged; (h) guess is appended to `currentRound.guesses`; (i) returned snapshot includes the new guess in `guesses[]`
- [x] T020 Write failing tests in `backend/src/api/schemas.test.ts` for `submitGuessSchema`: (a) trims whitespace from `guess`; (b) rejects empty string after trim; (c) rejects missing `participantId`; (d) accepts valid payload
- [x] T021 Write failing tests in `frontend/src/components/GuessForm.test.tsx`: (a) submitting empty input shows "Guess cannot be empty" error; (b) submitting non-empty guess calls `store.submitGuess`; (c) on `isCorrect: true` response: input is cleared and "Correct!" is shown; (d) on `isCorrect: false` response: input is cleared; (e) component is not rendered when `isDrawer` prop is true
- [x] T022 [P] Add `submitGuessSchema = z.object({ participantId: z.string().min(1), guess: z.string().trim().min(1, "Guess cannot be empty") })` to `backend/src/api/schemas.ts`
- [x] T023 [US3] Implement `submitGuess(code, participantId, guessText)` with guards (404 room, 400 no round, 403 drawer), case-insensitive comparison, first-correct-only score increment (`guesses.some(g => g.participantId === participantId && g.isCorrect)` check), and `guesses.push(...)` in `backend/src/services/roomStore.ts`
- [x] T024 [US3] Add `POST /:code/guess` handler to `backend/src/api/rooms.ts`: parse `submitGuessSchema`, call `submitGuess`, return `{ isCorrect, room: snapshot }`, forward errors via `next` with `HttpError` mapping
- [x] T025 [US3] Replace stub `GuessForm` with functional implementation: trim + empty client-side guard, call `store.submitGuess(roomCode, participantId, guess)`, on correct → set `feedback = "correct"` + clear input, on incorrect → clear input, always re-enable; accept `roomCode: string`, `participantId: string`, `isDrawer: boolean` props; render nothing when `isDrawer` in `frontend/src/components/GuessForm.tsx`
- [x] T026 [US3] Pass `roomCode={room.code}`, `participantId={participantId ?? ""}`, `isDrawer={isDrawer}` to `<GuessForm>` in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Run `npm run test` (backend + frontend) — T019–T021 pass. Manual: submit correct and incorrect guesses, verify feedback and history.

---

## Phase 6: User Story 4 — Scoring and Guess History (Priority: P2)

**Goal**: The scoreboard renders all participants' scores sorted descending. The guess history panel renders all guesses most-recent-first, with correct guesses visually distinguished. Both update within one polling cycle via the existing room state.

**Independent Test**: With one correct guess and one incorrect guess submitted: scoreboard shows the correct guesser with 100 pts at the top; guess history shows both guesses in reverse-submission order; correct guess is styled differently (e.g. green text).

> **TDD**: Write T027–T028 first and confirm they fail before implementing T029–T031.

- [x] T027 Write failing tests in `frontend/src/components/Scoreboard.test.tsx`: (a) renders each participant's name and score; (b) participants sorted by score descending; (c) participant with highest score appears first; (d) renders "0" for participants with no score
- [x] T028 Write failing tests in `frontend/src/components/ResultPanel.test.tsx`: (a) renders each guess's submitter name and text; (b) most recent guess appears first; (c) correct guesses carry a distinguishing CSS class or attribute; (d) renders empty state gracefully when `guesses` is empty
- [x] T029 [P] [US4] Replace stub `Scoreboard` with functional implementation: accept `participants: Participant[]` prop, render `[...participants].sort((a, b) => b.score - a.score)` as name + score rows in `frontend/src/components/Scoreboard.tsx`
- [x] T030 [P] [US4] Replace stub `ResultPanel` with functional implementation: accept `guesses: Guess[]` prop, render `[...guesses].reverse()` as submitter-name + guess-text rows, apply `correct` CSS class to entries where `isCorrect === true` in `frontend/src/components/ResultPanel.tsx`
- [x] T031 [US4] Pass `participants={room.participants}` to `<Scoreboard>` and `guesses={room.guesses}` to `<ResultPanel>` in `frontend/src/pages/GamePage.tsx`; remove any hardcoded placeholder content from both components

**Checkpoint**: Run `npm run test` (frontend) — T027–T028 pass. Manual: verify scoreboard and history update after guesses.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final build validation, CSS wiring, and end-to-end verification.

- [x] T032 [P] Add CSS for `.drawing-canvas` (cursor: crosshair; display: block; background: white; border: 1px solid #e5e7eb) and `.canvas-display` (max-width: 100%; display: block; min-height: 300px; background: white; border: 1px solid #e5e7eb) and `.guess-history__item--correct` (color: #16a34a; font-weight: 600) in `frontend/src/styles/app.css`
- [x] T033 [P] Run `cd backend && npm run build` — confirm zero TypeScript errors
- [x] T034 [P] Run `cd frontend && npm run build` — confirm zero TypeScript errors
- [x] T035 [P] Run `cd backend && npm run test` — confirm all tests pass and coverage ≥ 80%
- [x] T036 [P] Run `cd frontend && npm run test` — confirm all tests pass and coverage ≥ 80%

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational) ← BLOCKS all story phases
        ├─→ Phase 3 (US1) ← drawer local canvas
        │     └─→ Phase 4 (US2) ← canvas sync (extends US1's GamePage work)
        ├─→ Phase 5 (US3) ← guess submission (independent of US1/US2)
        │     └─→ Phase 6 (US4) ← scoring display (needs guesses to exist)
        └─→ Phase 7 (Polish) ← after all stories complete
```

### User Story Dependencies

| Story | Depends on | Can start after |
|-------|-----------|-----------------|
| US1 (Drawer Canvas) | Phase 2 complete | T006 |
| US2 (Canvas Sync) | Phase 2 + US1 GamePage canvas in place | T010 |
| US3 (Guess Submission) | Phase 2 complete | T006 (independent of US1/US2) |
| US4 (Scoring Display) | Phase 2 + US3 (guesses data exists) | T026 |

### Within Each Story

```
Tests (RED) → Implementation (GREEN) → Tests pass → Commit
```

- **Phase 3**: T007–T008 (RED) → T009–T010 (GREEN) → verify → commit
- **Phase 4**: T011–T013 (RED) → T014–T018 (GREEN) → verify → commit
- **Phase 5**: T019–T021 (RED) → T022–T026 (GREEN) → verify → commit
- **Phase 6**: T027–T028 (RED) → T029–T031 (GREEN) → verify → commit

### Parallel Opportunities

- **T005 + T006**: Both frontend type updates — different files, fully parallel
- **T011 + T012 + T013**: All US2 test writing — different files, fully parallel
- **T014 + T011–T013**: Schema addition can proceed while tests are being written — different files
- **T019 + T020 + T021**: All US3 test writing — different files, fully parallel
- **T022 + T019–T021**: Schema addition parallel with test writing — different files
- **T027 + T028**: Both US4 tests — different files, fully parallel
- **T029 + T030**: Both US4 implementations — different files, fully parallel
- **T033 + T034 + T035 + T036**: All final checks — fully parallel

---

## Parallel Example: Phase 5 (US3) Test Writing

```
# Write all US3 tests simultaneously (different files):
Task T019: submitGuess tests → backend/src/services/roomStore.test.ts
Task T020: submitGuessSchema tests → backend/src/api/schemas.test.ts
Task T021: GuessForm tests → frontend/src/components/GuessForm.test.tsx
```

## Parallel Example: Phase 6 (US4) Implementation

```
# Implement both display components simultaneously (different files):
Task T029: Scoreboard → frontend/src/components/Scoreboard.tsx
Task T030: ResultPanel → frontend/src/components/ResultPanel.tsx
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 2: Foundational types — **CRITICAL GATE**
3. Complete Phase 3 (US1): Drawer draws locally
4. Complete Phase 4 (US2): Canvas syncs to guessers
5. **STOP and VALIDATE**: Two players can see the drawing in real time
6. Demo if ready

### Incremental Delivery

1. Phase 2 → Foundation ready (shared types, models, store updates)
2. Phase 3 → Drawer canvas works locally *(first visible feature)*
3. Phase 4 → Canvas visible to all *(core game loop unlocked)*
4. Phase 5 → Guessing works *(game now playable)*
5. Phase 6 → Scoreboard + history *(full feature complete)*
6. Phase 7 → Build gates passed, CSS polished

---

## Notes

- All [P] tasks operate on distinct files — no merge conflicts when run in parallel
- [US*] labels map directly to user stories in `specs/003-gameplay-interaction/spec.md`
- Constitution Principle I (TDD) is enforced: every story phase has RED tasks before GREEN tasks
- `first-correct-only` scoring logic (T023) is derived from `guesses[]` history — no separate field needed
- `canvasData` is a base64 PNG data URL; `""` means blank canvas — never null/undefined
- Commit after each story's GREEN phase completes and tests pass
