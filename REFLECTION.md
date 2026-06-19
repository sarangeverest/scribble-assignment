# Reflection Report — Scribble Assignment

## What Did the Starter App Already Have?

The scaffold provided a working skeleton with the bare minimum to run the app:

**Backend**
- Express server with three routes: `POST /api/rooms`, `POST /api/rooms/:code/join`, `GET /api/rooms/:code`
- In-memory `Map<code, Room>` store with `createRoom` and `joinRoom` functions
- A minimal `Room` model with only `"lobby"` as the room status, and a `Participant` type with no host flag and no score
- `RoomSnapshot` that exposed `availableWords` and `roles` arrays but had no concept of a round, drawer, or guesses

**Frontend**
- React Router v6 with five routes wired up (`/`, `/create`, `/join`, `/lobby`, `/game`)
- `CreateRoomPage` and `JoinRoomPage` with form markup but no client-side validation
- `LobbyPage` that rendered participants but had no polling loop and no "Start Game" button
- `GamePage` that displayed a static `"Drawing canvas placeholder"` string — completely non-interactive
- `Scoreboard` and `ResultPanel` rendered as empty shell components (no props, no data)
- `GuessForm` with an input field that did nothing on submit
- A `roomStore` using `useSyncExternalStore` for state management and a `fetchRoom` action, but no `startGame`, `submitGuess`, `updateCanvas`, `endRound`, or `restartGame` actions
- All CSS layout and design system tokens already in `app.css`

In short: the scaffold could create and join rooms and navigate between pages, but contained no gameplay logic whatsoever.

---

## What Did I Add?

All four requirements were implemented incrementally using the **Spec Kit** workflow (`speckit-specify` → `speckit-clarify` → `speckit-plan` → `speckit-tasks` → `speckit-implement`), producing a spec, data model, API contract, checklist, and ordered task list for each feature before writing any code.

### Requirement 1 — Room Setup & Lobby

- **Host assignment**: `createParticipant` gained an `isHost` flag; the room creator is automatically the host.
- **Room code format**: Changed to 4 uppercase letters only (removed digits from the alphabet).
- **Participant model**: Added `score: number` field.
- **Input validation**: Empty player name is caught client-side before any fetch; invalid/missing room code shows a descriptive error.
- **Case-insensitive join**: `joinRoom` normalises the code to uppercase.
- **Lobby polling**: `LobbyPage` runs a `setInterval` every 2 seconds via `useEffect`; failures surface an inline error banner that clears on the next successful poll.
- **Host-only Start Game button**: Visible only to the host; disabled when fewer than 2 participants are present.

### Requirement 2 — Game Start & Drawer

- **`startGame()` service**: Validates that the caller is the host, that ≥ 2 players are present, and that words are available. Sets `room.status = "in-game"` and creates the first `Round` (drawer = host, word = first word in list, empty guesses/canvas).
- **Expanded type model**: `RoomStatus` widened to `"lobby" | "in-game" | "results"`; new `Round` interface added with `drawerId`, `word`, `guesses`, `canvasData`.
- **`toRoomSnapshot`**: Hides `secretWord` from guessers; only the drawer (and later the results screen) receives it.
- **Frontend navigation**: `LobbyPage` watches `room.status === "in-game"` and redirects to `/game`; `GamePage` redirects back to `/` if room is absent.

### Requirement 3 — Gameplay Interaction

- **Canvas drawing**: `GamePage` attaches `pointerdown/pointermove/pointerup` listeners on the `<canvas>` element only for the drawer; on `pointerup` it serialises the canvas as a `data:image/png` and calls `store.updateCanvas()`.
- **Canvas sync for guessers**: Non-drawer participants see an `<img>` whose `src` is polled from `room.canvasData` every 2 seconds.
- **`updateCanvas()` backend**: Validates the caller is the active drawer, then writes `canvasData` to the round.
- **Guess submission**: `submitGuess()` checks correctness case-insensitively, awards +100 points to the first correct guess, and records every guess with name, text, `isCorrect`, and timestamp. The drawer is blocked from guessing.
- **`GuessForm`** wired to the real API; shows "Correct!" feedback.
- **`Scoreboard`** and **`ResultPanel`** now render live participant scores and the running guess log.
- **Host "End Round" button**: Calls `endRound()`, which sets `room.status = "results"`.

### Requirement 4 — Results, Restart & Final Validation

- **`endRound()` backend**: Validates active round and host caller, then flips status to `"results"`. `toRoomSnapshot` exposes `secretWord` to all viewers when status is `"results"`.
- **`restartGame()` backend**: Validates host caller and `"results"` status, then resets to `"lobby"` and clears `currentRound`.
- **New `ResultsPage`**: Shows the secret word reveal, final `Scoreboard`, full `ResultPanel` of guesses, and a host "Back to Lobby" button (guests see a waiting message). Polls every 2 seconds and navigates away when status changes.
- **Navigation guards**: `GamePage` redirects to `/results` when status becomes `"results"`; `ResultsPage` redirects to `/lobby` or `/game` on status change.
- **New route**: `/results` added to `routes/index.tsx`.

---

## Testing

All logic is covered by automated tests run with Vitest:

| Layer | Test files | Tests |
|---|---|---|
| Backend (services + schema) | 2 | 83 passed |
| Frontend (pages + components) | 9 | 56 passed |
| **Total** | **11** | **139 passed** |

Key test areas: room creation/joining, host validation, guess scoring, canvas update guards, end-round/restart state transitions, lobby polling error banner, `ResultsPage` redirect logic, and `GuessForm` correct/incorrect feedback.

---

## How Spec Kit Shaped the Process

Using Spec Kit forced a structured order: clarify ambiguities first, agree on a data model and API contract before touching code, then generate a dependency-ordered task list. This meant implementation decisions (e.g. _"drawer gets word; guessers don't"_, _"restartGame requires results status"_) were resolved in the spec rather than discovered mid-implementation. The generated `tasks.md` for each feature broke work into small, independently testable chunks, which made it easy to verify progress incrementally and keep commits atomic.
