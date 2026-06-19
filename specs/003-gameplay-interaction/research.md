# Research: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-19

No NEEDS CLARIFICATION items — the existing codebase, constitution, and clarification session fully resolve all decisions. This file documents the key findings and design rationale.

---

## Decision 1: Canvas Sync Mechanism

**Decision**: Image-based sync — after each `pointerup` event the drawer serialises the `<canvas>` to a base64 PNG data URL and POSTs it to `POST /api/rooms/:code/drawing`. The server stores it as `currentRound.canvasData: string`. Every poll response includes `canvasData`; guessers render it in an `<img>` tag. Clearing posts `canvasData: ""`.

**Rationale**: No WebSockets and no SSE means the only sync channel is HTTP polling. A PNG data URL (~10–15 KB for a typical drawing) is a bounded payload well within tolerance for a local single-instance game. The image approach eliminates a client-side stroke-replay engine, keeping the frontend thin. Per-stroke serialisation (on `pointerup`) gives one network round-trip per completed stroke — not per pixel — which is a reasonable frequency for polling-based sync.

**Alternatives considered**: Stroke-based command array (smaller per-event payload, but requires a faithful client-side replay engine that must handle ordering, partial strokes, and clearing across poll cycles — disproportionate complexity). No canvas sync at all (guessers could not see the drawing, breaking the core game mechanic).

---

## Decision 2: Guess Validation Strategy

**Decision**: Server is authoritative: Zod trims the `guess` field and rejects empty after trim (`.trim().min(1)`). `submitGuess` then compares `guessText.toLowerCase()` against `room.currentRound.word.toLowerCase()`. Client mirrors trim + empty check for UX.

**Rationale**: Same dual-validation pattern from feature 002 (name validation). The server comparison must be case-insensitive per spec (FR-008). Trim prevents accidental rejection of a correct guess with surrounding whitespace (FR-006).

**Alternatives considered**: Client-only validation — rejected; server must be authoritative so the correctness flag written to game state is trustworthy.

---

## Decision 3: First-Correct-Only Scoring (FR-009)

**Decision**: On `submitGuess`, before awarding points, check `room.currentRound.guesses.some(g => g.participantId === participantId && g.isCorrect)`. If true, the player has already scored this round → award 0 and record the guess as `isCorrect: true` in history without mutating `participant.score`. If false, award +100 and record.

**Rationale**: FR-009 (clarified): first correct guess per player per round = +100; subsequent correct guesses = 0. Deriving the "has already scored" check from the existing `guesses` array avoids a separate `correctGuesserIds` field on `Round`, keeping the data model minimal. For a local game with 2–20 players the linear scan is negligible. A separate field would duplicate information already encoded in `guesses`.

**Alternatives considered**: Separate `correctGuesserIds: string[]` on `Round` (faster lookup, but redundant state that must be kept in sync). Per-guess `scoredPoints` field (useful for a results screen but premature for this feature scope).

---

## Decision 4: Scoring Storage

**Decision**: Additive integer `score` field on `Participant` (default `0` on `createParticipant`). Score is mutated in-place within `room.participants[]` on each `submitGuess` that awards points. Score flows to the frontend via the existing `participants` array in `RoomSnapshot`.

**Rationale**: Spec says "correct guesses score 100 (incorrect add 0)." A running total on each participant stored alongside existing participant data is the smallest change. The score reaches the frontend for free through `participants` — no separate endpoint or type change is needed beyond adding the field.

**Alternatives considered**: Per-round score log — deferred to future results/scoreboard features.

---

## Decision 5: Guess History Shape

**Decision**: `guesses: Guess[]` on `Round`, included in `RoomSnapshot` for all participants. Each `Guess` carries `{ participantId, participantName, text, isCorrect, timestamp }`. `participantName` is denormalised at write time.

**Rationale**: Guess history is public information. `participantName` is denormalised so the frontend can render the history without joining against `participants[]` on every render. `isCorrect` lets the UI style correct vs. incorrect guesses. There is no `scoredPoints` field — the scoreboard reads from `participant.score` directly, and the history shows correctness, not points. This keeps the entity lean while satisfying FR-012.

**Alternatives considered**: `isCorrect: true` + separate `scored: boolean` — useful but premature; the scoreboard already communicates actual points earned.

---

## Decision 6: Drawer Canvas Guard

**Decision**: `updateCanvas` rejects any call where `participantId !== room.currentRound.drawerId` with a 403. This is a server-side enforcement of the game rule that only the drawer controls the canvas.

**Rationale**: The spec clarification session deferred this to the plan as an "implementation guard." It is trivially implementable (single equality check) and prevents a client that bypasses the UI from corrupting the shared canvas state.

---

## Decision 7: GuessForm Post-Correct UX (FR-009 + Clarification Q3)

**Decision**: After a successful `submitGuess` that returns `isCorrect: true`, the `GuessForm` clears its input and renders a "Correct!" message in-component, then re-enables the input. After an incorrect guess the input is also cleared (no error message beyond the guess appearing in the history). The component re-enables immediately in both cases, consistent with the unlimited-submission assumption.

**Rationale**: Clarification Q3 answer: "Input is cleared and a 'Correct!' message is shown, then the input is re-enabled." The "Correct!" feedback is scoped to the form; the guess history provides the persistent record. Clearing on incorrect keeps the input fresh without requiring a separate error state for guess content.

---

## Decision 8: Canvas Rendering for Guessers

**Decision**: Guessers render the canvas via `<img src={room.canvasData || undefined} />`. When `canvasData === ""` (blank or pre-drawing), `src` is `undefined` and the `<img>` renders nothing — the surrounding card shows an empty white area. No placeholder text.

**Rationale**: US2 acceptance scenario 3: "they see a blank canvas (not an error or placeholder message)." An `<img>` with `undefined` src renders as an empty element with no broken-image icon when given appropriate CSS (`min-height`, `background: white`). This is simpler than a conditional `<canvas>` replay approach.

**Alternatives considered**: `<canvas>` element on guesser side that replays stroke commands — rejected (requires stroke storage and replay engine); keeping the existing "Waiting for drawer..." placeholder — rejected per spec.
