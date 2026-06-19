# API Contract: Rooms (updated for Gameplay Interaction)

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-19

Documents only the endpoints and response shapes that change in this feature. Unchanged endpoints from features 001 and 002 are omitted.

---

## POST /api/rooms/:code/guess — Submit a Guess

### Request body

```json
{ "participantId": "uuid", "guess": "rocket" }
```

| Field | Type | Rules |
|-------|------|-------|
| `participantId` | `string` | Required, non-empty |
| `guess` | `string` | Required; Zod `.trim().min(1)` applied server-side |

### Response `200 OK`

```json
{
  "isCorrect": true,
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "participants": [
      { "id": "uuid-bob", "name": "Bob", "joinedAt": "iso", "isHost": false, "score": 100 }
    ],
    "drawerId": "uuid-alice",
    "guesses": [
      {
        "participantId": "uuid-bob",
        "participantName": "Bob",
        "text": "rocket",
        "isCorrect": true,
        "timestamp": "iso"
      }
    ],
    "canvasData": "data:image/png;base64,..."
  }
}
```

The `room` snapshot is scoped to the guesser's `participantId` — no `secretWord` key.

`isCorrect: true` on both a scoring guess (first correct) and a non-scoring correct guess (subsequent from the same player). The score on `participants[]` reflects whether points were actually awarded.

### Error responses

| Code | Condition |
|------|-----------|
| `400` | Guess is empty after trim |
| `400` | No active round (`currentRound` not set) |
| `403` | `participantId === drawerId` — drawer cannot guess |
| `404` | Room not found |

---

## POST /api/rooms/:code/drawing — Update Canvas

### Request body

```json
{ "participantId": "uuid", "canvasData": "data:image/png;base64,..." }
```

| Field | Type | Rules |
|-------|------|-------|
| `participantId` | `string` | Required, non-empty |
| `canvasData` | `string` | Required; `""` means clear; no size validation |

### Response `200 OK`

```json
{ "ok": true }
```

### Error responses

| Code | Condition |
|------|-----------|
| `400` | No active round |
| `403` | `participantId !== drawerId` — only the drawer can update the canvas |
| `404` | Room not found |

---

## Updated `RoomSnapshot` (all existing endpoints)

All endpoints that return a `room` object now include `guesses`, `canvasData`, and `score` on participants:

```typescript
{
  code: string,
  status: "lobby" | "in-game",
  participants: Array<{
    id: string,
    name: string,
    joinedAt: string,
    isHost: boolean,
    score: number          // NEW — 0 in lobby; running total in-game
  }>,
  drawerId: string | null,
  secretWord?: string,     // drawer only; absent for guessers (unchanged)
  guesses: Guess[],        // NEW — [] in lobby; full history in-game; public
  canvasData: string       // NEW — "" in lobby or blank canvas; base64 PNG in-game
}
```

**`Guess` shape**:
```typescript
{
  participantId: string,
  participantName: string,
  text: string,
  isCorrect: boolean,
  timestamp: string        // ISO 8601
}
```

**`isCorrect` note**: A guess with `isCorrect: true` may or may not have awarded points — check `participant.score` changes across polls to determine scoring. The first correct guess per player per round increments `score`; subsequent correct guesses from the same player do not.
