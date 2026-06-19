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
const mockFetchRoom = vi.hoisted(() => vi.fn());
const mockStartGame = vi.hoisted(() => vi.fn());

// Mutable snapshot — mutate .room / .participantId per test in beforeEach
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
  useRoomStore: () => ({ fetchRoom: mockFetchRoom, startGame: mockStartGame }),
  useRoomState: () => roomStateRef
}));

import { LobbyPage } from "./LobbyPage.js";

function makeRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "lobby",
    participants: [
      { id: "host-id", name: "Alice", joinedAt: "2024-01-01T00:00:00Z", isHost: true, score: 0 }
    ],
    drawerId: null,
    guesses: [],
    canvasData: "",
    ...overrides
  };
}

describe("LobbyPage", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchRoom.mockResolvedValue(makeRoom());
    mockStartGame.mockResolvedValue(undefined);
    mockNavigate.mockClear();
    mockFetchRoom.mockClear();
    mockStartGame.mockClear();
    roomStateRef.room = makeRoom();
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
      // already unmounted in test body
    }
    container.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── US3: Auto-polling ──────────────────────────────────────────────────────

  it("polls fetchRoom every 2000ms after mount", async () => {
    await act(async () => { root.render(createElement(LobbyPage)); });

    expect(mockFetchRoom).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(mockFetchRoom).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(mockFetchRoom).toHaveBeenCalledTimes(2);
  });

  it("stops polling after unmount", async () => {
    await act(async () => { root.render(createElement(LobbyPage)); });
    await act(async () => root.unmount());

    await act(async () => { vi.advanceTimersByTime(6000); });
    expect(mockFetchRoom).not.toHaveBeenCalled();
  });

  it("shows inline error banner when fetchRoom rejects", async () => {
    mockFetchRoom.mockRejectedValue(new Error("Network error"));

    await act(async () => { root.render(createElement(LobbyPage)); });
    await act(async () => { vi.advanceTimersByTime(2000); });

    expect(container.querySelector('[data-testid="poll-error"]')).not.toBeNull();
  });

  it("clears error banner when fetchRoom succeeds after a rejection", async () => {
    mockFetchRoom
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue(makeRoom());

    await act(async () => { root.render(createElement(LobbyPage)); });

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(container.querySelector('[data-testid="poll-error"]')).not.toBeNull();

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(container.querySelector('[data-testid="poll-error"]')).toBeNull();
  });

  // ── US4: Host controls ─────────────────────────────────────────────────────

  it("shows Start Game button only when participant is the host", async () => {
    roomStateRef.participantId = "host-id";
    await act(async () => { root.render(createElement(LobbyPage)); });

    expect(container.querySelector('[data-testid="start-game"]')).not.toBeNull();
  });

  it("hides Start Game button when participant is not the host", async () => {
    roomStateRef.participantId = "guest-id";
    await act(async () => { root.render(createElement(LobbyPage)); });

    expect(container.querySelector('[data-testid="start-game"]')).toBeNull();
  });

  it("disables Start Game button when fewer than 2 participants are present", async () => {
    roomStateRef.participantId = "host-id";
    // room has only 1 participant (host alone)
    await act(async () => { root.render(createElement(LobbyPage)); });

    const btn = container.querySelector<HTMLButtonElement>('[data-testid="start-game"]');
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(true);
  });

  it("navigates to /game when room status is in-game", async () => {
    roomStateRef.room = makeRoom({ status: "in-game" });
    await act(async () => { root.render(createElement(LobbyPage)); });

    expect(mockNavigate).toHaveBeenCalledWith("/game", expect.objectContaining({ replace: true }));
  });
});
