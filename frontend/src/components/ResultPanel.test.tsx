// @vitest-environment jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import type { Guess } from "../services/api.js";
import { ResultPanel } from "./ResultPanel.js";

function makeGuess(name: string, text: string, isCorrect: boolean): Guess {
  return { participantId: "pid", participantName: name, text, isCorrect, timestamp: "2024-01-01T00:00:00Z" };
}

describe("ResultPanel", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
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
  });

  it("renders each guess's submitter name", async () => {
    const guesses = [makeGuess("Alice", "banana", false), makeGuess("Bob", "rocket", true)];
    await act(async () => { root.render(createElement(ResultPanel, { guesses })); });
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Bob");
  });

  it("renders each guess's text", async () => {
    const guesses = [makeGuess("Alice", "banana", false)];
    await act(async () => { root.render(createElement(ResultPanel, { guesses })); });
    expect(container.textContent).toContain("banana");
  });

  it("renders most recent guess first (reversed from input order)", async () => {
    const guesses = [makeGuess("Alice", "first", false), makeGuess("Bob", "second", false)];
    await act(async () => { root.render(createElement(ResultPanel, { guesses })); });
    const names = Array.from(container.querySelectorAll(".result-panel__name")).map((el) => el.textContent);
    expect(names[0]).toBe("Bob");
    expect(names[1]).toBe("Alice");
  });

  it("applies correct CSS class to correct guesses", async () => {
    const guesses = [makeGuess("Alice", "rocket", true)];
    await act(async () => { root.render(createElement(ResultPanel, { guesses })); });
    const item = container.querySelector(".result-panel__item");
    expect(item?.classList.contains("result-panel__item--correct")).toBe(true);
  });

  it("does not apply correct CSS class to incorrect guesses", async () => {
    const guesses = [makeGuess("Alice", "banana", false)];
    await act(async () => { root.render(createElement(ResultPanel, { guesses })); });
    const item = container.querySelector(".result-panel__item");
    expect(item?.classList.contains("result-panel__item--correct")).toBe(false);
  });

  it("renders empty state gracefully when guesses array is empty", async () => {
    await act(async () => { root.render(createElement(ResultPanel, { guesses: [] })); });
    expect(container.querySelector(".result-panel__empty")).not.toBeNull();
    expect(container.querySelector(".result-panel__item")).toBeNull();
  });
});
