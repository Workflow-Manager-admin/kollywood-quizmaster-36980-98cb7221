import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails } from "../tmdbApi";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Spin the Wheel: Spin to get a random actor, actress, and year; user must guess the movie featuring all three.
 */
export default function SpinTheWheel() {
  const [spin, setSpin] = useState(null);
  const [movies, setMovies] = useState([]);
  const [question, setQuestion] = useState(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(0);
  const [done, setDone] = useState(false);
  const [reveal, setReveal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      // Fetch raw tamil movies, pick 10, fetch their details for cast/year
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 8) + 2 });
      let films = (resp.results || []).slice(0, 10);
      films = await Promise.all(
        films.map(async m => {
          const det = await fetchMovieDetails(m.id);
          return {
            ...m,
            year: det.release_date?.substring(0, 4),
            actors: det.credits?.cast?.map(c => c.name) || [],
          };
        })
      );
      setMovies(films);
      setTurn(0);
    }
    load();
  }, []);

  useEffect(() => {
    // For current turn, randomly pick one actor, one actress, and the year for the movie for question
    if (movies.length && turn < 10) {
      const m = movies[turn];
      const actors = m.actors || [];
      // Find likely male and female actors, fallback to random picks
      const [a, b] = actors.length > 1 ? [actors[0], actors[1]] : [actors[0] || "Unknown", "Unknown"];
      setQuestion({
        year: m.year,
        actor: a,
        actress: b,
        answer: m.title,
      });
      setSpin(null);
      setReveal(false);
      setFeedback("");
      setGuess("");
    }
    if (turn >= 10 && movies.length) setDone(true);
  }, [movies, turn]);

  function doSpin() {
    setSpin("spun");
    setFeedback("");
    setGuess("");
    setReveal(false);
  }

  function submit() {
    if (!question) return;
    if (guess.trim().toLowerCase() === question.answer.trim().toLowerCase()) {
      setScore(score + 1);
      setFeedback("👍 Correct!");
      setReveal(true);
    } else {
      setFeedback("Try again, or reveal the answer.");
    }
  }

  function revealAnswer() {
    setReveal(true);
    setFeedback(`The answer was: ${question?.answer}`);
  }

  function next() {
    setTurn(turn + 1);
    setSpin(null);
    setReveal(false);
    setGuess("");
    setFeedback("");
  }

  if (!movies.length) return <div className="container"><h2>Loading Spin the Wheel…</h2></div>;
  if (done) return (
    <div className="container">
      <h2>Spin the Wheel Complete!</h2>
      <div>
        Your Score: {score} / 10
      </div>
      <button className="btn btn-large" onClick={() => navigate("/result", { state: { score, total: 10 } })}>
        See Full Results
      </button>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 44 }}>
      <h2 className="subtitle" style={{ color: "#fc03e8" }}>
        Spin the Wheel! ({turn + 1} / 10)
      </h2>
      {!spin ? (
        <button className="btn btn-large" style={{ background: "#fc03e8", color: "#fff" }} onClick={doSpin}>
          Spin!
        </button>
      ) : (
        <div style={{
          marginTop: 20, marginBottom: 20, background: "#0a0000", border: "2px solid #fc03e8",
          borderRadius: 16, padding: 22
        }}>
          <div>
            <b>Actor:</b> {question?.actor || "?"}
          </div>
          <div>
            <b>Actress:</b> {question?.actress || "?"}
          </div>
          <div>
            <b>Year:</b> {question?.year || "?"}
          </div>
          <form onSubmit={e => { e.preventDefault(); submit(); }}>
            <input
              value={guess}
              onChange={e => setGuess(e.target.value)}
              placeholder="Movie name"
              disabled={reveal}
              style={{
                margin: "18px 0 0 0",
                width: "100%",
                fontSize: 18,
                padding: "10px 8px",
                border: "2px solid #fc03e8",
                borderRadius: 7,
                color: "#0a0000",
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className="btn" style={{ background: "#fc03e8", color: "#fff" }}
                disabled={reveal || !guess.trim()}>
                Submit
              </button>
              <button className="btn" style={{ background: "#a1a1a1" }} onClick={revealAnswer} type="button" disabled={reveal}>
                Reveal Answer
              </button>
              <button className="btn" style={{ background: "#a1a1a1" }} onClick={next} type="button" disabled={!reveal}>
                Next
              </button>
            </div>
          </form>
          <div style={{ color: reveal ? "#0afc76" : "#fc0361", marginTop: 12, minHeight: 28 }}>
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}
