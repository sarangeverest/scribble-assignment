# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Room setup & Lobby: Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player opens the app and creates a new game room. The system generates a unique room code and the creator is automatically designated as the host. The creator is taken to the lobby, where they see the room code and their own name in the participant list.

**Why this priority**: This is the entry point of every game session. Without room creation, no other scenario is possible.

**Independent Test**: Create a room with a valid player name and confirm a unique code is returned, the creator appears in the participant list, and the host flag is set on the creator.

**Acceptance Scenarios**:

1. **Given** a player enters their name on the create-room screen, **When** they submit the form, **Then** a new room with a unique code is created, the player is recorded as the host, and they are redirected to the lobby.
2. **Given** a player submits the create-room form with an empty name, **When** the form is submitted, **Then** a clear validation error is shown and no room is created.

---

### User Story 2 - Player Joins a Room via Code (Priority: P1)

A player who was given a room code enters it in the join screen along with their name. If the code is valid and the room exists, they are added to the room as a non-host participant and taken to the lobby.

**Why this priority**: Co-equal with room creation — a game requires at least two players.

**Independent Test**: With an existing room code, join with a second player name and confirm they appear in the participant list as a non-host.

**Acceptance Scenarios**:

1. **Given** a valid room code and player name, **When** a player submits the join form, **Then** they are added to the room as a participant and redirected to the lobby.
2. **Given** an invalid or non-existent room code, **When** a player submits the join form, **Then** a clear error message is shown (e.g., "Room not found") and they remain on the join screen.
3. **Given** an empty room code field, **When** a player submits the join form, **Then** a validation error is shown before any network request is made.

---

### User Story 3 - Lobby Shows Live Participant List (Priority: P2)

Once in the lobby, all participants (host and guests) see an auto-refreshing list of everyone who has joined. The list updates automatically approximately every 2 seconds without any manual action required.

**Why this priority**: Required for all players to know when the game is ready to start, but can be validated independently of the start-game action.

**Independent Test**: With two browser tabs (one host, one guest), open both in the lobby and confirm the second player appears in the first player's participant list within 4 seconds of joining, without a page reload.

**Acceptance Scenarios**:

1. **Given** two players are in the lobby, **When** a third player joins via code, **Then** all existing players see the new participant appear within approximately 2 seconds.
2. **Given** a player is in the lobby, **When** no new players join for 30 seconds, **Then** the participant list remains accurate and no error is shown.

---

### User Story 4 - Host Starts the Game (Priority: P2)

Once at least 2 players are in the lobby, the host sees a "Start Game" button. Non-host participants do not see this button. Clicking it transitions the room to the game state, which all participants observe within the next polling cycle.

**Why this priority**: Builds directly on the lobby polling and depends on at least 2 participants being present.

**Independent Test**: With 2 players in the lobby, confirm only the host sees the start button; clicking it changes the room status and the guest's lobby view reflects the transition within ~2 seconds.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with 2 or more participants, **When** the host clicks "Start Game", **Then** the room transitions out of the lobby state and all participants are redirected accordingly.
2. **Given** only 1 participant is in the lobby, **When** the host views the lobby, **Then** the "Start Game" button is disabled or absent with an indication that more players are needed.
3. **Given** a non-host participant is in the lobby, **When** they view the lobby, **Then** no "Start Game" button or control is visible to them.

---

### Edge Cases

- What happens when a player tries to join a room that is already in-game (not in lobby status)?
- How does the system handle a player submitting the join form with a code in lowercase vs uppercase?
- **Polling failure**: If a lobby poll request fails, an inline error banner MUST appear immediately. It clears automatically on the next successful poll.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign the "host" role to the first participant who creates a room.
- **FR-002**: The system MUST generate a unique 4-letter uppercase room code (e.g., `KART`) for each newly created room.
- **FR-003**: Players MUST be able to join a room by entering its code and a player name.
- **FR-004**: The system MUST reject join attempts with an invalid, non-existent, or empty room code with a descriptive error message.
- **FR-005**: The system MUST reject create or join attempts where the player name is empty, with a descriptive validation message shown before any request is sent.
- **FR-006**: The lobby participant list MUST refresh automatically at approximately 2-second intervals for all participants.
- **FR-007**: Only the host MUST see the "Start Game" control in the lobby.
- **FR-008**: The "Start Game" control MUST be inactive (disabled or hidden) when fewer than 2 participants are present.
- **FR-009**: Each room MUST be fully isolated: participants in one room MUST NOT see or affect participants in another room.
- **FR-010**: Room codes MUST be treated case-insensitively so that a code entered in lowercase matches the same room as one entered in uppercase.
- **FR-011**: When a lobby poll request fails, the system MUST display an inline error banner to the affected participant immediately. The banner MUST clear automatically on the next successful poll.

### Key Entities

- **Room**: Represents a game session. Has a unique 4-letter uppercase code, a status (lobby / in-game), and a list of participants.
- **Participant**: A player in a room. Has a name, a unique identifier, a join timestamp, and a flag indicating whether they are the host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby in under 5 seconds from form submission.
- **SC-002**: A player can join an existing room and reach the lobby in under 5 seconds from form submission.
- **SC-003**: A new participant appears in all existing lobby views within 4 seconds of joining, without any manual page refresh.
- **SC-004**: 100% of join attempts with an invalid or empty code are rejected with a visible error message; no room state is modified.
- **SC-005**: The "Start Game" button is visible only to the host and only when 2 or more participants are present.
- **SC-006**: Rooms are fully isolated: no participant or state data leaks between two simultaneously active rooms.

## Clarifications

### Session 2026-06-14

- Q: What is shown if a lobby poll request fails temporarily? → A: Show an inline error banner immediately on the first failed poll; clear it automatically on the next successful poll.
- Q: What format should the room code take? → A: 4 uppercase letters (e.g., `KART`); easy to read aloud.
- Q: What happens when a player closes their browser or navigates away while in the lobby? → A: The participant remains in the list until the game starts or the server restarts; there is no disconnect detection or timeout removal.

## Assumptions

- Room codes are case-insensitive; the system normalises them to uppercase internally.
- A player name is required but does not need to be unique within a room.
- There is no maximum room size defined for this scenario; rooms accept any number of participants.
- Rooms in "in-game" status do not appear joinable (joining a started game is out of scope for this scenario).
- The polling interval target is ~2 seconds; minor variance (e.g., up to ±500ms) is acceptable.
- Room data is not persisted across service restarts; all rooms are temporary for the duration of a session.
- No player authentication exists; the participant's identity is tied to the session they received when creating or joining.
- There is no disconnect detection or timeout-based removal. A participant who closes their browser remains in the lobby list until the game starts or the server restarts. No "Leave Room" action is required for this scenario.
