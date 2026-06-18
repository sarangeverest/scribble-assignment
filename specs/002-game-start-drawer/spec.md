# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow: Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Name Validation on Join (Priority: P1)

A player attempting to create or join a game must provide a non-empty, non-whitespace name. Names entered with only spaces or left blank are rejected immediately with a clear feedback message before any room interaction occurs. Valid names with surrounding whitespace are trimmed and accepted.

**Why this priority**: Name validation is a gate that must work before any game flow can begin. Without it, empty names can appear in the participant list and the drawer identity becomes ambiguous.

**Independent Test**: Attempt to create or join a room with an empty name, a whitespace-only name (e.g., `"   "`), and a name with leading/trailing spaces. Confirm that empty/whitespace-only names are rejected with a message, and that a padded name (e.g., `"  Alice  "`) is accepted and stored as `"Alice"`.

**Acceptance Scenarios**:

1. **Given** a player enters only spaces in the name field, **When** they submit the form, **Then** the submission is blocked and a message such as "Name cannot be empty" is shown.
2. **Given** a player leaves the name field entirely blank, **When** they submit the form, **Then** the submission is blocked and a validation message is shown.
3. **Given** a player enters `"  Alice  "` (with surrounding whitespace), **When** they submit the form, **Then** the name is trimmed to `"Alice"` and accepted — the participant is recorded as `"Alice"`.
4. **Given** a player enters a name longer than 20 characters after trimming, **When** they submit the form, **Then** the submission is blocked and a message such as "Name must be 20 characters or fewer" is shown.

---

### User Story 2 - Host Identified as Drawer at Round Start (Priority: P1)

When the host starts the game and the first round begins, the host is automatically assigned the drawer role. All participants can clearly see who the current drawer is. The drawer themselves sees a prominent indicator of their own role that distinguishes their view from guessers.

**Why this priority**: Correct role assignment is the foundation of every round. Without a clearly identified drawer, no drawing or guessing flow can proceed.

**Independent Test**: With a host and at least one other player in the lobby, have the host start the game. Confirm that the host's participant record carries the drawer role, that all participants' views show the drawer's name, and that the host's view highlights their drawer status (e.g., a "You are drawing!" label).

**Acceptance Scenarios**:

1. **Given** a room has 2+ players and the host starts the game, **When** the first round begins, **Then** the host is assigned the drawer role and all other participants are assigned the guesser role.
2. **Given** the first round is active, **When** a non-host participant views the game screen, **Then** they see the drawer's name clearly indicated (e.g., "Drawing: Alice") but do not see the secret word.
3. **Given** the first round is active, **When** the drawer (host) views the game screen, **Then** they see a clear role indicator (e.g., "You are drawing!") distinguishing their view from guessers.

---

### User Story 3 - Secret Word Visible Only to Drawer (Priority: P1)

At round start, a secret word is selected deterministically from the starter word list and shown exclusively to the drawer. Guessers see no hint of the word anywhere in their view.

**Why this priority**: The word-secrecy guarantee is the core game mechanic. If guessers can see the word, the game is broken at the most fundamental level.

**Independent Test**: Start a game with two participants in separate browser tabs. Confirm that the drawer's tab displays the secret word, and the guesser's tab contains no trace of that word in any visible text or rendered content.

**Acceptance Scenarios**:

1. **Given** the first round has started, **When** the drawer views the game screen, **Then** the secret word is displayed prominently (e.g., "Your word: pizza").
2. **Given** the first round has started, **When** a guesser views the game screen, **Then** the secret word is absent from their view entirely — no text, label, or hint reveals it.
3. **Given** a game starts, **When** the word is selected, **Then** it is chosen deterministically from the starter list (first word for round 1), so the outcome is predictable and testable.

---

### Edge Cases

- What happens when a player's name consists entirely of Unicode whitespace? — Treated as whitespace-only; rejected with the same message as a blank name.
- What happens if the starter word list is empty? — Round start is blocked with a clear error; a game cannot begin without available words. Implemented as a defensive guard in `startGame` (FR-003 scope).
- Can a player change their name after joining but before the game starts? — Out of scope; names are fixed on join.
- What if two participants join with the same trimmed name? — Allowed; names are display labels only, not unique identifiers (participants are identified by ID).
- What happens when a player tries to join a room that is already in-game? — Out of scope; late-join behavior is deferred to a future feature.
- What do non-drawer participants see in the polling gap after game start? — The lobby view persists until the next poll confirms the game has started; no special transition state is required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading and trailing whitespace from player names before storing or processing them.
- **FR-002**: The system MUST reject any player name that is empty or whitespace-only after trimming, and return a clear error message to the user.
- **FR-002a**: The system MUST reject any player name that exceeds 20 characters after trimming, and return a clear error message to the user.
- **FR-003**: When the first round begins, the system MUST assign the drawer role to the host (the room creator).
- **FR-004**: All non-drawer participants MUST be assigned the guesser role at round start.
- **FR-005**: The game screen MUST display the current drawer's name to all participants.
- **FR-006**: The drawer's own view MUST include a clear indicator that they are the drawer (visually distinct from the guesser view).
- **FR-007**: The system MUST select the secret word deterministically from the starter word list (first available word for round 1).
- **FR-008**: The secret word MUST be transmitted to and displayed for the drawer only.
- **FR-009**: The secret word MUST NOT appear in any data or view accessible to guesser participants.
- **FR-010**: The room state returned to all participants via polling MUST include the current drawer's identity without exposing the secret word to non-drawers.

### Key Entities

- **Participant**: A player in a room, identified by a unique ID. Has a trimmed display name and a host flag. Role is derived — a participant is the drawer if their ID matches the room's `drawerId`; all others are guessers. No explicit role field is stored on the participant record.
- **Round**: A single drawing turn. Has a designated drawer, a secret word, and a status (active/ended).
- **Room Snapshot**: The view of room state exposed per-participant — the public snapshot omits the secret word; the drawer's snapshot includes it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of submitted player names are stored in trimmed form — no leading or trailing whitespace persists in the participant record.
- **SC-002**: Empty, whitespace-only, or names exceeding 20 characters are rejected 100% of the time with a user-visible message, before any room state is modified.
- **SC-003**: In every game started, exactly one participant holds the drawer role at round start, and it is always the host.
- **SC-004**: The secret word appears in the drawer's view 100% of the time and in zero guesser views across all rounds.
- **SC-005**: All participants can identify the current drawer within one polling cycle (~2 seconds) of the round starting.

## Clarifications

### Session 2026-06-18

- Q: What should happen when a player tries to join a room that's already in-game? → A: Out of scope for this feature; late-join behavior is deferred to a future feature.
- Q: Is there a maximum character limit for player names (after trimming)? → A: 20 characters maximum.
- Q: What should non-drawer participants see in the polling gap after the host starts the game? → A: Continue showing the lobby view; no special transition state — guessers redirect on their next successful poll that confirms game-started status.

## Assumptions

- The host is always the room creator and always the first participant in the participant list; no tie-breaking logic is needed.
- Deterministic word selection means the first word in the starter list is used for round 1; subsequent-round word cycling is a later feature.
- Only the first round's drawer assignment is in scope; drawer rotation across rounds is out of scope.
- The polling interval is approximately 2 seconds, consistent with the lobby polling established in the Room Setup feature.
- The starter word list is fixed at the time of round start and is not configurable by players.
- Player name uniqueness is not enforced; two players may share the same display name without conflict.
