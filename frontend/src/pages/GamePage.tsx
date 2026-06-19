import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "results") {
      navigate("/results", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      store.fetchRoom();
    }, 2000);
    return () => clearInterval(intervalId);
  }, [store]);

  const isDrawer = participantId !== null && participantId === room?.drawerId;
  const isHost = room?.participants.some((p) => p.id === participantId && p.isHost) ?? false;

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !room || !participantId) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    store.updateCanvas(room.code, participantId, "");
  }, [room, participantId, store]);

  useEffect(() => {
    if (!isDrawer || !room || !participantId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";
    ctx.lineCap = "round";

    let drawing = false;

    const onPointerDown = (e: PointerEvent) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const onPointerUp = () => {
      if (!drawing) return;
      drawing = false;
      store.updateCanvas(room.code, participantId, canvas.toDataURL("image/png"));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDrawer, room, participantId, store]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isDrawer ? "You are drawing!" : `Drawing: ${drawer?.name ?? "Unknown"}`}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.secretWord ? (
            <Card title="Your Word">
              <p className="game-page__secret-word">{room.secretWord}</p>
            </Card>
          ) : null}

          <Card title="Canvas">
            {isDrawer ? (
              <div className="canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  className="drawing-canvas"
                  width={800}
                  height={500}
                />
                <div className="button-row button-row--compact">
                  <button className="button button--secondary" onClick={handleClear}>
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <img
                src={room.canvasData || undefined}
                className="canvas-display"
                alt="Drawing canvas"
              />
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm roomCode={room.code} participantId={participantId ?? ""} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        {isHost && (
          <button
            className="button button--primary"
            onClick={() => { if (room && participantId) store.endRound(room.code, participantId); }}
          >
            End Round
          </button>
        )}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
