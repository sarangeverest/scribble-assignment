# Quickstart: Room Setup & Lobby

Manual validation guide for the Room Setup & Lobby feature.

## Prerequisites

```bash
cd backend && npm run dev   # terminal 1 — http://localhost:3001
cd frontend && npm run dev  # terminal 2 — http://localhost:5173
```

---

## Scenario 1 — Host creates a room (SC-001, FR-001, FR-002, FR-005)

1. Open `http://localhost:5173/create-room`
2. Submit with an **empty** player name → expect: validation error shown, no navigation
3. Enter name `Alice`, submit
4. Expect: redirected to `/lobby` within 5 seconds
5. Verify: lobby shows room code (4 uppercase letters), `Alice` in participant list with host indicator

---

## Scenario 2 — Guest joins via code (SC-002, FR-003, FR-004, FR-005, FR-010)

1. Note the room code from Scenario 1 (e.g., `KART`)
2. Open a **second** browser tab → `http://localhost:5173/join-room`
3. Submit with an **empty** room code → expect: validation error, no request sent
4. Submit with an invalid code `ZZZZ` → expect: "Room not found" error displayed
5. Enter name `Bob`, code `kart` (lowercase) → submit
6. Expect: redirected to `/lobby`, `Bob` in participant list as non-host

---

## Scenario 3 — Live lobby polling (SC-003, FR-006)

1. Alice's tab (from Scenario 1) is open in the lobby — do not touch it
2. In the Bob tab (Scenario 2), note the current time
3. Open a **third** tab → `http://localhost:5173/join-room`, join as `Carol`
4. Return to Alice's tab — within ~4 seconds `Carol` should appear in the list **without** any manual action
5. Verify Bob's tab also updates within ~4 seconds

---

## Scenario 4 — Host-only start button (SC-005, FR-007, FR-008)

1. Alice's lobby (2 participants: Alice + Bob): verify **"Start Game"** button is visible and enabled for Alice
2. Bob's lobby: verify **no "Start Game"** button is visible
3. Remove all but Alice from the lobby (restart and only create, don't join) → verify button is **disabled** with a "Need 2+ players" indication

---

## Scenario 5 — Host starts the game (FR-007, FR-008, US4 AC1)

1. With Alice (host) and Bob in the lobby
2. Alice clicks **Start Game**
3. Expect: within the next poll cycle (~2 s), both tabs transition away from the lobby

---

## Scenario 6 — Poll failure banner (FR-011)

1. Start the backend, create a room, enter the lobby
2. Stop the backend server (`Ctrl+C`)
3. Within ~2 s: expect an **inline error banner** appears in the lobby
4. Restart the backend
5. Within ~2 s: expect the **banner disappears** and the list refreshes normally

---

## Scenario 7 — Room isolation (SC-006, FR-009)

1. Create Room A as `Alice` in Tab 1
2. Create Room B as `Charlie` in Tab 2 (different code)
3. In Tab 3, join Room A as `Dave`
4. Verify: Tab 2's lobby shows only `Charlie`; Tab 1's lobby shows only `Alice` and `Dave`
