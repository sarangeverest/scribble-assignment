import { z } from "zod";

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, "Name cannot be empty")
  .max(20, "Name must be 20 characters or fewer");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1)
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guess: z.string().trim().min(1, "Guess cannot be empty")
});

export const updateDrawingSchema = z.object({
  participantId: z.string().min(1),
  canvasData: z.string()
});

export const endRoundSchema = z.object({
  participantId: z.string().min(1)
});

export const restartGameSchema = z.object({
  participantId: z.string().min(1)
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
