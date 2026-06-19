import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, getRoom, toRoomSnapshot, updateCanvas, submitGuess } from "./roomStore.js";

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

  // ── US2: Host as drawer at round start ──────────────────────────────────────

  it("startGame sets currentRound.drawerId to host id", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    expect(getRoom(room.code)!.currentRound?.drawerId).toBe(hostId);
  });

  it("startGame sets currentRound.word to first starter word (rocket)", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    expect(getRoom(room.code)!.currentRound?.word).toBe("rocket");
  });

  it("startGame sets currentRound.status to active", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    expect(getRoom(room.code)!.currentRound?.status).toBe("active");
  });

  it("toRoomSnapshot returns drawerId matching host when in-game", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    const inGameRoom = getRoom(room.code)!;
    expect(toRoomSnapshot(inGameRoom, hostId).drawerId).toBe(hostId);
  });

  it("toRoomSnapshot returns drawerId null when room is in lobby", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const lobbyRoom = getRoom(room.code)!;

    expect(toRoomSnapshot(lobbyRoom, hostId).drawerId).toBeNull();
  });

  it("toRoomSnapshot returns a drawerId that is not the guesser's id", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob")!;
    const guesserId = joinResult.participantId;
    void hostId;
    startGame(room.code, hostId);

    const inGameRoom = getRoom(room.code)!;
    expect(toRoomSnapshot(inGameRoom, guesserId).drawerId).not.toBe(guesserId);
  });

  // ── US3: Secret word visible only to drawer ──────────────────────────────────

  it("toRoomSnapshot includes secretWord for the drawer", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    const inGameRoom = getRoom(room.code)!;
    expect(toRoomSnapshot(inGameRoom, hostId).secretWord).toBe("rocket");
  });

  it("toRoomSnapshot omits secretWord for a guesser", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob")!;
    const guesserId = joinResult.participantId;
    startGame(room.code, hostId);

    const inGameRoom = getRoom(room.code)!;
    expect(toRoomSnapshot(inGameRoom, guesserId).secretWord).toBeUndefined();
  });

  it("toRoomSnapshot omits secretWord when no viewerParticipantId provided", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    const inGameRoom = getRoom(room.code)!;
    expect(toRoomSnapshot(inGameRoom).secretWord).toBeUndefined();
  });

  it("toRoomSnapshot omits secretWord in lobby (no active round)", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const lobbyRoom = getRoom(room.code)!;

    expect(toRoomSnapshot(lobbyRoom, hostId).secretWord).toBeUndefined();
  });

  // ── Foundational: score, guesses, canvasData ─────────────────────────────────

  it("createRoom gives the host participant score of 0", () => {
    const { room } = createRoom("Alice");
    expect(room.participants[0].score).toBe(0);
  });

  it("joinRoom gives the joining participant score of 0", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "Bob");
    expect(result!.room.participants[1].score).toBe(0);
  });

  it("startGame initialises currentRound.guesses as empty array", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    expect(getRoom(room.code)!.currentRound?.guesses).toEqual([]);
  });

  it("startGame initialises currentRound.canvasData as empty string", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    expect(getRoom(room.code)!.currentRound?.canvasData).toBe("");
  });

  it("toRoomSnapshot includes guesses array in snapshot", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    const snapshot = toRoomSnapshot(getRoom(room.code)!, hostId);
    expect(snapshot.guesses).toEqual([]);
  });

  it("toRoomSnapshot includes canvasData string in snapshot", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    const snapshot = toRoomSnapshot(getRoom(room.code)!, hostId);
    expect(snapshot.canvasData).toBe("");
  });

  it("toRoomSnapshot returns guesses: [] and canvasData: '' for lobby snapshot", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const lobbyRoom = getRoom(room.code)!;
    const snapshot = toRoomSnapshot(lobbyRoom, hostId);
    expect(snapshot.guesses).toEqual([]);
    expect(snapshot.canvasData).toBe("");
  });

  // ── US2: updateCanvas ────────────────────────────────────────────────────────

  it("updateCanvas stores canvasData on currentRound for the drawer", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    updateCanvas(room.code, hostId, "data:image/png;base64,abc");
    expect(getRoom(room.code)!.currentRound?.canvasData).toBe("data:image/png;base64,abc");
  });

  it("updateCanvas throws 403 when caller is not the drawer", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    expect(() => updateCanvas(room.code, guestResult.participantId, "data:image/png;base64,abc")).toThrow(/403/);
  });

  it("updateCanvas throws 400 when there is no active round", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    expect(() => updateCanvas(room.code, hostId, "data:image/png;base64,abc")).toThrow(/400/);
  });

  it("updateCanvas throws 404 when room does not exist", () => {
    expect(() => updateCanvas("ZZZZ", "any-id", "")).toThrow(/404/);
  });

  it("toRoomSnapshot returns updated canvasData after updateCanvas call", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    updateCanvas(room.code, hostId, "data:image/png;base64,xyz");
    const snapshot = toRoomSnapshot(getRoom(room.code)!, hostId);
    expect(snapshot.canvasData).toBe("data:image/png;base64,xyz");
  });

  it("updateCanvas stores empty string when canvas is cleared", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    updateCanvas(room.code, hostId, "data:image/png;base64,abc");
    updateCanvas(room.code, hostId, "");
    expect(getRoom(room.code)!.currentRound?.canvasData).toBe("");
  });

  // ── US3: submitGuess ─────────────────────────────────────────────────────────

  it("submitGuess returns isCorrect: true for case-insensitive match", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    const { isCorrect } = submitGuess(room.code, guestResult.participantId, "ROCKET");
    expect(isCorrect).toBe(true);
  });

  it("submitGuess returns isCorrect: false for non-matching guess", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    const { isCorrect } = submitGuess(room.code, guestResult.participantId, "banana");
    expect(isCorrect).toBe(false);
  });

  it("submitGuess throws 403 when drawer tries to guess", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    expect(() => submitGuess(room.code, hostId, "rocket")).toThrow(/403/);
  });

  it("submitGuess throws 400 when there is no active round", () => {
    const { room } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    expect(() => submitGuess(room.code, guestResult.participantId, "rocket")).toThrow(/400/);
  });

  it("submitGuess throws 404 when room does not exist", () => {
    expect(() => submitGuess("ZZZZ", "any-id", "rocket")).toThrow(/404/);
  });

  it("submitGuess increments guesser score by 100 on first correct guess", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    submitGuess(room.code, guestResult.participantId, "rocket");
    const guesser = getRoom(room.code)!.participants.find((p) => p.id === guestResult.participantId)!;
    expect(guesser.score).toBe(100);
  });

  it("submitGuess does not increment score on second correct guess by same player", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    submitGuess(room.code, guestResult.participantId, "rocket");
    submitGuess(room.code, guestResult.participantId, "ROCKET");
    const guesser = getRoom(room.code)!.participants.find((p) => p.id === guestResult.participantId)!;
    expect(guesser.score).toBe(100);
  });

  it("submitGuess does not change score for incorrect guess", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    submitGuess(room.code, guestResult.participantId, "banana");
    const guesser = getRoom(room.code)!.participants.find((p) => p.id === guestResult.participantId)!;
    expect(guesser.score).toBe(0);
  });

  it("submitGuess appends the guess to currentRound.guesses", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    submitGuess(room.code, guestResult.participantId, "banana");
    expect(getRoom(room.code)!.currentRound?.guesses).toHaveLength(1);
    expect(getRoom(room.code)!.currentRound?.guesses[0].text).toBe("banana");
  });

  it("submitGuess snapshot includes the new guess in guesses array", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    const { snapshot } = submitGuess(room.code, guestResult.participantId, "banana");
    expect(snapshot.guesses).toHaveLength(1);
    expect(snapshot.guesses[0].isCorrect).toBe(false);
  });

  it("submitGuess marks second correct guess as isCorrect: true but does not score", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guestResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, hostId);
    submitGuess(room.code, guestResult.participantId, "rocket");
    const { isCorrect, snapshot } = submitGuess(room.code, guestResult.participantId, "rocket");
    expect(isCorrect).toBe(true);
    const guesser = snapshot.participants.find((p) => p.id === guestResult.participantId)!;
    expect(guesser.score).toBe(100);
  });
});
