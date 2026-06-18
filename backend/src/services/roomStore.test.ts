import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom marks the creator as host (isHost: true)", () => {
    const result = createRoom("Alice");

    expect(result.room.participants[0].isHost).toBe(true);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom marks the joiner as non-host (isHost: false)", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "Bob");

    expect(result).not.toBeNull();
    expect(result!.room.participants[1].isHost).toBe(false);
  });

  it("joinRoom succeeds with lowercase code (case-insensitive)", () => {
    const { room } = createRoom("Alice");
    const lowerCode = room.code.toLowerCase();
    const result = joinRoom(lowerCode, "Bob");

    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
  });

  it("rooms are isolated — joining one room does not affect another", () => {
    const { room: roomA } = createRoom("Alice");
    const { room: roomB } = createRoom("Charlie");
    joinRoom(roomA.code, "Bob");

    const freshB = joinRoom(roomB.code + "NOPE", "Dave");
    expect(freshB).toBeNull();

    const roomBState = joinRoom(roomB.code, "Eve");
    expect(roomBState!.room.participants.some((p) => p.name === "Bob")).toBe(false);
  });

  // ── US4: startGame ──────────────────────────────────────────────────────────

  it("startGame throws 403 when caller is not the host", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    const guestId = "not-the-host-id";
    void hostId;

    expect(() => startGame(room.code, guestId)).toThrow(/403|forbidden|not.*host/i);
  });

  it("startGame throws 400 when fewer than 2 participants are present", () => {
    const { room, participantId: hostId } = createRoom("Alice");

    expect(() => startGame(room.code, hostId)).toThrow(/400|need.*2|not enough|insufficient/i);
  });

  it("startGame returns a snapshot with status in-game when called by host with ≥2 participants", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const snapshot = startGame(room.code, hostId);

    expect(snapshot.status).toBe("in-game");
  });
});
