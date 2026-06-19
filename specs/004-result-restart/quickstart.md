# Quickstart: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Date**: 2026-06-19

Manual integration scenarios covering the full end-round and restart flow. Each scenario can be run with two browser tabs (one host, one guesser).

---

## Scenario A — End Round and View Results

**Setup**:
1. Create a room (tab 1 = host). Join with a second participant (tab 2 = guesser).
2. Host starts the game. Both tabs should be on the `/game` screen.
3. Guesser submits at least one guess (correct or incorrect).

**Steps**:
1. On the host tab, click **End Round**.
2. Within ≈2 seconds (one polling cycle), both tabs should automatically navigate to `/results`.

**Expected results on the results screen**:
- Secret word is visible to both participants (not just the drawer).
- Scoreboard shows final scores sorted highest-to-lowest.
- Guess history shows all submitted guesses, most-recent-first.
- Host sees a **Back to Lobby** button.
- Guesser sees "Waiting for host to restart…" (no button).

---

## Scenario B — Host Restarts

**Setup**: Continue from Scenario A (both tabs on `/results`).

**Steps**:
1. On the host tab, click **Back to Lobby**.
2. Within ≈2 seconds, both tabs should automatically navigate to `/lobby`.

**Expected results in the lobby**:
- Both participants are still listed in the player list.
- Scores from the previous round are visible (if lobby shows scores; otherwise verify via starting a new game).
- Host can start a new game again.

---

## Scenario C — New Game After Restart Has No Stale Data

**Setup**: Continue from Scenario B (both tabs on `/lobby`).

**Steps**:
1. Host clicks **Start Game**. Both tabs navigate to `/game`.
2. Check: no prior guesses appear in the guess history panel.
3. Check: canvas area is empty (no drawing from the previous round).

**Expected results**:
- Guess history: empty.
- Canvas: blank.
- Scores: accumulated from previous round (not reset).

---

## Scenario D — Non-Host Cannot End or Restart

**Setup**: Two browser tabs. Tab 1 = host (in-game). Tab 2 = guesser (in-game).

**Steps** (manual API test — use browser console or curl):
1. From the guesser's participantId, call `POST /rooms/:code/end`.
2. Confirm response is `403 Forbidden`.
3. Manually transition to results (host ends round). 
4. From the guesser's participantId, call `POST /rooms/:code/restart`.
5. Confirm response is `403 Forbidden`.

**Expected results**: All non-host requests are rejected with 403. Room state is unchanged in both cases.

---

## Scenario E — Direct Navigation to `/results` in Wrong State

**Setup**: Room is in "lobby" or "in-game" status.

**Steps**:
1. Manually type `/results` in the browser URL bar.
2. Observe automatic redirect.

**Expected results**:
- If room status is `"lobby"` → redirected to `/lobby`.
- If room status is `"in-game"` → redirected to `/game`.
- If no room is loaded → redirected to `/` (home).
