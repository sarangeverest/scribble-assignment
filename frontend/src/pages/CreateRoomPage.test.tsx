// @vitest-environment jsdom
// Required for React 18 act() to work correctly in test environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockCreateRoom = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate
}));

vi.mock("../state/roomStore.js", () => ({
  useRoomStore: () => ({ createRoom: mockCreateRoom })
}));

import { CreateRoomPage } from "./CreateRoomPage.js";

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  nativeValueSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("CreateRoomPage", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreateRoom.mockClear();

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

  // ── US1: Player Name Validation ─────────────────────────────────────────────

  it("shows error and does not call createRoom when name exceeds 20 characters", async () => {
    await act(async () => { root.render(createElement(CreateRoomPage)); });

    const input = container.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();

    await act(async () => { setInputValue(input!, "A".repeat(21)); });

    const form = container.querySelector("form")!;
    await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

    expect(container.textContent).toContain("Name must be 20 characters or fewer");
    expect(mockCreateRoom).not.toHaveBeenCalled();
  });
});
