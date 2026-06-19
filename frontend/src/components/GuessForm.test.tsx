// @vitest-environment jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

const mockSubmitGuess = vi.hoisted(() => vi.fn());

vi.mock("../state/roomStore.js", () => ({
  useRoomStore: () => ({ submitGuess: mockSubmitGuess }),
  useRoomState: () => ({ room: null, participantId: null, error: null, isLoading: false })
}));

import { GuessForm } from "./GuessForm.js";

describe("GuessForm", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mockSubmitGuess.mockReset();
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

  function render(props = { roomCode: "ABCD", participantId: "guest-id" }) {
    return act(async () => { root.render(createElement(GuessForm, props)); });
  }

  function getInput() {
    return container.querySelector("input") as HTMLInputElement;
  }

  function getSubmitButton() {
    return container.querySelector("button[type='submit']") as HTMLButtonElement;
  }

  async function typeInInput(value: string) {
    const input = getInput();
    await act(async () => {
      Object.defineProperty(input, "value", { writable: true, value });
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Use React synthetic event via change event
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )!.set!;
      nativeInputValueSetter.call(input, value);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  async function submitForm() {
    const form = container.querySelector("form") as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }

  it("shows 'Guess cannot be empty' error when empty input is submitted", async () => {
    await render();
    await submitForm();
    expect(container.textContent).toContain("Guess cannot be empty");
  });

  it("does not call store.submitGuess when input is empty", async () => {
    await render();
    await submitForm();
    expect(mockSubmitGuess).not.toHaveBeenCalled();
  });

  it("calls store.submitGuess with roomCode, participantId, and trimmed guess", async () => {
    mockSubmitGuess.mockResolvedValue(false);
    await render();
    await typeInInput("  rocket  ");
    await submitForm();
    expect(mockSubmitGuess).toHaveBeenCalledWith("ABCD", "guest-id", "rocket");
  });

  it("shows 'Correct!' feedback after a correct guess", async () => {
    mockSubmitGuess.mockResolvedValue(true);
    await render();
    await typeInInput("rocket");
    await submitForm();
    expect(container.textContent).toContain("Correct!");
  });

  it("clears the input after a correct guess", async () => {
    mockSubmitGuess.mockResolvedValue(true);
    await render();
    await typeInInput("rocket");
    await submitForm();
    expect(getInput().value).toBe("");
  });

  it("clears the input after an incorrect guess", async () => {
    mockSubmitGuess.mockResolvedValue(false);
    await render();
    await typeInInput("banana");
    await submitForm();
    expect(getInput().value).toBe("");
  });

  it("does not show 'Correct!' for an incorrect guess", async () => {
    mockSubmitGuess.mockResolvedValue(false);
    await render();
    await typeInInput("banana");
    await submitForm();
    expect(container.textContent).not.toContain("Correct!");
  });
});
