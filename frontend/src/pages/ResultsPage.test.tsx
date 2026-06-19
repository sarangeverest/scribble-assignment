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

const mockStore = vi.hoisted(() => ({
  fetchRoom: vi.fn().mockResolvedValue(undefined),
  restartGame: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate
}));

vi.mock("../state/roomStore.js", () => ({
  useRoomStore: () => mockStore,
  useRoomState: () => roomStateRef
}));

import { ResultsPage } from "./ResultsPage.js";

function makeResultsRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "results",
    participants: [
      { id: "host-id", name: "Alice", joinedAt: "2024-01-01T00:00:00Z", isHost: true, score: 100 },
      { id: "guest-id", name: "Bob", joinedAt: "2024-01-01T00:00:00Z", isHost: false, score: 0 }
    ],
    drawerId: "host-id",
    secretWord: "rocket",
    guesses: [],
    canvasData: "",
    ...overrides
  };
}

describe("ResultsPage", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockStore.fetchRoom.mockClear();
    mockStore.restartGame.mockClear();
    roomStateRef.room = makeResultsRoom();
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

  // ── Guard: no room ───────────────────────────────────────────────────────────

  it("navigates to / when room is null", async () => {
    roomStateRef.room = null;

    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  // ── Stay on results ──────────────────────────────────────────────────────────

  it("does not navigate away when room status is results", async () => {
    roomStateRef.room = makeResultsRoom({ status: "results" });

    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── Status redirect: in-game ─────────────────────────────────────────────────

  it("navigates to /game when room status is in-game", async () => {
    roomStateRef.room = makeResultsRoom({ status: "in-game" });

    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(mockNavigate).toHaveBeenCalledWith("/game", { replace: true });
  });

  // ── Status redirect: lobby ───────────────────────────────────────────────────

  it("navigates to /lobby when room status is lobby", async () => {
    roomStateRef.room = makeResultsRoom({ status: "lobby" });

    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(mockNavigate).toHaveBeenCalledWith("/lobby", { replace: true });
  });

  // ── Secret word display ──────────────────────────────────────────────────────

  it("renders the secret word", async () => {
    roomStateRef.room = makeResultsRoom({ secretWord: "rocket" });

    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(container.textContent).toContain("rocket");
  });

  // ── Scoreboard rendered ──────────────────────────────────────────────────────

  it("renders participant names in the scoreboard", async () => {
    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Bob");
  });

  // ── ResultPanel rendered ─────────────────────────────────────────────────────

  it("renders the guess history panel", async () => {
    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(container.querySelector(".result-panel, .result-panel__empty")).not.toBeNull();
  });

  // ── Polling ──────────────────────────────────────────────────────────────────

  it("starts a polling interval that calls store.fetchRoom", async () => {
    vi.useFakeTimers();

    await act(async () => { root.render(createElement(ResultsPage)); });
    await act(async () => { vi.advanceTimersByTime(2000); });

    expect(mockStore.fetchRoom).toHaveBeenCalled();

    vi.useRealTimers();
  });

  // ── US2: Host restart button ─────────────────────────────────────────────────

  it("shows Back to Lobby button for host", async () => {
    roomStateRef.participantId = "host-id";

    await act(async () => { root.render(createElement(ResultsPage)); });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.toLowerCase().includes("lobby"))).toBe(true);
  });

  it("hides Back to Lobby button for non-host", async () => {
    roomStateRef.participantId = "guest-id";

    await act(async () => { root.render(createElement(ResultsPage)); });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.toLowerCase().includes("lobby"))).toBe(false);
  });

  it("shows waiting message for non-host", async () => {
    roomStateRef.participantId = "guest-id";

    await act(async () => { root.render(createElement(ResultsPage)); });

    expect(container.textContent?.toLowerCase()).toContain("waiting");
  });

  it("calls store.restartGame when host clicks Back to Lobby", async () => {
    roomStateRef.participantId = "host-id";

    await act(async () => { root.render(createElement(ResultsPage)); });

    const buttons = Array.from(container.querySelectorAll("button"));
    const lobbyBtn = buttons.find((b) => b.textContent?.toLowerCase().includes("lobby"));
    expect(lobbyBtn).toBeDefined();

    await act(async () => { lobbyBtn!.click(); });

    expect(mockStore.restartGame).toHaveBeenCalledWith("ABCD", "host-id");
  });
});
