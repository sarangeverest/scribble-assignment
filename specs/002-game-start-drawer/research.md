# Research: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-19

No NEEDS CLARIFICATION items were raised during planning — the existing codebase resolves all decisions directly. This file documents the key findings and the rationale behind design choices.

---

## Decision 1: Name Validation Layer

**Decision**: Enforce name constraints at both server (authoritative) and client (UX).

**Rationale**: The Zod schemas in `backend/src/api/schemas.ts` are the single authoritative gate. Zod's `.trim()` + `.min(1)` + `.max(20)` covers all three rules (trim, empty rejection, length cap) in one chain. Client-side forms already do `playerName.trim()` checks — adding a `maxLength={20}` HTML attribute and a JS guard adds zero dependencies and prevents obviously-bad submissions before a network round trip.

**Alternatives considered**: Server-only validation was considered but rejected — the existing pattern (`CreateRoomPage`, `JoinRoomPage`) already does client-side checks for the empty case, so adding max-length there is consistent.

---

## Decision 2: Round State Storage

**Decision**: Add a `currentRound` optional field to the in-memory `Room` object. `Round` holds `drawerId`, `word`, and `status`.

**Rationale**: The existing `Room` type in `backend/src/models/game.ts` is the only server state object. A `currentRound?: Round` field is the minimal change that stores per-round data without introducing a new top-level map or restructuring the store. `currentRound` is `undefined` when status is `"lobby"` and populated when status is `"in-game"`.

**Alternatives considered**: A separate `rounds` array was rejected — this feature only needs the current round, and a history array adds complexity without benefit for the scope defined.

---

## Decision 3: Word Secrecy Enforcement

**Decision**: Server-side filtering in `toRoomSnapshot`. The snapshot returned to a guesser never contains `secretWord`. The snapshot for the drawer includes `secretWord`.

**Rationale**: `toRoomSnapshot(room, viewerParticipantId)` already accepts a `viewerParticipantId` parameter but ignores it (`void viewerParticipantId`). This was clearly a placeholder for this exact feature. All callers already pass `viewerParticipantId` or `participantId`. Enforcing secrecy here means it is impossible for a guesser's API response to contain the word, regardless of client behaviour.

**Alternatives considered**: Client-side filtering was rejected outright — it would mean the word travels over the wire to every participant and relies on the client not rendering it. This violates FR-009 ("MUST NOT appear in any data accessible to guesser participants").

---

## Decision 4: Deterministic Word Selection

**Decision**: `STARTER_WORDS[0]` for round 1 (the string `"rocket"`).

**Rationale**: The spec requires deterministic selection from the starter list. Index 0 is the simplest deterministic rule and matches the spec's intent ("first word in the list for round 1"). The `STARTER_WORDS` constant is a fixed tuple at build time, so the selection is always predictable in tests.

**Alternatives considered**: A hash-based or code-derived selection was considered for variety but rejected — it adds complexity and the spec explicitly defers multi-round word cycling.

---

## Decision 5: RoomSnapshot Shape Update

**Decision**: Replace the unused `availableWords: string[]` and `roles: ParticipantRole[]` fields in `RoomSnapshot` with `drawerId: string | null` and optional `secretWord?: string`.

**Rationale**: `availableWords` and `roles` are not consumed anywhere in the frontend (no component reads `room.availableWords` or `room.roles`). They were placeholder fields. Replacing them with the semantically correct fields for this feature avoids carrying dead weight into the data model. Both frontend and backend `RoomSnapshot` types are updated together.

**Alternatives considered**: Additive-only change (keep old fields, add new ones) was considered but rejected — the old fields would mislead future implementers into thinking they carry meaning.

---

## Decision 6: Participant Role in Snapshot

**Decision**: Roles are not added as a field on `Participant` in the snapshot. Role is derivable from `drawerId`: if `participant.id === drawerId` the participant is the drawer; otherwise they are a guesser.

**Rationale**: Adding a `role` field to `Participant` would require the server to compute and embed it for every participant in every response. Since `drawerId` is already in the snapshot, the frontend can derive role with a single comparison. This keeps the data model lean.

---

## Decision 7: `displayName` Fallback Removal Scope

**Decision**: The existing `displayName` fallback (returns `"Player"` for falsy names) in `roomStore.ts` is out of scope — it will remain as-is.

**Rationale**: After this feature's validation lands, no empty name can ever reach `createParticipant`. The fallback becomes dead code, but removing it is a separate cleanup task beyond this feature's scope.
