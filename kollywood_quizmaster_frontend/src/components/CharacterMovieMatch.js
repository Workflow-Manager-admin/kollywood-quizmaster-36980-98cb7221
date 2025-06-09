import React, { useState, useEffect, useRef } from "react";
import { fetchTamilMovies, fetchMovieDetails, getTmdbImageUrl } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Character-Movie Match: Drag the character name clue onto the correct movie poster.
 * Features 5 moderate questions per game session.
 */
export default function CharacterMovieMatch() {
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [afterDrop, setAfterDrop] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [droppedIdx, setDroppedIdx] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Load 5 questions: each with movie posters and character clues
    async function load() {
      setLoading(true);
      // Get 10 random Tamil movies (for more options in pool)
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 7) + 2 });
      let movies = (resp.results || []).filter(
        (m) => m.id && m.title && m.poster_path
      );
      // Get movie details and pick only those with 2+ characters
      const poolWithChars = [];
      for (const film of movies.slice(0, 14)) {
        try {
          const details = await fetchMovieDetails(film.id);
          const cast = details.credits?.cast?.filter(c => !!c.character) || [];
          // Only those with decent character names and at least 1 known character (ignore "Self")
          const chars = cast
            .map(c => c.character)
            .filter(ch => ch.length > 1 && !/^himself|herself|themselves|self$/i.test(ch));
          if (chars.length > 0) {
            poolWithChars.push({
              movieId: film.id,
              poster: film.poster_path,
              title: film.title,
              characterNames: chars,
            });
          }
        } catch {}
        if (poolWithChars.length > 6) break;
      }
      // Each question: sample 1 real (+ 2 decoys for options), pick random character from real
      const questionsArr = [];
      const moviePool = [...poolWithChars];
      for (let k = 0; k < 5 && moviePool.length >= 3; k++) {
        // Pick correct answer
        const idx = Math.floor(Math.random() * moviePool.length);
        const realMovie = moviePool.splice(idx, 1)[0];
        // Pick random character from real film
        const charIdx = Math.floor(Math.random() * realMovie.characterNames.length);
        const clueChar = realMovie.characterNames[charIdx];

        // Choose 2 decoy movies
        const decoyCandidates = moviePool.length >= 2
          ? moviePool.slice(0, 2)
          : poolWithChars.filter(m => m.movieId !== realMovie.movieId).slice(0, 2);

        const optionsArr = [
          {
            id: realMovie.movieId,
            title: realMovie.title,
            poster: realMovie.poster,
            isCorrect: true,
          },
          ...decoyCandidates.map(dc => ({
            id: dc.movieId,
            title: dc.title,
            poster: dc.poster,
            isCorrect: false,
          })),
        ].sort(() => 0.5 - Math.random());

        questionsArr.push({
          clue: clueChar,
          correctMovieId: realMovie.movieId,
          options: optionsArr,
        });
      }
      setQuestions(questionsArr);
      setQIdx(0);
      setScore(0);
      setDone(false);
      setLoading(false);
      setAfterDrop(false);
      setDroppedIdx(null);
      setFeedback("");
    }
    load();
  }, []);

  useEffect(() => {
    // When question advances, reset feedback, drop state
    setAfterDrop(false);
    setDroppedIdx(null);
    setFeedback("");
    if (questions.length && qIdx >= questions.length) {
      setDone(true);
    }
  }, [qIdx, questions.length]);

  useEffect(() => {
    // When question changes, set its options to state.
    if (questions.length > qIdx) {
      setOptions(questions[qIdx]?.options);
    }
  }, [qIdx, questions]);

  if (loading) {
    return (
      <div className="container">
        <h2>Loading Character-Movie Match…</h2>
      </div>
    );
  }
  if (done) {
    return (
      <div className="container">
        <h2>Quiz Complete!</h2>
        <div>Your Score: {score} / {questions.length}</div>
        <button
          className="btn btn-large"
          onClick={() =>
            navigate("/result", {
              state: { score, total: questions.length },
            })
          }
        >
          See Full Results
        </button>
      </div>
    );
  }
  if (!questions.length) {
    return (
      <div className="container">
        <h2>No quiz data available!</h2>
      </div>
    );
  }

  // For current question
  const question = questions[qIdx];
  // Optionally make sure clue is only picked once
  const clue = question.clue;

  // Handlers for drag and drop
  function handleDragStart(e) {
    e.dataTransfer.setData("clue", clue);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(idx, e) {
    e.preventDefault();
    if (afterDrop) return; // Only allow one drop
    setAfterDrop(true);
    setDroppedIdx(idx);

    const chosen = options[idx];
    if (chosen.isCorrect) {
      setScore((sc) => sc + 1);
      setFeedback("🎉 Correct! Drag the clue to continue.");
      setTimeout(() => setQIdx(qIdx + 1), 1000);
    } else {
      setFeedback("❌ Not correct. That poster is not the match!");
    }
  }
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function handleNext() {
    setQIdx(qIdx + 1);
  }

  // === UI output ===
  return (
    <div className="container" style={{ maxWidth: 670, marginTop: 44 }}>
      <BackButton />
      <div style={{ marginBottom: 12 }}>
        <span className="subtitle" style={{ color: "#fc03e8" }}>
          Character-Movie Match: Q{qIdx + 1} / {questions.length}
        </span>
      </div>
      <div style={{
        background: "#0a0000",
        color: "#f5f4f0",
        fontWeight: 600,
        border: "2px solid #fc03e8",
        borderRadius: 10,
        padding: "16px 24px",
        marginBottom: 20,
        fontSize: 17
      }}>
        <span>
          Drag the <span style={{ color: "#fc03e8" }}>character clue</span> below onto the correct movie poster!
        </span>
        <br />
        <span style={{ fontSize: 15, color: "#fc03e8" }}>
          Tip: Each poster shows a different movie. Can you match the character to their film?
        </span>
      </div>
      {/* Draggable Character Name */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        {!afterDrop && (
          <div
            draggable
            onDragStart={handleDragStart}
            style={{
              fontSize: 26,
              padding: "18px 44px",
              background: "#fc03e8",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(252,3,232,0.23)",
              fontWeight: 700,
              cursor: "grab",
              userSelect: "none",
              transition: "transform .18s",
            }}
            aria-label="Draggable character clue"
          >
            {clue}
          </div>
        )}
        {afterDrop && (
          <div
            style={{
              fontSize: 24,
              padding: "14px 30px",
              background: "#ccc",
              color: "#999",
              borderRadius: 12,
              fontWeight: 500,
              opacity: 0.6,
              userSelect: "none",
            }}
            aria-label="Clue already dropped"
          >
            {clue}
          </div>
        )}
      </div>
      {/* Movie Posters as drop targets */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 26,
          justifyContent: "center",
          alignItems: "end",
          marginBottom: 6,
        }}
      >
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            onDrop={(e) => handleDrop(idx, e)}
            onDragOver={handleDragOver}
            style={{
              border: `3.5px solid ${
                afterDrop && droppedIdx === idx
                  ? (opt.isCorrect ? "#0afc76" : "#fc0361")
                  : "#fc03e8"
              }`,
              borderRadius: 18,
              boxShadow: "0 0 13px #fc03e8a0",
              width: 144,
              marginBottom: 4,
              background: afterDrop && droppedIdx === idx
                ? (opt.isCorrect ? "#0fc87518" : "#fc036118")
                : "#191a24",
              cursor: afterDrop ? "not-allowed" : "pointer",
              opacity: afterDrop && droppedIdx !== idx ? 0.48 : 1,
              position: "relative"
            }}
            aria-label={`Movie poster for ${opt.title}`}
          >
            <img
              src={getTmdbImageUrl(opt.poster, "w342")}
              alt={opt.title}
              style={{
                width: 144,
                height: 216,
                objectFit: "cover",
                borderRadius: 16,
                filter: afterDrop && (!opt.isCorrect && droppedIdx === idx)
                  ? "grayscale(87%) blur(1.6px)"
                  : "none",
                transition: "filter .23s",
                userSelect: "none",
                pointerEvents: "none"
              }}
              draggable={false}
            />
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#f5f4f0",
                background: "#fc03e8e6",
                padding: "5px 5px 3px 5px",
                borderRadius: "0 0 14px 14px",
                textAlign: "center",
                position: "absolute",
                width: "136px",
                left: 0,
                bottom: 0,
                margin: "0 4px",
              }}
            >
              {opt.title}
            </div>
            {/* Show correct/incorrect checkmark after drop */}
            {afterDrop && droppedIdx === idx && (
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  fontSize: 38,
                  color: opt.isCorrect ? "#0afc76" : "#fc0361",
                  filter: "drop-shadow(0 2px 3px #222)",
                  zIndex: 4
                }}
                role="img"
                aria-label={opt.isCorrect ? "Correct" : "Incorrect"}
              >
                {opt.isCorrect ? "✓" : "✗"}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Feedback and Next */}
      <div style={{
        margin: "25px 0 2px 0", minHeight: 36,
        color: afterDrop
          ? (droppedIdx !== null && options[droppedIdx]?.isCorrect ? "#0afc76" : "#fc0361")
          : "#f5f4f0",
        fontWeight: 600,
        fontSize: 18
      }}>
        {feedback}
      </div>
      {afterDrop && (
        <div>
          {(qIdx < questions.length - 1) ? (
            <button className="btn btn-large"
              style={{ background: "#fc03e8", color: "#fff", marginTop: 10 }}
              onClick={handleNext}
            >Next Question</button>
          ) : (
            <button className="btn btn-large"
              style={{ background: "#fc03e8", color: "#fff", marginTop: 10 }}
              onClick={() => setDone(true)}
            >See Results</button>
          )}
        </div>
      )}
    </div>
  );
}
