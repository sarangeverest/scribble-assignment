import { describe, expect, it } from "vitest";
import { createRoomSchema, endRoundSchema, joinRoomSchema, restartGameSchema, roomCodeParamsSchema, submitGuessSchema, updateDrawingSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("createRoomSchema rejects missing playerName", () => {
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("joinRoomSchema rejects empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("joinRoomSchema rejects missing playerName", () => {
    expect(() => joinRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  // ── US1: Player Name Validation ─────────────────────────────────────────────

  it("createRoomSchema trims surrounding whitespace from playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "  " })).toThrow();
  });

  it("createRoomSchema rejects playerName longer than 20 characters", () => {
    expect(() => createRoomSchema.parse({ playerName: "A".repeat(21) })).toThrow();
  });

  it("createRoomSchema accepts playerName of exactly 20 characters", () => {
    const result = createRoomSchema.parse({ playerName: "A".repeat(20) });

    expect(result.playerName).toHaveLength(20);
  });

  // ── US2: updateDrawingSchema ─────────────────────────────────────────────────

  it("updateDrawingSchema accepts valid participantId and canvasData", () => {
    const result = updateDrawingSchema.parse({ participantId: "uuid-1", canvasData: "data:image/png;base64,abc" });
    expect(result.participantId).toBe("uuid-1");
    expect(result.canvasData).toBe("data:image/png;base64,abc");
  });

  it("updateDrawingSchema accepts empty string canvasData (clear)", () => {
    const result = updateDrawingSchema.parse({ participantId: "uuid-1", canvasData: "" });
    expect(result.canvasData).toBe("");
  });

  it("updateDrawingSchema rejects missing participantId", () => {
    expect(() => updateDrawingSchema.parse({ canvasData: "data:image/png;base64,abc" })).toThrow();
  });

  it("updateDrawingSchema rejects empty participantId", () => {
    expect(() => updateDrawingSchema.parse({ participantId: "", canvasData: "" })).toThrow();
  });

  // ── US3: submitGuessSchema ───────────────────────────────────────────────────

  it("submitGuessSchema accepts valid participantId and guess", () => {
    const result = submitGuessSchema.parse({ participantId: "uuid-1", guess: "rocket" });
    expect(result.participantId).toBe("uuid-1");
    expect(result.guess).toBe("rocket");
  });

  it("submitGuessSchema trims whitespace from guess", () => {
    const result = submitGuessSchema.parse({ participantId: "uuid-1", guess: "  rocket  " });
    expect(result.guess).toBe("rocket");
  });

  it("submitGuessSchema rejects empty guess after trim", () => {
    expect(() => submitGuessSchema.parse({ participantId: "uuid-1", guess: "   " })).toThrow();
  });

  it("submitGuessSchema rejects missing participantId", () => {
    expect(() => submitGuessSchema.parse({ guess: "rocket" })).toThrow();
  });

  it("submitGuessSchema rejects empty participantId", () => {
    expect(() => submitGuessSchema.parse({ participantId: "", guess: "rocket" })).toThrow();
  });

  // ── US1: endRoundSchema ──────────────────────────────────────────────────────

  it("endRoundSchema accepts valid participantId", () => {
    const result = endRoundSchema.parse({ participantId: "uuid-1" });
    expect(result.participantId).toBe("uuid-1");
  });

  it("endRoundSchema rejects empty participantId", () => {
    expect(() => endRoundSchema.parse({ participantId: "" })).toThrow();
  });

  it("endRoundSchema rejects missing participantId", () => {
    expect(() => endRoundSchema.parse({})).toThrow();
  });

  // ── US2: restartGameSchema ────────────────────────────────────────────────────

  it("restartGameSchema accepts valid participantId", () => {
    const result = restartGameSchema.parse({ participantId: "uuid-2" });
    expect(result.participantId).toBe("uuid-2");
  });

  it("restartGameSchema rejects empty participantId", () => {
    expect(() => restartGameSchema.parse({ participantId: "" })).toThrow();
  });

  it("restartGameSchema rejects missing participantId", () => {
    expect(() => restartGameSchema.parse({})).toThrow();
  });
});
