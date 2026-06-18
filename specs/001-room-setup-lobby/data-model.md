# Data Model: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-14

## Entities

### Participant

Represents one player inside a room.

```
Participant {
  id:        string   // UUID — assigned by server on create/join
  name:      string   // Display name; non-empty, not unique within room
  joinedAt:  string   // ISO 8601 timestamp
  isHost:    boolean  // true only for the room creator; false for all joiners
}
```

**Validation rules**:
- `name` MUST NOT be empty (enforced client-side before request; backend rejects with 400 if empty)
- `isHost` is immutable after assignment; only one participant per room can have `isHost: true`

**State transitions**: Participants are write-once — they join and remain until the game starts
or the server restarts. There is no leave/disconnect detection.

---

### Room

Represents an active game session.

```
Room {
  code:         string        // 4 uppercase letters, unique across all active rooms
  status:       RoomStatus    // "lobby" | "in-game"
  participants: Participant[] // ordered by joinedAt; index 0 is always the host
  createdAt:    string        // ISO 8601 timestamp
  updatedAt:    string        // ISO 8601 timestamp; updated on any mutation
}
```

**Validation rules**:
- `code` generated server-side; MUST match `/^[A-Z]{4}$/`; MUST be unique within active rooms
- `status` starts as `"lobby"`; transitions to `"in-game"` via the start-game endpoint
- `participants` length MUST be ≥ 2 before `status` may be set to `"in-game"`

**State machine**:

```
lobby ──[host clicks Start, ≥2 participants]──► in-game
```

---

### RoomSnapshot (API response shape)

Read-only view of a room returned to clients. Differs from `Room` in that it
omits internal timestamps and adds vocabulary data.

```
RoomSnapshot {
  code:             string        // same as Room.code
  status:           RoomStatus    // same as Room.status
  participants:     Participant[] // full list including isHost flag
  availableWords:   string[]      // word list for drawer (future use)
  roles:            string[]      // role list (future use)
}
```

---

### RoomSessionResponse

Returned by create-room and join-room endpoints. Gives the caller their own
participant identity alongside the room snapshot.

```
RoomSessionResponse {
  participantId: string       // caller's Participant.id
  room:          RoomSnapshot
}
```

---

## Key Invariants

1. Exactly one participant in a room has `isHost: true` at all times.
2. The room code is immutable after creation.
3. `status` transitions are monotonic: `"lobby"` → `"in-game"` only.
4. Joining a room with `status: "in-game"` is **out of scope** for this feature. The `joinRoom`
   service does not guard against room status; this is a known limitation deferred to a future
   feature. The frontend does not expose a join-game path that would trigger this scenario.

---

## TypeScript Diffs (backend `src/models/game.ts`)

```diff
- export type RoomStatus = "lobby";
+ export type RoomStatus = "lobby" | "in-game";

  export interface Participant {
    id: string;
    name: string;
    joinedAt: string;
+   isHost: boolean;
  }
```

## TypeScript Diffs (frontend `src/services/api.ts`)

```diff
  export interface Participant {
    id: string;
    name: string;
    joinedAt: string;
+   isHost: boolean;
  }
```
