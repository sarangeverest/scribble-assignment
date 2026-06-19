import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultsPage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    } else if (room?.status === "in-game") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      store.fetchRoom();
    }, 2000);
    return () => clearInterval(intervalId);
  }, [store]);

  if (!room) {
    return null;
  }

  const isHost = room.participants.some((p) => p.id === participantId && p.isHost);

  function handleRestart() {
    if (!room || !participantId) return;
    store.restartGame(room.code, participantId);
  }

  return (
    <section className="panel results-page">
      <div className="results-page__header">
        <span className="section-kicker">Round Complete</span>
        <h1 className="results-page__title">Results</h1>
        <RoomCodeBadge code={room.code} />
      </div>

      <Card title="Secret Word">
        <p className="results-page__word">{room.secretWord}</p>
      </Card>

      <div className="results-page__columns">
        <Scoreboard participants={room.participants} />
        <ResultPanel guesses={room.guesses} />
      </div>

      <div className="button-row">
        {isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Back to Lobby
          </button>
        ) : (
          <p className="results-page__waiting">Waiting for host to restart…</p>
        )}
      </div>
    </section>
  );
}
