# API Contracts: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Date**: 2026-06-19

These are the two new endpoints added by this feature. Both follow the same error-forwarding pattern as existing endpoints in `backend/src/api/rooms.ts`.

---

## Updated: `GET /rooms/:code`

No change to the route signature. The response shape changes only when `room.status === "results"`:

```json
{
  "code": "ABCD",
  "status": "results",
  "participants": [
    { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true, "score": 100 },
    { "id": "...", "name": "Bob",   "joinedAt": "...", "isHost": false, "score": 0 }
  ],
  "drawerId": "...",
  "secretWord": "rocket",
  "guesses": [...],
  "canvasData": "data:image/png;base64,..."
}
```

**Key change**: `secretWord` is now present for ALL `participantId` values (not just the drawer) when `status === "results"`.

---

## New: `POST /rooms/:code/end`

**Purpose**: Host ends the active round. Transitions room to "results" state.

**Request**:
```json
{ "participantId": "string (min 1 char)" }
```

**Validation** (`endRoundSchema`):
- `participantId`: `z.string().min(1)`

**Success Response** `200 OK`:
```json
{
  "room": {
    "code": "ABCD",
    "status": "results",
    "participants": [...],
    "drawerId": "...",
    "secretWord": "rocket",
    "guesses": [...],
    "canvasData": "..."
  }
}
```

**Error Responses**:

| Status | Message | Condition |
|--------|---------|-----------|
| 400 | `"Invalid request payload"` | Zod validation failed |
| 400 | `"No active round"` | `room.status !== "in-game"` or no `currentRound` |
| 403 | `"Forbidden — only the host can end the round"` | Caller is not the host |
| 404 | `"Room not found"` | No room with that code |

**Error format** (all errors):
```json
{ "message": "..." }
```

---

## New: `POST /rooms/:code/restart`

**Purpose**: Host restarts the game. Transitions room back to "lobby" and clears all round data.

**Request**:
```json
{ "participantId": "string (min 1 char)" }
```

**Validation** (`restartGameSchema`):
- `participantId`: `z.string().min(1)`

**Success Response** `200 OK`:
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [...],
    "drawerId": null,
    "guesses": [],
    "canvasData": ""
  }
}
```

Note: `secretWord` is absent from the response (room is back in lobby, no active round).

**Error Responses**:

| Status | Message | Condition |
|--------|---------|-----------|
| 400 | `"Invalid request payload"` | Zod validation failed |
| 400 | `"Room is not in results state"` | `room.status !== "results"` |
| 403 | `"Forbidden — only the host can restart"` | Caller is not the host |
| 404 | `"Room not found"` | No room with that code |

---

## Route Registration

Both endpoints are added to `backend/src/api/rooms.ts` and mounted via the existing `createRoomsRouter()` in `backend/src/api/router.ts`:

```
POST /rooms/:code/end      → endRound handler
POST /rooms/:code/restart  → restartGame handler
```

No changes to `router.ts` are needed (routes are registered inside `createRoomsRouter()`).
