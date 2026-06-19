import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  const ordered = [...guesses].reverse();

  return (
    <Card title="Activity">
      {ordered.length === 0 ? (
        <p className="result-panel__empty">No guesses yet.</p>
      ) : (
        <ul className="result-panel">
          {ordered.map((g, i) => (
            <li
              key={i}
              className={`result-panel__item${g.isCorrect ? " result-panel__item--correct" : ""}`}
            >
              <span className="result-panel__name">{g.participantName}</span>
              <span className="result-panel__text">{g.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
