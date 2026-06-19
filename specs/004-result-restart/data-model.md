# Data Model: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Date**: 2026-06-19

## Changes to Existing Types

### `RoomStatus` (`backend/src/models/game.ts`)

```typescript
// Before
export type RoomStatus = "lobby" | "in-game";

// After
export type RoomStatus = "lobby" | "in-game" | "results";
```

**State transitions**:

```
"lobby"   ──[startGame by host, ≥2 participants]──▶  "in-game"
"in-game" ──[endRound by host]───────────────────▶  "results"
"results" ──[restartGame by host]────────────────▶  "lobby"
```

---

### `toRoomSnapshot` behaviour change (`backend/src/services/roomStore.ts`)

`secretWord` exposure rule updated:

| Room status | `viewerParticipantId` | `secretWord` in snapshot |
|------------|----------------------|--------------------------|
| `"lobby"`   | any                  | `undefined`              |
| `"in-game"` | equals `drawerId`    | `room.currentRound.word` |
| `"in-game"` | any other            | `undefined`              |
| `"results"` | any                  | `room.currentRound.word` |

No new fields added to any interface. All existing interfaces (`Participant`, `Guess`, `Round`, `Room`, `RoomSnapshot`) are unchanged.

**Post-restart lobby state** — when `restartGame` sets `room.currentRound = undefined`, `toRoomSnapshot` MUST return the following defaults via optional chaining / null-coalescing:

| Field in snapshot | Value when `currentRound` is `undefined` |
|-------------------|------------------------------------------|
| `secretWord`      | `undefined` (absent from snapshot)       |
| `guesses`         | `[]`                                     |
| `canvasData`      | `""`                                     |
| `drawerId`        | `null`                                   |

---

## No New Entities

This feature adds no new data structures. The changes are:
1. One new value in the `RoomStatus` union.
2. One conditional branch in `toRoomSnapshot`.
3. Two new service functions (`endRound`, `restartGame`) that mutate the existing `Room` in-memory.

---

## Service Function Signatures

```typescript
// backend/src/services/roomStore.ts (new exports)

export function endRound(code: string, participantId: string): RoomSnapshot
// Throws: "404: Room not found" | "400: No active round" | "403: Forbidden — only the host can end the round"

export function restartGame(code: string, participantId: string): RoomSnapshot
// Throws: "404: Room not found" | "400: Room is not in results state" | "403: Forbidden — only the host can restart"
```

---

## Frontend Type Changes

### `frontend/src/services/api.ts`

```typescript
// RoomStatus updated
export type RoomStatus = "lobby" | "in-game" | "results";

// New API methods
endRound(code: string, participantId: string): Promise<{ room: RoomSnapshot }>
restartGame(code: string, participantId: string): Promise<{ room: RoomSnapshot }>
```

### `frontend/src/state/roomStore.ts`

```typescript
// New store methods
endRound(code: string, participantId: string): Promise<void>
restartGame(code: string, participantId: string): Promise<void>
```
