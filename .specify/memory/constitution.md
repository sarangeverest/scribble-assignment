<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Type of bump: MAJOR — first concrete adoption from blank template

Modified principles: N/A (all new)
Added sections:
  - Core Principles (I–V)
  - Architecture Constraints
  - Development Workflow
  - Governance

Removed sections: N/A

Templates reviewed:
  - .specify/templates/plan-template.md    ✅ Constitution Check section present; no updates needed
  - .specify/templates/spec-template.md    ✅ Uses MUST language; aligns with principles
  - .specify/templates/tasks-template.md   ✅ TDD note already enforces test-first ordering; no updates needed

Deferred TODOs: none — all fields resolved from user input and repo context
-->

# Scribble Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written and confirmed failing before any implementation begins.
The Red-Green-Refactor cycle is strictly enforced on every task.
Minimum code coverage across both `backend` and `frontend` packages MUST be ≥ 80%.
Coverage is measured per package using Vitest's built-in reporter.

**Rationale**: Prevents regressions and ensures acceptance criteria are encoded as executable
contracts before code is written. Coverage floor prevents coverage theatre on trivial paths.

### II. TypeScript Strict Mode

All code in `backend/` and `frontend/` MUST compile under TypeScript strict mode with zero errors.
`any` is forbidden; use `unknown` for genuinely dynamic types and narrow with guards.
Type definitions belong in `src/models/` (backend) or co-located with the module (frontend).

**Rationale**: Strict typing catches entire classes of bugs at compile time and serves as
lightweight documentation of contracts between layers.

### III. Architecture Integrity

The system MUST conform to this two-package layout — no additional apps, servers, or runtimes:

- **Frontend**: Vite + React 18 + TypeScript (port 5173)
- **Backend**: Node.js + Express + TypeScript REST API (port 3001)

Hard constraints that MUST NOT be violated regardless of feature scope:
- All client–server sync MUST use HTTP polling (`GET /api/rooms/:code`). WebSockets, SSE, and
  Socket.io are forbidden.
- All state MUST be stored in-memory (`Map` in `backend/src/services/roomStore.ts`). Databases,
  file storage, and external caches are forbidden.
- No authentication, sessions, JWT, or OAuth.

- Never remove existing tests without justification.
- Preserve backward compatibility unless explicitly requested.
- Generate complete implementations, not TODO placeholders.
- Explain architectural trade-offs before introducing new dependencies.
- Ask for clarification when requirements are ambiguous.

**Rationale**: Constraints are load-bearing, Violating them produces a different system than specified.

### IV. Lean Dependency Management

New npm packages MUST NOT be introduced without explicit justification documented in the PR
description. Existing project patterns MUST be preferred over new libraries.
- Frontend state: follow the `useSyncExternalStore` pattern in `frontend/src/state/roomStore.ts`.
- Backend validation: extend Zod schemas in `backend/src/api/schemas.ts`.
- API calls: route through `frontend/src/services/api.ts`; no inline `fetch` in components.

**Rationale**: Every new dependency is a long-term maintenance cost. The scaffold already
covers routing, state, validation, and HTTP — additional frameworks add complexity without value.

### V. Production-Ready, Self-Documenting Code

Code MUST be readable without inline comments explaining *what* it does; names and types carry
that weight. Comments are permitted only for non-obvious *why* (hidden constraint, workaround).
React components MUST avoid unnecessary re-renders: prefer stable references, memoize only when
profiling shows measurable impact, and keep component trees shallow.
All new code MUST work correctly in both the happy path and the documented edge cases from the spec.

**Rationale**: Production-ready means the code could go into a real product without shame.
Self-documenting code reduces the overhead of onboarding and code review.

## Architecture Constraints

| Layer | Technology | Entry point |
|-------|-----------|-------------|
| Frontend | Vite + React + TypeScript | `frontend/src/main.tsx` |
| Backend | Node.js + Express + TypeScript | `backend/src/server.ts` |
| State (server) | In-memory `Map<code, Room>` | `backend/src/services/roomStore.ts` |
| State (client) | `useSyncExternalStore` store | `frontend/src/state/roomStore.ts` |
| Validation | Zod | `backend/src/api/schemas.ts` |
| Testing | Vitest (both packages) | `*.test.ts` / `*.test.tsx` |

Backend route structure: business logic in `src/services/`, HTTP handling in `src/api/`,
types in `src/models/`. Frontend: API calls in `src/services/api.ts`, CSS in `src/styles/app.css`.

## Development Workflow

- PRs MUST be small and focused: one logical change per PR, reviewable in a single sitting.
- Commits MUST be granular and traceable to a specific task from `tasks.md`.
- Task execution order: write failing tests → implement → verify tests pass → commit.
- Both `npm run build` (backend and frontend) MUST succeed before a PR is opened.
- The Constitution Check in `plan.md` MUST be completed before Phase 0 research begins and
  re-checked after Phase 1 design.

## Governance

This constitution supersedes all other practice documents for this project.
Amendments require: a written rationale, a version bump per the semantic versioning policy below,
and a re-run of the consistency propagation checklist across all templates.

**Versioning policy**:
- MAJOR: Principle removed, fundamentally redefined, or hard constraint overturned.
- MINOR: New principle or section added; materially expanded guidance.
- PATCH: Clarifications, wording, or non-semantic refinements.

All PRs and reviews MUST verify compliance with this constitution before merge.
Complexity violations (e.g., adding a framework, bypassing a hard constraint) MUST be justified
in a Complexity Tracking table in `plan.md` before work begins.

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
