# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation: Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Result Display (Priority: P1)

When the host ends the round, all participants transition automatically to a results screen within approximately 2 seconds. The results screen reveals the secret word to every participant (not just the drawer), displays final scores for all participants sorted highest-to-lowest, and shows the complete guess history most-recent-first with correct/incorrect indicators. Non-host participants wait on the results screen until the host restarts.

**Why this priority**: The results screen is the natural conclusion of a round and the primary information payoff for all players — revealing who knew the answer and how well everyone scored.

**Independent Test**: With a round active (secret word "rocket"), have the host click "End Round". Confirm that within 2 seconds all participant tabs show the results screen with: (a) "rocket" revealed as the secret word, (b) final scores for all players, (c) the complete guess history.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the host ends the round, **Then** all participants see the results screen within 2 seconds.
2. **Given** the results screen is displayed, **When** any participant views it, **Then** the secret word is visible to all participants regardless of their role (drawer or guesser).
3. **Given** the results screen is displayed, **When** any participant views it, **Then** all participant scores are shown sorted highest-to-lowest.
4. **Given** the results screen is displayed, **When** any participant views it, **Then** the complete guess history (correct and incorrect) is visible most-recent-first with the submitter's name and correctness indicated.
5. **Given** a non-host participant is on the results screen, **When** no host action has occurred, **Then** they see a waiting indicator rather than a restart control.

---

### User Story 2 — Host Restart (Priority: P1)

From the results screen, the host can restart the game. On restart, the room returns to the waiting lobby, all participants from the previous round are preserved in the room, and all round data (secret word, guesses, canvas) is cleared. All other participants are automatically redirected to the lobby within 2 seconds when they detect the status change. Scores accumulated across rounds are preserved; only round data is cleared.

**Why this priority**: Restart closes the game loop — without it, every session is a dead end requiring manual room recreation.

**Independent Test**: With a results screen displayed (host + one guesser), have the host click "Back to Lobby". Confirm: (a) both tabs redirect to the lobby within 2 seconds, (b) both participants still appear in the lobby player list, (c) the next game start begins with no prior guesses or canvas data.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed and the participant is the host, **When** they click "Back to Lobby", **Then** the room returns to lobby status and all round data is cleared.
2. **Given** the host has restarted, **When** any participant's results screen checks for updates, **Then** their view automatically navigates to the lobby within 2 seconds.
3. **Given** the host has restarted, **When** the lobby is displayed, **Then** all participants from the previous round are present in the participant list.
4. **Given** the host has restarted and a new game is started, **When** any participant views the game screen, **Then** there are no guesses and no canvas data from the previous round.
5. **Given** the results screen is displayed and the participant is NOT the host, **Then** no restart control is visible or accessible to them.

---

### Edge Cases

- What if the host ends a round that has no guesses? — Allowed; the results screen shows an empty guess history and all scores at 0.
- What if a non-host participant tries to end the round? — The system rejects the action; only the host may end a round.
- What if a non-host participant tries to restart the game? — The system rejects the action; only the host may restart.
- What if a participant accesses the results screen directly without a round having ended? — The system redirects them to the appropriate screen based on the current game state.
- What if the host leaves before restarting? — The room remains in results status; other participants continue waiting on the results screen. Host reconnection and room cleanup are future features.
- What if the host restarts and immediately starts a new game? — The new round begins with the word selection mechanism from the previous start; scores from the prior round are preserved and continue to accumulate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the host ends the round, the system MUST transition the game to a results state.
- **FR-002**: Only the host MUST be able to end the round; any non-host attempt MUST be rejected.
- **FR-003**: When a round ends, the system MUST make the secret word visible to ALL participants in the results view.
- **FR-004**: The results screen MUST display the secret word, final scores (sorted highest-to-lowest), and the complete guess history to all participants. The guess history MUST be ordered most-recent-first; each entry MUST show the submitter's name and a correct/incorrect indicator.
- **FR-005**: The system MUST include a restart control (e.g., "Back to Lobby" button) visible only to the host on the results screen.
- **FR-006**: When the host restarts, the system MUST return the room to lobby status and clear all round data.
- **FR-007**: Only the host MUST be able to restart; any non-host attempt MUST be rejected.
- **FR-008**: All participants MUST be preserved in the room after a restart; no participant is removed.
- **FR-009**: All participants MUST automatically transition to the lobby within 2 seconds of the host restarting.
- **FR-010**: All participants MUST automatically transition to the results screen within 2 seconds of the host ending the round.
- **FR-011**: Scores accumulated in previous rounds MUST be preserved after a restart; only round data is cleared.

### Key Entities

- **Game State**: Extended with a results phase that follows an active round. Three phases total: waiting for players (lobby), active round (in-game), round complete (results).
- **Secret Word Visibility**: Hidden from guessers during an active round (known only to the drawer); revealed to all participants when the round ends.
- **Round Data**: The completed round's data (guesses, canvas drawing, secret word) remains accessible during results display and is cleared when the host restarts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Within 2 seconds of the host ending the round, all participants' screens transition from the game view to the results view.
- **SC-002**: The results screen shows the correct secret word, accurate final scores, and the complete guess history for 100% of participants.
- **SC-003**: Within 2 seconds of the host restarting, all participants' screens transition from the results view to the lobby view.
- **SC-004**: After restart, the lobby participant count matches the pre-restart count (no participants lost).
- **SC-005**: After restart and a new game start, the new round has zero guesses and empty canvas data.

## Assumptions

- Score reset on restart is out of scope for this scenario; scores accumulate across rounds within a session. Only round data (guesses, canvas, secret word) is cleared on restart.
- The host is always present during the end-round and restart flow; host departure handling is a future feature.
- The next game after restart uses the same word selection mechanism as the initial start; word rotation is a future feature.
- A single results phase covers the post-round state; multi-round tournament tracking is out of scope.
- The round end is a manual host action; automatic round-end triggers (all guessers correct, timer expiry) are out of scope.
- The game supports one active round at a time; concurrent rounds are out of scope.
