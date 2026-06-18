# API Contract: Rooms (updated for Game Start & Drawer Flow)

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-19

This document captures only the endpoints and response shapes that change in this feature. Unchanged endpoints (`GET /health`, `GET /api/`) are omitted.

---

## POST /api/rooms — Create Room

### Request body (updated validation)

```json
{ "playerName": "Alice" }
```

| Field | Type | Rules |
|-------|------|-------|
| `playerName` | `string` | Required. Trimmed. Min 1 char. Max 20 chars (after trim). |

**Validation errors** → `400 Bad Request`
```json
{ "message": "Invalid request payload" }
```

Triggers: empty string, whitespace-only, length > 20 after trim.

### Response `200 Created` — unchanged shape, updated semantics

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [{ "id": "uuid", "name": "Alice", "joinedAt": "iso", "isHost": true }],
    "drawerId": null,
    "secretWord": undefined
  }
}
```

`drawerId` is `null` in lobby. `secretWord` is absent in lobby.

---

## POST /api/rooms/:code/join — Join Room

### Request body (updated validation)

```json
{ "playerName": "Bob" }
```

Same rules as create: trimmed, min 1, max 20.

### Response — same shape change as above

`drawerId: null`, no `secretWord` while in lobby.

---

## POST /api/rooms/:code/start — Start Game

### Request body — unchanged

```json
{ "participantId": "uuid" }
```

### Response `200 OK` — updated `room` shape

**Caller is the host (drawer)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "participants": [...],
    "drawerId": "host-uuid",
    "secretWord": "rocket"
  }
}
```

**Note**: The `start` endpoint response is only seen by the host (who is always the drawer). `secretWord` is always present in this response.

**Error responses** (unchanged):
- `403` — caller is not the host
- `400` — fewer than 2 participants
- `404` — room not found

---

## GET /api/rooms/:code?participantId= — Poll Room

This is the primary endpoint affected by word secrecy.

### Request — unchanged

```
GET /api/rooms/ABCD?participantId=<uuid>
```

### Response shape — updated

```typescript
{
  "room": {
    "code": string,
    "status": "lobby" | "in-game",
    "participants": Participant[],
    "drawerId": string | null,   // null if status is "lobby"
    "secretWord"?: string         // present ONLY if participantId matches drawerId
  }
}
```

**Drawer's response** (`participantId === drawerId`):
```json
{
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "participants": [...],
    "drawerId": "host-uuid",
    "secretWord": "rocket"
  }
}
```

**Guesser's response** (`participantId !== drawerId`):
```json
{
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "participants": [...],
    "drawerId": "host-uuid"
  }
}
```

`secretWord` key is absent entirely from the guesser's response — not `null`, not `""`, but absent.

**No `participantId` supplied** (unauthenticated poll):
```json
{
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "participants": [...],
    "drawerId": "host-uuid"
  }
}
```

Same as guesser — no secret word.

---

## Removed fields (migration note)

These fields were present in the previous `RoomSnapshot` shape but are removed:

| Removed field | Replaced by |
|---------------|-------------|
| `availableWords: string[]` | `drawerId: string \| null` |
| `roles: ParticipantRole[]` | `secretWord?: string` |

Neither field was read by any frontend component, so this is a non-breaking change in practice.
