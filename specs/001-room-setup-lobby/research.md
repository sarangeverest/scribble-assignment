# Research: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-14

## Decision Log

### 1. Host Identification

**Decision**: Add `isHost: boolean` to the `Participant` type (backend model and frontend interface).

**Rationale**: The spec defines Participant as having "a flag indicating whether they are the host."
Embedding the flag on the participant is the simplest approach — the snapshot returned by every
`GET /api/rooms/:code` poll already carries the full participant list, so the client can derive
host status without an extra field on `RoomSnapshot`.

**Alternatives considered**:
- `hostId` field on `Room` / `RoomSnapshot` — requires the client to do a cross-reference lookup;
  rejected as more complex with no benefit.
- Returning a separate `isHost` boolean at the top level of `RoomSessionResponse` — redundant once
  `Participant.isHost` exists.

---

### 2. Room Code Format

**Decision**: Change `generateCode()` alphabet from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` to
`ABCDEFGHJKLMNPQRSTUVWXYZ` (letters only, already excluding ambiguous I/O).

**Rationale**: Clarification session confirmed 4 uppercase letters (e.g., `KART`). Digits make
codes harder to read aloud. The existing 4-character length is correct. Existing test regex
`/^[A-Z0-9]{4}$/` must be updated to `/^[A-Z]{4}$/`.

**Alternatives considered**:
- Keep mixed alphanumeric — rejected per spec clarification.
- 6-character code — rejected per spec clarification (4 chars chosen).

---

### 3. Polling Implementation

**Decision**: `setInterval` inside a `useEffect` in `LobbyPage`, calling `roomStore.fetchRoom()`
every 2000 ms. Cleanup via `clearInterval` on unmount or when room becomes null.

**Rationale**: Matches the project's hard constraint (HTTP polling only, no WebSockets) and the
existing `useSyncExternalStore` pattern in `roomStore.ts`. The store already has a `fetchRoom`
method that updates shared state; all subscribed components re-render automatically.

**Poll failure handling**: `fetchRoom` throws on HTTP error. The component catches the error and
sets `pollError` state. On the next successful poll, `pollError` is cleared (FR-011). A separate
`pollError` local state variable is used (not the store's `error` field) so that the banner
does not interfere with create/join error display.

**Alternatives considered**:
- `setInterval` inside the store — rejected; the store should not own side-effect timers.
- `useSyncExternalStore` + external scheduler — over-engineered for this scope.

---

### 4. Start Game Flow

**Decision**: New endpoint `POST /api/rooms/:code/start` with body `{ participantId: string }`.
The handler verifies the caller is the host (`room.participants.find(p => p.id === participantId && p.isHost)`),
then transitions `room.status` from `"lobby"` to `"in-game"`.

**Rationale**: Keeps all state mutations server-side. The frontend "Start Game" button POSTs to
this endpoint; success causes the room snapshot returned on the next poll cycle to have
`status: "in-game"`, which `LobbyPage` detects and redirects all participants to `/game`.

**Alternatives considered**:
- Client-side status mutation — rejected; would cause inconsistency between participants.
- Combined `PATCH /api/rooms/:code` — less intention-revealing; rejected.

---

### 5. Client-Side Validation

**Decision**: Add trim + non-empty checks in `CreateRoomPage` and `JoinRoomPage` before any API
call is made (FR-005). Backend schemas also changed from `z.string().optional()` to
`z.string().min(1)` as a defence-in-depth layer.

**Rationale**: FR-005 says "validation message shown *before* any request is sent." Client-side
is the right place. Backend validation is a secondary safety net.

---

### 6. Existing Scaffolding Reuse

The following scaffold items already work and need **no structural change**, only targeted edits:

| Item | Current state | Change needed |
|------|---------------|---------------|
| `POST /api/rooms` route | Working | Harden `playerName` validation |
| `POST /api/rooms/:code/join` route | Working | Harden `playerName` validation |
| `GET /api/rooms/:code` route | Working | None (snapshot adds `isHost` automatically) |
| `JoinRoomPage` code uppercasing | Working | Add empty-check validation |
| `RoomStore.fetchRoom()` | Working | None |
| `RoomStore.createRoom/joinRoom` | Working | None |
