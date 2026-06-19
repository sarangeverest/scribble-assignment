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

const mockStore = vi.hoisted(() => ({
  fetchRoom: vi.fn().mockResolvedValue(undefined),
  endRound: vi.fn().mockResolvedValue(undefined),
  updateCanvas: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("../state/roomStore.js", () => ({
  useRoomStore: () => mockStore,
  useRoomState: () => roomStateRef
}));

import { GamePage } from "./GamePage.js";

function makeInGameRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "in-game",
    participants: [
      { id: "host-id", name: "Alice", joinedAt: "2024-01-01T00:00:00Z", isHost: true, score: 0 },
      { id: "guest-id", name: "Bob", joinedAt: "2024-01-01T00:00:00Z", isHost: false, score: 0 }
    ],
    drawerId: "host-id",
    guesses: [],
    canvasData: "",
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

  // ── US1: Drawer canvas ───────────────────────────────────────────────────────

  it("renders a canvas element (not placeholder div) for the drawer", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.querySelector("canvas")).not.toBeNull();
    expect(container.querySelector(".canvas-placeholder")).toBeNull();
  });

  it("shows a Clear button in the drawer view", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.toLowerCase().includes("clear"))).toBe(true);
  });

  it("does not render a canvas element for the guesser", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.querySelector("canvas")).toBeNull();
  });

  // ── US2: Guesser canvas display ──────────────────────────────────────────────

  it("guesser view renders an img element with src from room.canvasData", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id", canvasData: "data:image/png;base64,abc" });

    await act(async () => { root.render(createElement(GamePage)); });

    const img = container.querySelector("img.canvas-display") as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img!.src).toContain("data:image/png;base64,abc");
  });

  it("guesser view renders img with no src when canvasData is empty", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id", canvasData: "" });

    await act(async () => { root.render(createElement(GamePage)); });

    const img = container.querySelector("img.canvas-display") as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBeNull();
  });

  // ── US3: GuessForm not shown for drawer ──────────────────────────────────────

  it("does not render GuessForm for the drawer", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(container.querySelector(".guess-form")).toBeNull();
  });

  // ── US1: End Round button + /results redirect ─────────────────────────────────

  it("shows End Round button for host", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.toLowerCase().includes("end round"))).toBe(true);
  });

  it("does not show End Round button for non-host", async () => {
    roomStateRef.participantId = "guest-id";
    roomStateRef.room = makeInGameRoom({ drawerId: "host-id" });

    await act(async () => { root.render(createElement(GamePage)); });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.toLowerCase().includes("end round"))).toBe(false);
  });

  it("navigates to /results when room status changes to results", async () => {
    roomStateRef.participantId = "host-id";
    roomStateRef.room = makeInGameRoom({ status: "results" });

    await act(async () => { root.render(createElement(GamePage)); });

    expect(mockNavigate).toHaveBeenCalledWith("/results", { replace: true });
  });
});
