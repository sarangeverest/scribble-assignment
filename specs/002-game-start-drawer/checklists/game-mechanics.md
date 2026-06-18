# Game Mechanics Checklist: Game Start & Drawer Flow

**Purpose**: Lightweight pre-plan sanity check — catch requirement gaps and ambiguities before moving to `/speckit-plan`. Weighted toward role assignment and word secrecy requirements (highest-risk correctness area).
**Created**: 2026-06-19
**Audience**: Author self-review
**Feature**: [spec.md](../spec.md)

## Input Validation Requirements

- [ ] CHK001 - Are all name rejection triggers (empty after trim, whitespace-only, >20 chars after trim) explicitly enumerated as separate rules in the requirements? [Completeness, Spec §FR-001/FR-002/FR-002a]
- [ ] CHK002 - Is the error message text or pattern specified for each distinct validation failure (empty vs. whitespace-only vs. too long), or is a single generic message acceptable? [Clarity, Spec §FR-002/FR-002a]
- [ ] CHK003 - Are the boundary values for the 20-character limit unambiguous — is a name of exactly 20 characters allowed or rejected? [Clarity, Spec §FR-002a]
- [ ] CHK004 - Is Unicode whitespace handling (e.g., non-breaking space, tab) defined beyond ASCII space in the trimming rule? [Edge Case, Spec §Edge Cases]

## Role Assignment Requirements

- [ ] CHK005 - Is the "host = room creator = first participant" identity chain stated as an explicit requirement, not only as an assumption? [Clarity, Spec §FR-003/Assumptions]
- [ ] CHK006 - Is the exact moment of role assignment defined — does it occur when the host triggers game start, or when the first poll returns the new state? [Clarity, Gap, Spec §FR-003]
- [ ] CHK007 - Are requirements defined for the scenario where the host leaves or is no longer present when the game would start? [Edge Case, Gap]

## Word Secrecy & Access Control Requirements

- [ ] CHK008 - Is it specified at which layer word secrecy is enforced — server response, client rendering, or both? FR-010 implies server-side, but is this stated as a requirement? [Clarity, Spec §FR-009/FR-010]
- [ ] CHK009 - Does FR-010 explicitly require the server to return different response payloads per participant role (drawer vs. guesser), rather than relying on client-side filtering? [Completeness, Spec §FR-010]
- [ ] CHK010 - Are requirements defined for what fields appear in the guesser's polling response vs. the drawer's polling response? [Gap, Spec §FR-009/FR-010]
- [ ] CHK011 - Is "absent from their view entirely" (User Story 3, scenario 2) scoped — does it cover only visible UI, or also the underlying data returned to the guesser's client? [Clarity, Spec §US-3]
- [ ] CHK012 - Is the secret word's storage isolation defined in the data model — is it a field on the Round that is explicitly excluded from the public Room Snapshot? [Completeness, Spec §Key Entities]
- [ ] CHK013 - Is "deterministically selected" (FR-007) defined precisely enough to be reproduced in a test — e.g., does it name a specific index or selection rule rather than leaving it implicit? [Clarity, Spec §FR-007]

## UX & Display Requirements

- [ ] CHK014 - Is "clearly indicated" (FR-005) defined with a specific UI pattern, label, or location, or is it left to implementation discretion? [Clarity, Spec §FR-005]
- [ ] CHK015 - Is "visually distinct" (FR-006, drawer view vs. guesser view) measurable — are the required differentiating elements named? [Clarity, Spec §FR-006]
- [ ] CHK016 - Are display requirements defined for the guesser's view during the polling gap after game start (Clarifications §Session 2026-06-18 confirms lobby persists — is this captured in a functional requirement)? [Completeness, Spec §Clarifications]

## State Model Requirements

- [ ] CHK017 - Is the canonical room status value that represents "game in progress" named anywhere in the spec or key entities, or is it deferred entirely to planning? [Gap, Spec §Key Entities]
- [ ] CHK018 - Are round lifecycle states beyond "active" and "ended" explicitly excluded from this feature's scope, or are they unintentionally missing? [Completeness, Spec §Key Entities]

## Acceptance Criteria Quality

- [ ] CHK019 - Can SC-004 ("secret word appears in zero guesser views") be objectively verified by the author without implementation access — is there a requirement-level definition of what "guesser view" encompasses? [Measurability, Spec §SC-004]
- [ ] CHK020 - Are SC-001 through SC-005 traceable back to specific functional requirements (FR-xxx), or do any success criteria stand without a backing requirement? [Traceability, Spec §Success Criteria]
- [ ] CHK021 - Is SC-003 ("exactly one participant holds the drawer role") testable at the requirements level — is there a requirement that prevents multiple drawer assignments, not just a positive assignment rule? [Measurability, Spec §SC-003/FR-003]

## Notes

- Items marked `[Gap]` indicate requirements not currently present in the spec — author should decide whether to add them or explicitly defer to planning.
- Items marked `[Clarity]` indicate requirements that exist but may be too vague to drive unambiguous implementation decisions.
- Check items off as resolved: change `[ ]` to `[x]`.
- Unresolved gaps can be carried into `/speckit-plan` as open decisions.
