import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Cast Combo: User gets 2-3 actor names and must guess the film, or reverse to spot the actor not in a given film.
 */
export default function CastCombo() {
  const [qIdx, setQIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [reverse, setReverse] = useState(false); // reverse mode (odd-one-out)

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      // Pre-load 7 movies, grab their actors, randomly pick sets of 2-3
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 5) + 1 });
      let movies = (resp.results || []).filter(m => m.id && m.title).slice(0, 7);
      const movieDetails = await Promise.all(
        movies.map(async m => {
          const detail = await fetchMovieDetails(m.id);
          return {
            ...m,
            cast: (detail.credits?.cast?.map(c => c.name) || []).slice(0, 4),
          };
        })
      );
      // Build 5 questions (normal: guess movie, 5th: odd-one-out)
      const qs = [];
      for (let i = 0; i < 4; i++) {
        const m = movieDetails[i];
        if (m.cast.length >= 2) {
          qs.push({
            type: "combo",
            correct: m.title,
            actors: [m.cast[0], m.cast[1], m.cast[2]].filter(Boolean),
          });
        }
      }
      // Reverse mode: one actor is not in the film
      const m = movieDetails[5];
      if (m && m.cast.length >= 2) {
        const fakeActor = movieDetails[6]?.cast?.[0] || "Unknown";
        qs.push({
          type: "reverse",
          movie: m.title,
          actors: [m.cast[0], m.cast[1], fakeActor].sort(() => 0.5 - Math.random()),
          answer: fakeActor,
        });
      }
      setQuestions(qs);
      setQIdx(0);
      setScore(0);
      setReveal(false);
      setReverse(false);
    }
    load();
  }, []);

  if (!questions.length) return (
    <div className="container"><h2>Loading Cast Combo…</h2></div>
  );

  if (qIdx >= questions.length) {
    return (
      <div className="container">
        <h2>Cast Combo Complete!</h2>
        <div>
          Your Score: {score} / {questions.length}
        </div>
        <button className="btn btn-large" onClick={() => navigate("/result", { state: { score, total: questions.length } })}>
          See Full Results
        </button>
      </div>
    );
  }

  const q = questions[qIdx];

  function submit(e) {
    e.preventDefault();
    if (q.type === "combo") {
      if (guess.trim().toLowerCase() === q.correct.toLowerCase()) {
        setFeedback("✅ Correct!");
        setScore(score + 1);
        setReveal(true);
        setTimeout(() => { next(); }, 500);
      } else {
        setFeedback("Try again, or reveal the answer.");
      }
    } else if (q.type === "reverse") {
      if (guess.trim().toLowerCase() === q.answer.toLowerCase()) {
        setFeedback("👏 That's right!");
        setScore(score + 1);
        setReveal(true);
        setTimeout(() => { next(); }, 500);
      } else {
        setFeedback("Try again, or reveal the answer.");
      }
    }
  }

  function next() {
    setQIdx(qIdx + 1);
    setGuess("");
    setReveal(false);
    setFeedback("");
  }

  function revealAnswer() {
    setReveal(true);
    setFeedback(q.type === "combo"
      ? `The answer is: ${q.correct}`
      : `The answer is: ${q.answer} (not in ${q.movie})`);
    setTimeout(() => { next(); }, 1250);
  }

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 44 }}>
      <BackButton />
      <div style={{ marginBottom: 15 }}>
        <span className="subtitle" style={{ color: "#fc03e8" }}>
          Cast Combo: Q{qIdx + 1} / {questions.length}
        </span>
      </div>
      <div style={{
        margin: "12px 0", color: "#f5f4f0", fontWeight: 600
      }}>
        {q.type === "combo"
          ? <>
            Which Kollywood movie features {q.actors.join(", ")}?
          </>
          : <>
            Which of these actors <span style={{ color: "#fc03e8" }}>{q.actors.join(", ")}</span> was <b>not</b> in <b>{q.movie}</b>?
          </>
        }
      </div>
      <form onSubmit={submit}>
        <input
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder={q.type === "combo" ? "Movie name" : "Actor name"}
          disabled={reveal}
          style={{
            width: "100%",
            fontSize: 18,
            padding: "10px 8px",
            border: "2px solid #fc03e8",
            borderRadius: 7,
            color: "#0a0000",
            marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn" style={{ background: "#fc03e8", color: "#fff" }} disabled={reveal}>Submit</button>
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
  );
}
