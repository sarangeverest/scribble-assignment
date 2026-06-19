# Data Model: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-19

Builds on the types established in feature 002 (`Round`, `Room`, `RoomSnapshot`, `Participant`).

---

## New Type: `Guess`

**File**: `backend/src/models/game.ts`

```typescript
export interface Guess {
  participantId: string;    // who submitted
  participantName: string;  // denormalised at write time — avoids join on render
  text: string;             // trimmed guess as submitted
  isCorrect: boolean;       // true if text.toLowerCase() === word.toLowerCase()
  timestamp: string;        // ISO 8601, set at server receive time
}
```

**Constraints**:
- `text` is always trimmed (Zod `.trim()` applied before store call)
- `participantName` is copied from `room.participants` at write time; not updated if the name later changes (names are immutable after join)
- `isCorrect` reflects semantic correctness only — it does NOT imply points were awarded (a guesser's second correct guess has `isCorrect: true` but scores 0 per FR-009)

---

## Updated Type: `Round` (extended)

**File**: `backend/src/models/game.ts`

```typescript
export interface Round {
  drawerId: string;
  word: string;
  status: "active";
  guesses: Guess[];     // NEW — all guesses submitted this round, in arrival order
  canvasData: string;   // NEW — base64 PNG data URL; "" when blank/cleared
}
```

**Initialisation** (in `startGame`):
```typescript
room.currentRound = {
  drawerId: caller.id,
  word: STARTER_WORDS[0],
  status: "active",
  guesses: [],        // empty at round start
  canvasData: ""      // blank canvas at round start
};
```

**Invariants**:
- `guesses` is append-only — no mutation of existing entries
- `canvasData` is `""` when the canvas has been cleared or not yet drawn; never `null` or `undefined`

---

## Updated Type: `Participant` (score added)

**File**: `backend/src/models/game.ts`

```typescript
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  score: number;   // NEW — starts at 0; incremented by 100 on first correct guess per round
}
```

`createParticipant` sets `score: 0`. Score is a running total; it is NOT reset between rounds (round-reset is a future feature).

---

## Updated Type: `RoomSnapshot` (guesses + canvasData added)

**Files**: `backend/src/models/game.ts`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

```typescript
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];   // now includes score
  drawerId: string | null;
  secretWord?: string;           // drawer only (unchanged from feature 002)
  guesses: Guess[];              // NEW — public; all participants see full history
  canvasData: string;            // NEW — base64 PNG or ""; same for all participants
}
```

`guesses` and `canvasData` are always present — never conditionally omitted, unlike `secretWord`.

---

## New Zod Schemas

**File**: `backend/src/api/schemas.ts`

```typescript
export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guess: z.string().trim().min(1, "Guess cannot be empty")
});

export const updateDrawingSchema = z.object({
  participantId: z.string().min(1),
  canvasData: z.string()   // base64 data URL or ""; no server-side size cap
});
```

---

## Service Function Signatures

**File**: `backend/src/services/roomStore.ts`

```typescript
// Submit a guess for the active round
export function submitGuess(
  code: string,
  participantId: string,
  guessText: string        // already trimmed by Zod schema
): { snapshot: RoomSnapshot; isCorrect: boolean }
```

**`submitGuess` logic**:
1. Room not found → throw `"404: Room not found"`
2. No active round → throw `"400: No active round"`
3. `participantId === drawerId` → throw `"403: Drawer cannot guess"`
4. `isCorrect = guessText.toLowerCase() === room.currentRound.word.toLowerCase()`
5. `hasAlreadyScored = room.currentRound.guesses.some(g => g.participantId === participantId && g.isCorrect)` — derived from history (no separate field)
6. If `isCorrect && !hasAlreadyScored`: find participant in `room.participants`, increment `score += 100`
7. Push `Guess` record: `{ participantId, participantName, text: guessText, isCorrect, timestamp: now() }`
8. Return `{ snapshot: toRoomSnapshot(room, participantId), isCorrect }`

```typescript
// Update the stored canvas image (drawer only)
export function updateCanvas(
  code: string,
  participantId: string,
  canvasData: string
): void
```

**`updateCanvas` logic**:
1. Room not found → throw `"404: Room not found"`
2. No active round → throw `"400: No active round"`
3. `participantId !== drawerId` → throw `"403: Only the drawer can update the canvas"`
4. `room.currentRound.canvasData = canvasData`; update `room.updatedAt`

---

## `toRoomSnapshot` Updates

**File**: `backend/src/services/roomStore.ts`

```typescript
// Additions to existing toRoomSnapshot:
guesses: room.currentRound?.guesses ?? [],
canvasData: room.currentRound?.canvasData ?? ""
```

Secrecy: `guesses` and `canvasData` are NOT filtered per viewer — both are public. `secretWord` filtering is unchanged from feature 002.

---

## Type Relationship Diagram

```
Room (server-only)
├── code: string
├── status: "lobby" | "in-game"
├── participants: Participant[]
│   └── { id, name, joinedAt, isHost, score }   ← score added
├── currentRound?: Round
│   ├── drawerId, word, status: "active"
│   ├── guesses: Guess[]                         ← added; append-only
│   └── canvasData: string                       ← added; last drawer POST
└── createdAt / updatedAt

          │ toRoomSnapshot(room, viewerParticipantId)
          ▼

RoomSnapshot (API response — viewer-scoped)
├── code: string
├── status: "lobby" | "in-game"
├── participants: Participant[]    ← now includes score
├── drawerId: string | null
├── secretWord?: string            ← drawer only (unchanged)
├── guesses: Guess[]               ← public; all participants
└── canvasData: string             ← public; same for all viewers
```
