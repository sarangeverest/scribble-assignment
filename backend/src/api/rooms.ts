import { Router } from "express";
import {
  createRoomSchema,
  endRoundSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema,
  updateDrawingSchema
} from "./schemas.js";
import { createRoom, endRound, getRoom, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot, updateCanvas } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const snapshot = startGame(code, participantId);
      response.json({ room: snapshot });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("403")) {
        next(new HttpError(403, error.message.replace(/^403:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("400")) {
        next(new HttpError(400, error.message.replace(/^400:\s*/, "")));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const { snapshot, isCorrect } = submitGuess(code, participantId, guess);
      response.json({ isCorrect, room: snapshot });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("404")) {
        next(new HttpError(404, error.message.replace(/^404:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("400")) {
        next(new HttpError(400, error.message.replace(/^400:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("403")) {
        next(new HttpError(403, error.message.replace(/^403:\s*/, "")));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, canvasData } = updateDrawingSchema.parse(request.body);
      updateCanvas(code, participantId, canvasData);
      response.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("404")) {
        next(new HttpError(404, error.message.replace(/^404:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("400")) {
        next(new HttpError(400, error.message.replace(/^400:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("403")) {
        next(new HttpError(403, error.message.replace(/^403:\s*/, "")));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const snapshot = endRound(code, participantId);
      response.json({ room: snapshot });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("404")) {
        next(new HttpError(404, error.message.replace(/^404:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("400")) {
        next(new HttpError(400, error.message.replace(/^400:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("403")) {
        next(new HttpError(403, error.message.replace(/^403:\s*/, "")));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      const snapshot = restartGame(code, participantId);
      response.json({ room: snapshot });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("404")) {
        next(new HttpError(404, error.message.replace(/^404:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("400")) {
        next(new HttpError(400, error.message.replace(/^400:\s*/, "")));
      } else if (error instanceof Error && error.message.startsWith("403")) {
        next(new HttpError(403, error.message.replace(/^403:\s*/, "")));
      } else {
        next(error);
      }
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
