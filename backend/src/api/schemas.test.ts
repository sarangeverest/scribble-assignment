import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, submitGuessSchema, updateDrawingSchema } from "./schemas.js";

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
});
