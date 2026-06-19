# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**TDD**: Tests MUST be written and confirmed failing before any implementation begins (Constitution Principle I).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 2: Foundational — Type System (Blocking Prerequisites)

**Purpose**: Add the `"results"` status to the shared type system. All US1 and US2 work depends on this change.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Add `"results"` to `RoomStatus` union type in `backend/src/models/game.ts`
- [ ] T002 [P] Update `RoomStatus` type alias to include `"results"` in `frontend/src/services/api.ts`

**Checkpoint**: Both packages compile with the updated type; TypeScript reports no errors.

---

## Phase 3: User Story 1 — Result Display (Priority: P1) 🎯 MVP

**Goal**: When the host ends the round, all participants automatically see a results screen showing the revealed secret word, final scores, and full guess history within ~2 seconds.

**Independent Test**: With two browser tabs (host + guesser) in an active round, host clicks "End Round". Within 2 seconds both tabs navigate to `/results` showing the secret word, sorted scores, and guess history. The guesser tab shows "Waiting for host to restart…" instead of a button.

### Tests for User Story 1 (RED — write first, verify failing)

- [ ] T003 [US1] Write failing tests for `endRound` service (404/400/403/transitions-to-results/preserves-round-data/exposes-secretWord-for-all) in `backend/src/services/roomStore.test.ts`
- [ ] T004 [P] [US1] Write failing tests for `endRoundSchema` (rejects empty participantId, accepts valid participantId) in `backend/src/api/schemas.test.ts`
- [ ] T005 [P] [US1] Write failing tests for `ResultsPage` display (no-room guard, stays-on-results, in-game redirect, secretWord rendered, Scoreboard rendered, ResultPanel rendered, polls every 2000ms) in `frontend/src/pages/ResultsPage.test.tsx` — `ResultPanel` is an inline component defined in the same file as `ResultsPage`
- [ ] T006 [P] [US1] Write failing tests for `GamePage`: navigates to `/results` when `room.status === "results"`, "End Round" button visible for host, hidden for non-host in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1 (GREEN)

- [ ] T007 [US1] Implement `endRound` function and update `toRoomSnapshot` to expose `secretWord` for all viewers when `room.status === "results"` in `backend/src/services/roomStore.ts`
- [ ] T008 [P] [US1] Add `endRoundSchema` (`z.object({ participantId: z.string().min(1) })`) to `backend/src/api/schemas.ts`
- [ ] T009 [US1] Add `POST /:code/end` route handler (parse `endRoundSchema`, call `endRound`, return `{ room: snapshot }`) in `backend/src/api/rooms.ts`
- [ ] T010 [US1] Add `endRound(code, participantId)` API call (`POST /rooms/:code/end`) in `frontend/src/services/api.ts`
- [ ] T011 [P] [US1] Add `endRound(code, participantId)` store method (calls `api.endRound`, then `this.setRoomSnapshot`) in `frontend/src/state/roomStore.ts`
- [ ] T012 [US1] Add `"results"` status redirect (`navigate("/results", { replace: true })`) and "End Round" host button (calls `store.endRound`) to `frontend/src/pages/GamePage.tsx`
- [ ] T013 [US1] Implement `ResultsPage` component: polling `useEffect` (2000ms, clearInterval on unmount), guard redirect (`!room → /`), status redirect (`"in-game" → /game`), display of `room.secretWord` in a `<Card>`, `<Scoreboard participants={room.participants} />`, `<ResultPanel guesses={room.guesses} />` in `frontend/src/pages/ResultsPage.tsx` — define `ResultPanel` as an inline function component at the top of this same file (not a separate file); renders guesses most-recent-first with submitter name and correct/incorrect indicator
- [ ] T014 [US1] Add `/results` route (`<Route path="/results" element={<ResultsPage />} />`) in `frontend/src/routes/index.tsx`
- [ ] T015 [P] [US1] Add ResultsPage CSS classes (`.results-page`, `.results-page__header`, `.results-page__title`, `.results-page__word`, `.results-page__columns`, `.results-page__waiting`) in `frontend/src/styles/app.css`

**Checkpoint**: After T015, the end-round flow is fully functional. Host sees results screen with secret word. Non-host tabs auto-redirect and see the same data plus "Waiting for host to restart…" text (not yet interactive).

---

## Phase 4: User Story 2 — Host Restart (Priority: P1)

**Goal**: From the results screen, the host can restart the game. All participants automatically return to the lobby within ~2 seconds with their participant data preserved and all round data cleared.

**Independent Test**: On the results screen (host + guesser), host clicks "Back to Lobby". Within 2 seconds both tabs navigate to `/lobby`. Both participants appear in the player list. Starting a new game shows no prior guesses and no canvas data.

### Tests for User Story 2 (RED — write first, verify failing)

- [ ] T016 [US2] Write failing tests for `restartGame` service (404/400/403/transitions-to-lobby/clears-currentRound/preserves-participants-and-scores) in `backend/src/services/roomStore.test.ts`
- [ ] T017 [P] [US2] Write failing tests for `restartGameSchema` (rejects empty participantId, accepts valid participantId) in `backend/src/api/schemas.test.ts`
- [ ] T018 [US2] Write failing tests for `ResultsPage` restart flow ("Back to Lobby" button shown for host, hidden for non-host, waiting message for non-host, calls `store.restartGame` on click, navigates to `/lobby` when `room.status === "lobby"`) in `frontend/src/pages/ResultsPage.test.tsx`

### Implementation for User Story 2 (GREEN)

- [ ] T019 [US2] Implement `restartGame` function (guards: 404/400/403, sets `room.status = "lobby"`, clears `room.currentRound = undefined`) in `backend/src/services/roomStore.ts`
- [ ] T020 [P] [US2] Add `restartGameSchema` (`z.object({ participantId: z.string().min(1) })`) to `backend/src/api/schemas.ts`
- [ ] T021 [US2] Add `POST /:code/restart` route handler (parse `restartGameSchema`, call `restartGame`, return `{ room: snapshot }`) in `backend/src/api/rooms.ts`
- [ ] T022 [US2] Add `restartGame(code, participantId)` API call (`POST /rooms/:code/restart`) in `frontend/src/services/api.ts`
- [ ] T023 [P] [US2] Add `restartGame(code, participantId)` store method (calls `api.restartGame`, then `this.setRoomSnapshot`) in `frontend/src/state/roomStore.ts`
- [ ] T024 [US2] Extend `ResultsPage`: add "Back to Lobby" `<button>` for host (calls `store.restartGame`), waiting message `<p>` for non-host, and `"lobby"` status redirect (`navigate("/lobby", { replace: true })`) in `frontend/src/pages/ResultsPage.tsx`

**Checkpoint**: After T024, the full game loop is complete. End round → results → restart → lobby → new game all work end-to-end.

---

## Phase 5: Polish & Validation

**Purpose**: Confirm TypeScript compilation and test coverage meet constitution requirements (≥80%).

- [ ] T025 Run backend tests and confirm all pass: `cd backend && npm run test` in `backend/`
- [ ] T026 [P] Run frontend tests and confirm all pass: `cd frontend && npm run test` in `frontend/`
- [ ] T027 [P] Verify backend TypeScript build succeeds with zero errors: `cd backend && npm run build` in `backend/`
- [ ] T028 [P] Verify frontend TypeScript build succeeds with zero errors: `cd frontend && npm run build` in `frontend/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. **BLOCKS all user stories.**
- **US1 (Phase 3)**: Depends on Phase 2 completion.
- **US2 (Phase 4)**: Depends on Phase 3 completion (US2 extends `ResultsPage` created in US1).
- **Polish (Phase 5)**: Depends on US1 + US2 completion.

### User Story Dependencies

- **US1**: Independently testable after Phase 3 — end-round and result display work without restart.
- **US2**: Builds on `ResultsPage.tsx` and `roomStore.ts` from US1; must follow US1.

### Within Each User Story

- Tests (T003–T006 / T016–T018) MUST be written and **confirmed failing** before any GREEN implementation begins.
- Backend and frontend implementation tasks can run in parallel once tests are confirmed RED.
- Service functions before route handlers within the same package.
- API client method before store method (though both can be scaffolded independently).
- Store method before page component (page calls store methods).
- Page component before route registration.

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
T001 (backend/models/game.ts)  ──┐
                                 ├─ run in parallel (different packages)
T002 (frontend/api.ts)         ──┘
```

### Phase 3 Tests (all RED, all different files — run together)

```
T003 (roomStore.test.ts)   ──┐
T004 (schemas.test.ts)     ──┤
T005 (ResultsPage.test.tsx)──┤  all in parallel
T006 (GamePage.test.tsx)   ──┘
```

### Phase 3 Implementation (after all RED tests confirmed)

```
T007 (roomStore.ts)    ──┐
T008 (schemas.ts)      ──┤  parallel (different files)
T010 (api.ts)          ──┤
T011 (state/roomStore) ──┘
        │
        ▼
T009 (rooms.ts — after T007+T008)
T012 (GamePage — after T011)
T013 (ResultsPage — after T010+T011)
        │
        ▼
T014 (routes/index.tsx — after T013)
T015 (app.css — parallel with T013/T014)
```

### Phase 4 Tests (all RED, all different files — run together)

```
T016 (roomStore.test.ts)    ──┐
T017 (schemas.test.ts)      ──┤  parallel
T018 (ResultsPage.test.tsx) ──┘
```

### Phase 4 Implementation

```
T019 (roomStore.ts)     ──┐
T020 (schemas.ts)       ──┤  parallel
T022 (api.ts)           ──┤
T023 (state/roomStore)  ──┘
        │
        ▼
T021 (rooms.ts — after T019+T020)
T024 (ResultsPage — after T022+T023)
```

### Phase 5 Polish (all parallel)

```
T025 (backend test) ──┐
T026 (frontend test)──┤  all parallel
T027 (backend build)──┤
T028 (frontend build)─┘
```

---

## Implementation Strategy

### MVP (US1 only)

1. Complete Phase 2 (Foundational)
2. Complete Phase 3 (US1 — Result Display)
3. **Validate**: host ends round → all tabs show results screen
4. Stop and demo if needed

### Full Delivery

1. Phase 2 → Phase 3 → Phase 4 → Phase 5
2. Each phase checkpoint validates independently

---

## Notes

- `[P]` tasks touch different files — no shared write conflicts
- Constitution requires TDD: every RED task must produce a failing test BEFORE GREEN begins
- `ResultsPage.tsx` is created in T013 (US1) and extended in T024 (US2) — ensure T013 scaffolds the page with correct exports before T024 runs
- Error-forwarding pattern in `rooms.ts` handlers: parse prefix from thrown error message (e.g., `"404: ..."`) to set `statusCode`, same as `startGame` handler
- Polling loop in `ResultsPage` MUST use `clearInterval` on unmount (same pattern as `LobbyPage` and `GamePage`)
