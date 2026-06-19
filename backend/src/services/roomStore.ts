import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost,
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName, false);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startGame(code: string, participantId: string): RoomSnapshot {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    throw new Error("404: Room not found");
  }

  const caller = room.participants.find((p) => p.id === participantId);

  if (!caller || !caller.isHost) {
    throw new Error("403: Forbidden — only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("400: Need at least 2 players to start the game");
  }

  if ((STARTER_WORDS as readonly string[]).length === 0) {
    throw new Error("400: No words available to start the game");
  }

  room.currentRound = { drawerId: caller.id, word: STARTER_WORDS[0], status: "active", guesses: [], canvasData: "" };
  room.status = "in-game";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room), participantId);
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const drawerId = room.currentRound?.drawerId ?? null;
  const secretWord =
    room.status === "results"
      ? room.currentRound?.word
      : viewerParticipantId && viewerParticipantId === drawerId
      ? room.currentRound!.word
      : undefined;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId,
    guesses: room.currentRound?.guesses ?? [],
    canvasData: room.currentRound?.canvasData ?? "",
    ...(secretWord !== undefined && { secretWord })
  };
}

export function endRound(code: string, participantId: string): RoomSnapshot {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error("404: Room not found");
  if (room.status !== "in-game" || !room.currentRound) throw new Error("400: No active round");

  const caller = room.participants.find((p) => p.id === participantId);
  if (!caller || !caller.isHost) throw new Error("403: Forbidden — only the host can end the round");

  room.status = "results";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function restartGame(code: string, participantId: string): RoomSnapshot {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error("404: Room not found");
  if (room.status !== "results") throw new Error("400: Room is not in results state");

  const caller = room.participants.find((p) => p.id === participantId);
  if (!caller || !caller.isHost) throw new Error("403: Forbidden — only the host can restart");

  room.status = "lobby";
  room.currentRound = undefined;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function submitGuess(
  code: string,
  participantId: string,
  guessText: string
): { snapshot: RoomSnapshot; isCorrect: boolean } {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error("404: Room not found");
  if (!room.currentRound) throw new Error("400: No active round");
  if (participantId === room.currentRound.drawerId) throw new Error("403: Drawer cannot guess");

  const isCorrect = guessText.toLowerCase() === room.currentRound.word.toLowerCase();
  const hasAlreadyScored = room.currentRound.guesses.some(
    (g) => g.participantId === participantId && g.isCorrect
  );

  if (isCorrect && !hasAlreadyScored) {
    const participant = room.participants.find((p) => p.id === participantId);
    if (participant) participant.score += 100;
  }

  const submitter = room.participants.find((p) => p.id === participantId);
  const guess: Guess = {
    participantId,
    participantName: submitter?.name ?? "Unknown",
    text: guessText,
    isCorrect,
    timestamp: now()
  };
  room.currentRound.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    snapshot: toRoomSnapshot(cloneRoom(room), participantId),
    isCorrect
  };
}

export function updateCanvas(code: string, participantId: string, canvasData: string): void {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error("404: Room not found");
  if (!room.currentRound) throw new Error("400: No active round");
  if (participantId !== room.currentRound.drawerId) throw new Error("403: Only the drawer can update the canvas");

  room.currentRound.canvasData = canvasData;
  room.updatedAt = now();
  rooms.set(room.code, room);
}
