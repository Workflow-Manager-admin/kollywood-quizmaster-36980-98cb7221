import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieImages, getTmdbImageUrl, fetchMovieDetails } from "../tmdbApi";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Blurred Poster Guess quiz: User sees a blurred poster, guesses the movie,
 * can request two clues, reveal answer, or skip. 10 moderate questions per game.
 */
export default function BlurredPosterQuiz() {
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clues, setClues] = useState([]);
  const [showClues, setShowClues] = useState([false, false]);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [answerShown, setAnswerShown] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch 10 random tamil movies as questions
    async function load() {
      setLoading(true);
      try {
        const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 8) + 1 });
        // pick 10 unique movies with posters and reasonable titles
        let films = (resp.results || [])
          .filter(m => m.poster_path && m.title && m.title.length > 2);

        // fallback if <10 results
        while (films.length < 10 && resp.page < resp.total_pages) {
          const nextPage = await fetchTamilMovies({ page: resp.page + 1 });
          films = films.concat(
            (nextPage.results || []).filter(m => m.poster_path && m.title && m.title.length > 2)
          );
        }
        films = films.sort(() => 0.5 - Math.random()).slice(0, 10);
        // fetch clues for each movie (release year and genre)
        const filmsWithDetails = await Promise.all(
          films.map(async (m) => {
            const detail = await fetchMovieDetails(m.id);
            return {
              ...m,
              year: detail.release_date?.split("-")[0],
              genre: detail.genres?.[0]?.name,
            };
          })
        );
        setQuestions(filmsWithDetails);
      } catch {
        setQuestions([]);
      }
      setQIdx(0);
      setClues([]);
      setShowClues([false, false]);
      setGuess("");
      setFeedback("");
      setScore(0);
      setDone(false);
      setLoading(false);
      setRevealed(false);
      setAnswerShown(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h2>Loading quiz...</h2>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container">
        <h2>Quiz Complete!</h2>
        <div>Your Score: {score} / 10</div>
        <button className="btn btn-large" onClick={() => navigate("/result", { state: { score, total: 10 } })}>
          See Full Results
        </button>
      </div>
    );
  }

  const movie = questions[qIdx];
  // clues: [release year, genre]
  const cluesArray = [
    `Year: ${movie.year || "Unknown"}`,
    `Genre: ${movie.genre || "Unknown"}`,
  ];

  function submitGuess() {
    if (revealed) return;
    const userGuess = guess.trim().toLowerCase();
    if (userGuess === movie.title.trim().toLowerCase()) {
      setFeedback("🎉 Correct!");
      setScore(score + 1);
      setRevealed(true);
      setAnswerShown(true);
    } else {
      setFeedback("❌ Try again, or reveal the answer.");
    }
  }

  function nextQuestion() {
    if (qIdx === 9) {
      setDone(true);
    } else {
      setQIdx(qIdx + 1);
      setClues([]);
      setShowClues([false, false]);
      setFeedback("");
      setGuess("");
      setRevealed(false);
      setAnswerShown(false);
    }
  }

  function revealAnswer() {
    setAnswerShown(true);
    setRevealed(true);
    setFeedback(`💡 The answer is: ${movie.title}`);
  }

  function handleShowClue(i) {
    const updatedShow = [...showClues];
    updatedShow[i] = true;
    setShowClues(updatedShow);
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 44 }}>
      <div style={{ marginBottom: 26 }}>
        <span className="subtitle" style={{ color: "#fc03e8" }}>
          Blurred Poster Guess: Question {qIdx + 1} / 10
        </span>
      </div>
      {/* Blurred poster */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <img
          src={getTmdbImageUrl(movie.poster_path, "w500")}
          alt="Movie Poster"
          style={{
            borderRadius: 14,
            filter: "blur(12px)",
            maxWidth: "90%",
            boxShadow: "0 0 14px #fc03e8",
            marginBottom: 6,
          }}
        />
      </div>
      <div>
        {showClues.map((show, i) =>
          show ? (
            <div key={i} style={{ color: "#f5f4f0", marginBottom: 5 }}>
              <b>Clue {i + 1}: </b>
              {cluesArray[i]}
            </div>
          ) : (
            <button
              className="btn"
              style={{
                background: "#fc03e8",
                color: "#0a0000",
                marginRight: 8,
                marginBottom: 4,
              }}
              onClick={() => handleShowClue(i)}
              key={`cluebtn${i}`}
              disabled={revealed}
            >
              Reveal Clue {i + 1}
            </button>
          )
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitGuess();
        }}
        style={{ marginTop: 14 }}
      >
        <input
          type="text"
          value={guess}
          placeholder="Type movie name…"
          style={{
            width: "100%",
            fontSize: 18,
            padding: "10px 8px",
            border: "2px solid #fc03e8",
            borderRadius: 7,
            color: "#0a0000",
            marginBottom: 12,
          }}
          onChange={(e) => setGuess(e.target.value)}
          disabled={revealed}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn"
            style={{ background: "#fc03e8", color: "#fff" }}
            type="submit"
            disabled={revealed}
          >
            Submit
          </button>
          <button
            className="btn"
            style={{ background: "#a1a1a1", color: "#fff" }}
            type="button"
            onClick={revealAnswer}
            disabled={revealed}
          >
            Reveal Answer
          </button>
          <button
            className="btn"
            style={{ background: "#a1a1a1", color: "#fff" }}
            type="button"
            onClick={nextQuestion}
            disabled={!revealed}
          >
            Next
          </button>
        </div>
        <div style={{ minHeight: 30, color: revealed ? "#0afc76" : "#fc0361", marginTop: 10, fontWeight: 600 }}>
          {feedback}
        </div>
      </form>
    </div>
  );
}
