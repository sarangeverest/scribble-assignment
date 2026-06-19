// @vitest-environment jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import type { Participant } from "../services/api.js";
import { Scoreboard } from "./Scoreboard.js";

function makeParticipant(id: string, name: string, score: number): Participant {
  return { id, name, joinedAt: "2024-01-01T00:00:00Z", isHost: false, score };
}

describe("Scoreboard", () => {
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

  it("renders each participant's name", async () => {
    const participants = [makeParticipant("a", "Alice", 100), makeParticipant("b", "Bob", 0)];
    await act(async () => { root.render(createElement(Scoreboard, { participants })); });
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Bob");
  });

  it("renders each participant's score", async () => {
    const participants = [makeParticipant("a", "Alice", 100), makeParticipant("b", "Bob", 0)];
    await act(async () => { root.render(createElement(Scoreboard, { participants })); });
    expect(container.textContent).toContain("100");
    expect(container.textContent).toContain("0");
  });

  it("renders the participant with the highest score first", async () => {
    const participants = [makeParticipant("a", "Alice", 0), makeParticipant("b", "Bob", 100)];
    await act(async () => { root.render(createElement(Scoreboard, { participants })); });
    const names = Array.from(container.querySelectorAll(".scoreboard__name")).map((el) => el.textContent);
    expect(names[0]).toBe("Bob");
    expect(names[1]).toBe("Alice");
  });

  it("sorts participants by score descending", async () => {
    const participants = [
      makeParticipant("a", "Alice", 200),
      makeParticipant("b", "Bob", 100),
      makeParticipant("c", "Carol", 300)
    ];
    await act(async () => { root.render(createElement(Scoreboard, { participants })); });
    const scores = Array.from(container.querySelectorAll(".scoreboard__score")).map(
      (el) => Number(el.textContent)
    );
    expect(scores).toEqual([300, 200, 100]);
  });

  it("renders '0' for participants with no score", async () => {
    const participants = [makeParticipant("a", "Alice", 0)];
    await act(async () => { root.render(createElement(Scoreboard, { participants })); });
    expect(container.querySelector(".scoreboard__score")?.textContent).toBe("0");
  });
});
