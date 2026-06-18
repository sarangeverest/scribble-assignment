import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { ApiError } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "in-game") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      roomStore.fetchRoom().then(() => {
        setPollError(null);
      }).catch((err: unknown) => {
        // 404 means the server is back up but the room is gone (e.g. server
        // restarted and wiped in-memory state). Treat this as "recovered" —
        // clear the banner so the lobby stays visible rather than navigating away.
        if (err instanceof ApiError && err.status === 404) {
          setPollError(null);
          return;
        }
        setPollError(err instanceof Error ? err.message : "Unable to refresh room");
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [roomStore]);

  if (!room) {
    return null;
  }

  const isHost = room.participants.some(
    (p) => p.id === participantId && p.isHost
  );
  const canStart = room.participants.length >= 2;

  async function handleStartGame() {
    if (!participantId) return;
    try {
      await roomStore.startGame(room!.code, participantId);
    } catch (err) {
      setPollError(err instanceof Error ? err.message : "Unable to start game");
    }
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      {pollError ? (
        <p className="form__error" data-testid="poll-error">
          {pollError}
        </p>
      ) : null}

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.isHost ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>Waiting for the host to start the game.</p>
        </Card>
      </div>

      {isHost ? (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            data-testid="start-game"
            disabled={!canStart}
            onClick={handleStartGame}
          >
            {canStart ? "Start Game" : "Need 2+ players"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
