# Research: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Date**: 2026-06-19

All decisions were resolved from existing codebase patterns and the spec. No unknowns required external research.

## Decisions

### 1. Status Machine Extension

**Decision**: Add `"results"` as a third value to the `RoomStatus` union (`"lobby" | "in-game" | "results"`).

**Rationale**: The existing pattern uses a discriminated string union for room status. Adding one value is the minimal change that gives the application a concrete state to branch on. No new type or interface is needed.

**Alternatives considered**:
- Separate `isResultsActive: boolean` flag — rejected; the status field already encodes all room phases and a flag would introduce a second source of truth.
- Reuse `"lobby"` status post-round — rejected; all participants need to distinguish "pre-game lobby" from "just-finished results" to render the correct screen.

---

### 2. Secret Word Visibility in Results

**Decision**: When `room.status === "results"`, `toRoomSnapshot` returns `secretWord` unconditionally (no `viewerParticipantId` check).

**Rationale**: The existing `toRoomSnapshot` already performs a conditional inclusion via spread; adding a status check is a one-line extension. Revealing the word to everyone is the intended UX of the results screen (spec FR-003).

**Alternatives considered**:
- Add a separate `revealedWord` field to `RoomSnapshot` — rejected; the existing `secretWord` field already carries the semantics; a second field would be redundant.

---

### 3. Round End Trigger

**Decision**: Manual host action via `POST /rooms/:code/end`.

**Rationale**: Spec Assumption: "The round end is a manual host action; automatic round-end triggers (all guessers correct, timer expiry) are out of scope." Manual host control is consistent with how `startGame` works.

**Alternatives considered**:
- Auto-end when all guessers answer correctly — deferred per spec assumptions.
- Timer-based auto-end — deferred per spec assumptions.

---

### 4. Restart Behaviour — Score Reset

**Decision**: Scores are NOT reset on restart. Only `currentRound` is cleared.

**Rationale**: Spec FR-011: "Scores accumulated in previous rounds MUST be preserved after a restart; only round data is cleared." Scores live on `Participant`, not on `Round`; clearing `currentRound` leaves `participants[].score` untouched.

**Alternatives considered**:
- Reset all scores on restart — rejected by spec FR-011.

---

### 5. ResultsPage Routing

**Decision**: Dedicated `/results` route with a new `ResultsPage` component. Each page (`GamePage`, `ResultsPage`) owns its own status-redirect `useEffect`.

**Rationale**: Mirrors the existing routing pattern (one route per game phase: `/lobby` → `LobbyPage`, `/game` → `GamePage`). Avoids conditional rendering sprawl inside `GamePage`.

**Alternatives considered**:
- Inline results panel inside `GamePage` — rejected; would couple two distinct phases into one component and complicate redirect logic.

---

### 6. Non-Host Access Guard

**Decision**: Defense in depth — server-side 403 rejection + client-side button hidden.

**Rationale**: Matches the existing `startGame` pattern. The server is the authority; the client hide is UX convenience only.
