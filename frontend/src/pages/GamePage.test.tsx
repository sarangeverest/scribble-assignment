// @vitest-environment jsdom
// Required for React 18 act() to work correctly in test environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import type { RoomSnapshot } from "../services/api.js";

const mockNavigate = vi.hoisted(() => vi.fn());

const roomStateRef = vi.hoisted(() => ({
  room: null as RoomSnapshot | null,
  participantId: null as string | null,
  error: null as string | null,
  isLoading: false
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate
}));

vi.mock("../state/roomStore.js", () => ({
  useRoomStore: () => ({}),
  useRoomState: () => roomStateRef
}));

import { GamePage } from "./GamePage.js";

function makeInGameRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "in-game",
    participants: [
      { id: "host-id", name: "Alice", joinedAt: "2024-01-01T00:00:00Z", isHost: true },
      { id: "guest-id", name: "Bob", joinedAt: "2024-01-01T00:00:00Z", isHost: false }
    ],
    drawerId: "host-id",
    ...overrides
  };
}

describe("GamePage", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mockNavigate.mockClear();
    roomStateRef.room = makeInGameRoom();
    roomStateRef.participantId = "host-id";
    roomStateRef.error = null;
    roomStateRef.isLoading = false;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    try {
      await act(async () => root.unmount());
    } catch {
      // already unmounted
    }
    container.remove();
    vi.clearAllMocks();
  });

  // ── US2: Drawer role indicator ───────────────────────────────────────────────

  it("shows 'You are drawing!' when participantId matches drawerId", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.textContent).toContain("You are drawing!");
  });

  it("shows drawer's name when participantId does not match drawerId", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.textContent).toContain("Alice");
  });

  it("does not show 'You are drawing!' when participantId does not match drawerId", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.textContent).not.toContain("You are drawing!");
  });

  // ── US3: Secret word display ─────────────────────────────────────────────────

  it("shows the secret word when room.secretWord is set and viewer is drawer", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id", secretWord: "rocket" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.textContent).toContain("rocket");
  });

  it("does not show the secret word when viewer is a guesser (no secretWord)", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.textContent).not.toContain("rocket");
  });
});
