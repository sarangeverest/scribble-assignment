export type RoomStatus = "lobby" | "in-game";

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  score: number;
}

export interface Round {
  drawerId: string;
  word: string;
  status: "active";
  guesses: Guess[];
  canvasData: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  currentRound?: Round;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string | null;
  secretWord?: string;
  guesses: Guess[];
  canvasData: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
