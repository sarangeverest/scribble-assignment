# API Contracts: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-14  
**Base URL**: `http://localhost:3001`

---

## POST /api/rooms

Create a new room. The caller becomes the host.

### Request

```
Content-Type: application/json

{
  "playerName": string   // required; non-empty
}
```

### Response — 201 Created

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "KART",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Alice",
        "joinedAt": "2026-06-14T10:00:00.000Z",
        "isHost": true
      }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | `playerName` missing or empty |

---

## POST /api/rooms/:code/join

Join an existing room by its 4-letter code.

### Request

```
Content-Type: application/json

{
  "playerName": string   // required; non-empty
}
```

### Path parameter

| Param | Description |
|-------|-------------|
| `code` | 4-letter room code; case-insensitive (server normalises to uppercase) |

### Response — 200 OK

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "KART",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true },
      { "id": "...", "name": "Bob",   "joinedAt": "...", "isHost": false }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | `playerName` missing or empty |
| 404 | Room with `code` not found |

---

## GET /api/rooms/:code

Poll for the current room snapshot. Called every ~2 s by the lobby.

### Query parameters

| Param | Required | Description |
|-------|----------|-------------|
| `participantId` | No | Caller's participant UUID (used for viewer-specific projections in future) |

### Response — 200 OK

```json
{
  "room": {
    "code": "KART",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true },
      { "id": "...", "name": "Bob",   "joinedAt": "...", "isHost": false }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error responses

| Status | Condition |
|--------|-----------|
| 404 | Room not found |

---

## POST /api/rooms/:code/start

Transition a room from `"lobby"` to `"in-game"`. Host only.

### Request

```
Content-Type: application/json

{
  "participantId": string   // required; must match the host participant's id
}
```

### Response — 200 OK

```json
{
  "room": {
    "code": "KART",
    "status": "in-game",
    "participants": [ ... ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | `participantId` missing, or fewer than 2 participants in room |
| 403 | `participantId` does not match the host |
| 404 | Room not found |

---

## Common error shape

All error responses use:

```json
{ "message": "Human-readable description of the error" }
```
