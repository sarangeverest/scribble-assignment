# Data Model: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-19

---

## New Type: `Round`

**File**: `backend/src/models/game.ts`

```typescript
export interface Round {
  drawerId: string;       // participantId of the current drawer (always the host for round 1)
  word: string;           // secret word — never sent to non-drawer participants
  status: "active";       // only "active" in scope; "ended" is a future feature
}
```

**Constraints**:
- `drawerId` MUST be the `id` of an existing `Participant` in the same `Room`
- `word` MUST be an element of `STARTER_WORDS`
- For round 1, `word` is always `STARTER_WORDS[0]` ("rocket")

---

## Updated Type: `Room`

**File**: `backend/src/models/game.ts`

```typescript
export interface Room {
  code: string;
  status: RoomStatus;          // "lobby" | "in-game" — unchanged
  participants: Participant[];  // unchanged
  createdAt: string;            // unchanged
  updatedAt: string;            // unchanged
  currentRound?: Round;         // NEW — present only when status is "in-game"
}
```

**State invariants**:
- `currentRound` is `undefined` when `status === "lobby"`
- `currentRound` is defined when `status === "in-game"`

---

## Updated Type: `RoomSnapshot` (backend + frontend)

**Files**: `backend/src/models/game.ts`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

```typescript
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string | null;  // REPLACES roles[] — participantId of drawer; null if not in-game
  secretWord?: string;       // REPLACES availableWords[] — present ONLY in drawer's response
}
```

**Secrecy contract**:
- `secretWord` is included in the snapshot if and only if `viewerParticipantId === currentRound.drawerId`
- Guessers receive `{ ..., drawerId: "<id>", secretWord: undefined }` — no `secretWord` key
- Drawer receives `{ ..., drawerId: "<id>", secretWord: "rocket" }`

**Why `drawerId` instead of per-participant role field**: Role is derivable in O(1) by comparing `participant.id === drawerId`. Embedding role on every `Participant` would require server-side recomputation of a value the client can compute locally.

---

## Updated Zod Schemas

**File**: `backend/src/api/schemas.ts`

```typescript
// Before:
export const createRoomSchema = z.object({
  playerName: z.string().min(1)
});
export const joinRoomSchema = z.object({
  playerName: z.string().min(1)
});

// After:
const playerNameSchema = z.string().trim().min(1, "Name cannot be empty").max(20, "Name must be 20 characters or fewer");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});
export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});
```

**Validation rules** (applied in order by Zod):
1. `.trim()` — strips leading/trailing whitespace before any other checks
2. `.min(1)` — rejects empty string (and whitespace-only after trim)
3. `.max(20)` — rejects names longer than 20 characters after trimming
4. Boundary: exactly 20 characters is accepted; 21 is rejected

---

## `toRoomSnapshot` Signature (updated behaviour)

**File**: `backend/src/services/roomStore.ts`

```typescript
// Signature unchanged — viewerParticipantId was already present but ignored
export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot

// New logic:
// - drawerId = room.currentRound?.drawerId ?? null
// - secretWord = (viewerParticipantId && viewerParticipantId === room.currentRound?.drawerId)
//     ? room.currentRound.word
//     : undefined
```

---

## `startGame` Updated Behaviour

**File**: `backend/src/services/roomStore.ts`

```typescript
// After existing host + player-count guards pass:
room.status = "in-game";
room.currentRound = {
  drawerId: caller.id,        // caller is the host
  word: STARTER_WORDS[0],     // "rocket" — deterministic, index 0
  status: "active"
};
room.updatedAt = now();
```

---

## Frontend Form Validation Additions

**Files**: `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`

Client-side guard added before the API call (mirrors server Zod rule):
```typescript
const trimmed = playerName.trim();
if (!trimmed) {
  setError("Name cannot be empty");
  return;
}
if (trimmed.length > 20) {
  setError("Name must be 20 characters or fewer");
  return;
}
```

HTML `<input>` gets `maxLength={20}` attribute (prevents typing beyond 20 chars).

---

## Type Relationship Diagram

```
Room (server-only)
├── code: string
├── status: "lobby" | "in-game"
├── participants: Participant[]
│   └── { id, name, joinedAt, isHost }
├── currentRound?: Round          ← new, server-only
│   └── { drawerId, word, status }
└── createdAt / updatedAt

          │ toRoomSnapshot(room, viewerParticipantId)
          ▼

RoomSnapshot (API response — viewer-scoped)
├── code: string
├── status: "lobby" | "in-game"
├── participants: Participant[]
├── drawerId: string | null       ← new (was: roles[])
└── secretWord?: string            ← new (was: availableWords[]), drawer only
```
