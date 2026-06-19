import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  roomCode: string;
  participantId: string;
}

export function GuessForm({ roomCode, participantId }: GuessFormProps) {
  const store = useRoomStore();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess cannot be empty");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const isCorrect = await store.submitGuess(roomCode, participantId, trimmed);
      setGuessText("");
      setFeedback(isCorrect ? "correct" : null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form guess-form" onSubmit={handleSubmit}>
      {feedback === "correct" && (
        <p className="guess-form__feedback guess-form__feedback--correct">Correct!</p>
      )}
      {error && <p className="guess-form__error">{error}</p>}
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Type your guess here..."
          disabled={submitting}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={submitting}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
