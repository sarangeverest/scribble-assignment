# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction: Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Canvas Interaction (Priority: P1)

The drawer sees a blank canvas at the start of the round and can draw freely on it using their pointing device. Their drawing appears immediately on their own screen as they draw. They can clear the canvas at any time to start fresh. The drawing surface is the primary tool through which the drawer communicates the secret word to guessers.

**Why this priority**: The canvas is the core game mechanic for the drawer. Without a functional drawing surface, no round can proceed.

**Independent Test**: With a round active and a participant in the drawer role, open the game screen. Confirm that a drawing canvas is visible, that pointer/mouse drawing produces visible strokes on the drawer's own screen, and that a "Clear" action removes all strokes from the canvas.

**Acceptance Scenarios**:

1. **Given** a round is active and a participant is the drawer, **When** they view the game screen, **Then** a drawing canvas is visible and ready for input.
2. **Given** the drawer is drawing, **When** they move their pointer across the canvas while pressing, **Then** a stroke appears on the canvas in real time on their own screen.
3. **Given** the drawer has drawn one or more strokes, **When** they activate the clear action, **Then** all strokes are removed and the canvas is blank.

---

### User Story 2 - Drawing Visible to All Participants (Priority: P1)

Within one polling cycle of the drawer completing a stroke, all other participants (guessers) see the updated canvas in their view. Guessers do not interact with the canvas — they observe it. The canvas they see reflects the drawer's most recently submitted drawing state.

**Why this priority**: Guessers cannot make informed guesses without seeing the drawing. This is the fundamental information channel of the game.

**Independent Test**: With two browser tabs — one as drawer, one as guesser — have the drawer draw a stroke. Within approximately 2 seconds (one polling cycle), confirm the guesser's tab shows the updated drawing.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the drawer draws a stroke and completes it, **Then** within one polling cycle all guessers see the updated drawing on their game screen.
2. **Given** the drawer clears the canvas, **When** guessers poll for room state, **Then** their canvas view also shows a blank canvas.
3. **Given** a guesser views the game screen, **When** no drawing has been made yet, **Then** they see a blank canvas (not an error or placeholder message).

---

### User Story 3 - Guess Submission with Validation (Priority: P1)

Guessers can type and submit their guess for the secret word at any time during an active round. Guesses are trimmed of surrounding whitespace before processing. Empty or whitespace-only guesses are rejected with a clear message before any game state changes. The comparison against the secret word is case-insensitive — "ROCKET", "rocket", and "Rocket" are all treated equally.

**Why this priority**: Guess submission is the guesser's primary action in the game. Without it, guessers have no meaningful participation.

**Independent Test**: With a round active (secret word "rocket") and a participant as guesser, submit: an empty guess, a whitespace-only guess, "ROCKET" (uppercase), "rocket" (lowercase), and "banana" (wrong). Confirm empty/whitespace rejected with message; "ROCKET" and "rocket" both count as correct; "banana" is incorrect.

**Acceptance Scenarios**:

1. **Given** a round is active and a participant is a guesser, **When** they submit an empty or whitespace-only guess, **Then** the submission is rejected and a message such as "Guess cannot be empty" is shown, with no change to game state.
2. **Given** the secret word is "rocket", **When** a guesser submits "ROCKET" or "Rocket" or "  rocket  " (with spaces), **Then** the guess is treated as correct after trimming and case-insensitive comparison.
3. **Given** the secret word is "rocket", **When** a guesser submits "banana", **Then** the guess is treated as incorrect.
4. **Given** the drawer is viewing the game screen, **When** the guess input is present in the UI, **Then** it is hidden or disabled — the drawer cannot submit guesses.
5. **Given** a guesser submits the correct answer, **When** the submission is accepted, **Then** the input is cleared, a "Correct!" feedback message is shown, and the input is re-enabled so further guesses can be submitted.

---

### User Story 4 - Scoring and Guess History (Priority: P2)

Every participant's score starts at 0 when a round begins. A correct guess adds 100 points to the guesser's score; an incorrect guess adds 0. The full guess history — including both correct and incorrect guesses along with who submitted them — is visible to all participants and stays up to date via the polling mechanism. Scores are also visible to all participants at all times.

**Why this priority**: Scoring is the game's reward mechanic. Guess history provides social context. Both rely on the same polling-synced data, so they are delivered together.

**Independent Test**: With a round active and two guessers, have one submit a wrong guess and another submit a correct guess. Confirm: (a) the correct guesser's score increases by 100, (b) the wrong guesser's score stays at 0, (c) both guesses appear in the guess history for all participants within one polling cycle.

**Acceptance Scenarios**:

1. **Given** a round has just started, **When** any participant views the scoreboard, **Then** all participants show a score of 0.
2. **Given** a guesser submits their first correct guess this round, **When** the next poll completes, **Then** that guesser's score has increased by exactly 100 and all participants see the updated score.
2. **Given** a guesser has already submitted a correct guess this round, **When** they submit the correct answer again, **Then** the guess is accepted and recorded in history but their score does not change.
3. **Given** a guesser submits an incorrect guess, **When** the next poll completes, **Then** their score is unchanged and all participants see no score change.
4. **Given** guesses have been submitted, **When** any participant views the guess history, **Then** they see all guesses (correct and incorrect) most-recent-first with the submitter's name and correctness indicated.

---

### Edge Cases

- What if a guesser submits a guess with only Unicode whitespace (e.g., a non-breaking space)? — Treated as whitespace-only; rejected with the same message as a blank guess.
- What if the same guesser submits the correct answer more than once? — Only the first correct guess per player awards +100. Subsequent correct submissions from the same player are recorded in the guess history but score 0.
- What if the drawer tries to submit a guess via a modified client request? — The server rejects it; the drawer's participantId matches the drawerId and is rejected with an error.
- What if a participant's canvas image is large? — Accepted as-is; no server-side size cap in scope for a single-instance local game.
- What if the drawing polling returns stale data due to a slow network? — The canvas reflects the most recent server-stored state on each successful poll. No special stale-data handling.
- What if two guessers submit correct guesses simultaneously? — Both are accepted and both scores increase by 100. Scoring is non-exclusive; first-guesser priority is a future feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display an interactive drawing canvas to the drawer during an active round.
- **FR-002**: The system MUST render the drawer's strokes on the canvas as they draw (on the drawer's own screen).
- **FR-003**: The system MUST allow the drawer to clear the canvas, removing all strokes.
- **FR-004**: The system MUST sync the current canvas state to all participants via the polling mechanism; guessers' canvas view MUST update within one polling cycle of the drawer completing a stroke.
- **FR-005**: The system MUST allow guessers to submit text guesses during an active round.
- **FR-006**: The system MUST trim leading and trailing whitespace from guess text before any processing or comparison.
- **FR-007**: The system MUST reject guesses that are empty or whitespace-only after trimming, and return a clear message to the guesser.
- **FR-008**: The system MUST compare the trimmed guess text to the secret word case-insensitively.
- **FR-009**: The first correct guess per player per round MUST add exactly 100 points to that player's score. Subsequent correct guesses from the same player in the same round MUST add 0 points.
- **FR-010**: An incorrect guess MUST add 0 points (the guesser's score remains unchanged).
- **FR-011**: All participant scores MUST be included in the room state returned by polling and visible to all participants.
- **FR-012**: All submitted guesses (correct and incorrect) MUST be included in the room state returned by polling, visible to all participants most-recent-first.
- **FR-013**: The drawer MUST NOT be able to submit guesses; any such attempt MUST be rejected.

### Key Entities

- **Guess**: A single guess submission. Carries the guesser's identity, the submitted text (trimmed), a correctness flag, and a timestamp. Public to all participants.
- **Score**: A running integer total per participant, starting at 0 at round start. Incremented by 100 on each correct guess. Stored on the participant record.
- **Canvas State**: The current visual state of the drawing canvas, stored server-side and updated by the drawer. Delivered to all participants on each poll as an image representation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer's strokes appear on their own canvas with no perceptible delay (within the same interaction frame).
- **SC-002**: All guessers see the updated canvas state within one polling cycle (~2 seconds) of the drawer completing a stroke.
- **SC-003**: 100% of empty or whitespace-only guess submissions are rejected with a user-visible message, with no change to game state.
- **SC-004**: Correct guesses award exactly 100 points; updated scores are visible to all participants within one polling cycle of submission.
- **SC-005**: The complete guess history is visible to all participants within one polling cycle of each guess submission.
- **SC-006**: Case-insensitive comparison is applied 100% of the time — "ROCKET" and "rocket" always produce the same correctness outcome for the same secret word.

## Assumptions

- The round remains active until a future "end round" or "results" feature is implemented; a correct guess does not automatically end the round.
- All participant scores default to 0 when the participant joins (the score field is initialised in `createParticipant`). There is no score reset on round start; since no scoring can occur before a round begins, scores are effectively 0 at round start for the first round. Round-reset is a future feature.
- Guess attempts are unlimited in number; there is no cap on submissions. However, only the first correct guess per player per round awards +100 points — subsequent correct submissions from the same player score 0.
- Canvas drawing uses a single default style (e.g., black stroke, fixed width); brush customisation (color, size) is out of scope.
- The drawer is determined by the Scenario 2 flow (host is drawer for round 1); drawer rotation is out of scope.
- The canvas state is held in-memory and is lost on server restart; persistence across restarts is out of scope.
- The drawer's own canvas drawing is rendered locally on the drawer's device; it is also synced to the server so guessers can see it.
- Scoring is non-exclusive: all guessers who submit the correct answer score 100 points independently. First-guesser priority (only the first correct guesser scores) is a future feature.

## Clarifications

### Session 2026-06-19

- Q: When multiple guessers submit the correct answer, do they all score or only the first? → A: All correct guessers score 100 independently; first-guesser priority is a future feature.
- Q: Does a guesser who already answered correctly score +100 again on repeated correct submissions? → A: No — only the first correct guess per player per round awards +100; subsequent correct submissions score 0.
- Q: After a correct guess, what state is the GuessForm in? → A: Input is cleared and a "Correct!" message is shown, then the input is re-enabled for further submissions.
