import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <ul className="scoreboard">
        {sorted.map((p) => (
          <li key={p.id} className="scoreboard__row">
            <span className="scoreboard__name">{p.name}</span>
            <strong className="scoreboard__score">{p.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
