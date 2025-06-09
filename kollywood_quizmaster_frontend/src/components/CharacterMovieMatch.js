import React, { useState, useEffect } from "react";
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
  const [done, setDone] = useState(false);
  const [clueStates, setClueStates] = useState([]);

  const navigate = useNavigate();

  // Utility: Find N unique clues and options per question (with distinct characters & posters)
  useEffect(() => {
    async function load() {
      // Pool of movies with character info
      let poolWithChars = [];
      setQuestions([]);
      setQIdx(0);
      setScore(0);
      setDone(false);

      // Get up to 14 random Tamil movies with poster and at least 1 valid character
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 7) + 2 });
      let movies = (resp.results || []).filter(m => m.id && m.title && m.poster_path);
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

      // Each "question" will consist of 2 unique character-movie pairs, each with its own options (1 correct + 2 unique decoys)
      const pairsPerQuestion = 2;
      const questionsArr = [];
      for (let k = 0; k < 5 && poolWithChars.length >= pairsPerQuestion + 2; k++) {
        // Pick N unique real movies (no repeats per question)
        let chosenMovies = [];
        let blacklist = new Set();
        // Shuffle pool for fair sampling
        const shuffled = [...poolWithChars].sort(() => 0.5 - Math.random());
        for (let i = 0, tryCt = 0; (chosenMovies.length < pairsPerQuestion && tryCt < 15); i = (i + 1) % shuffled.length, tryCt++) {
          const movie = shuffled[i];
          if (chosenMovies.find(m => m.movieId === movie.movieId)) continue;
          // Get character not used already in this question
          const availChars = movie.characterNames.filter(
            (char) => !blacklist.has(`${movie.movieId}::${char}`)
          );
          if (!availChars.length) continue;
          const char = availChars[Math.floor(Math.random() * availChars.length)];
          blacklist.add(`${movie.movieId}::${char}`);
          chosenMovies.push({ ...movie, clueChar: char });
        }
        // Ensure correct number found
        if (chosenMovies.length < pairsPerQuestion) break;

        // For each real movie/character, build options: correct + 2 decoys (not from chosen)
        let allUsedMovieIds = new Set(chosenMovies.map(m => m.movieId));
        let cluesAndOptions = [];
        for (let j = 0; j < pairsPerQuestion; j++) {
          const real = chosenMovies[j];
          const decoys = poolWithChars
            .filter(m => !allUsedMovieIds.has(m.movieId))
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
          decoys.forEach(d => allUsedMovieIds.add(d.movieId));
          const opts = [
            {
              id: real.movieId,
              title: real.title,
              poster: real.poster,
              isCorrect: true
            },
            ...decoys.map(dc => ({
              id: dc.movieId,
              title: dc.title,
              poster: dc.poster,
              isCorrect: false
            }))
          ].sort(() => 0.5 - Math.random());
          cluesAndOptions.push({
            clue: real.clueChar,
            correctMovieId: real.movieId,
            options: opts
          });
        }
        questionsArr.push(cluesAndOptions);
      }
      setQuestions(questionsArr);
    }
    load();
  }, []);

  // Track per-clue states for each multi-clue question
  useEffect(() => {
    // Always set clueStates array whenever qIdx or questions changes
    if (
      Array.isArray(questions[qIdx]) &&
      questions[qIdx]
    ) {
      setClueStates(
        questions[qIdx].map(() => ({
          afterDrop: false,
          droppedIdx: null,
          feedback: "",
        }))
      );
    } else {
      setClueStates([]);
    }
  }, [qIdx, questions]);

  // Handler for clue drag
  function handleDragStart(i, e) {
    e.dataTransfer.setData("clueIdx", String(i));
    e.dataTransfer.effectAllowed = "move";
  }

  // Handler for option drop
  function handleDrop(clueIdx, optIdx, e) {
    e.preventDefault();
    if (!clueStates[clueIdx] || clueStates[clueIdx].afterDrop) return;
    const group = questions[qIdx];
    const chosen = group[clueIdx].options[optIdx];
    const newClueStates = clueStates.map((state, idx) =>
      idx !== clueIdx
        ? state
        : {
            afterDrop: true,
            droppedIdx: optIdx,
            feedback: chosen.isCorrect
              ? "🎉 Correct! Drag the remaining clues to continue."
              : "❌ Not correct. That poster is not the match!",
          }
    );
    setClueStates(newClueStates);
    if (chosen.isCorrect) setScore((sc) => sc + 1);

    // If all clues dropped, auto-next after delay
    if (newClueStates.every((st) => st.afterDrop)) {
      setTimeout(() => {
        if (qIdx < questions.length - 1) setQIdx(qIdx + 1);
        else setDone(true);
      }, 1200);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  // Calculate number of clues/questions for score display at end
  let totalQuestions = 0;
  for (const q of questions) totalQuestions += Array.isArray(q) ? q.length : 1;

  // UI rendering
  if (!questions.length) {
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
        <div>Your Score: {score} / {totalQuestions}</div>
        <button
          className="btn btn-large"
          onClick={() =>
            navigate("/result", {
              state: { score, total: totalQuestions },
            })
          }
        >
          See Full Results
        </button>
      </div>
    );
  }

  const group = questions[qIdx]; // Array of {clue, correctMovieId, options}

  return (
    <div className="container" style={{ maxWidth: 700, marginTop: 44 }}>
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
          Tip: Each poster shows a different movie. Can you match each character to their film?
        </span>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        justifyContent: "center"
      }}>
        {group.map((qobj, clueIdx) => (
          <div key={`${qobj.clue}_grp${qIdx}_clue${clueIdx}`}>
            {/* Draggable Character Name (only name) */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              {!clueStates[clueIdx]?.afterDrop && (
                <div
                  draggable
                  onDragStart={e => handleDragStart(clueIdx, e)}
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
                  {qobj.clue}
                </div>
              )}
              {clueStates[clueIdx]?.afterDrop && (
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
                  {qobj.clue}
                </div>
              )}
            </div>
            {/* Posters group for this clue */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 22,
                justifyContent: "center",
                alignItems: "end",
                marginBottom: 6,
              }}
            >
              {qobj.options.map((opt, optIdx) => (
                <div
                  key={opt.id}
                  onDrop={e => handleDrop(clueIdx, optIdx, e)}
                  onDragOver={handleDragOver}
                  style={{
                    border: `3.5px solid ${
                      clueStates[clueIdx]?.afterDrop && clueStates[clueIdx]?.droppedIdx === optIdx
                        ? (opt.isCorrect ? "#0afc76" : "#fc0361")
                        : "#fc03e8"
                    }`,
                    borderRadius: 18,
                    boxShadow: "0 0 13px #fc03e8a0",
                    width: 136,
                    marginBottom: 4,
                    background: clueStates[clueIdx]?.afterDrop && clueStates[clueIdx]?.droppedIdx === optIdx
                      ? (opt.isCorrect ? "#0fc87518" : "#fc036118")
                      : "#191a24",
                    cursor: clueStates[clueIdx]?.afterDrop ? "not-allowed" : "pointer",
                    opacity: clueStates[clueIdx]?.afterDrop && clueStates[clueIdx]?.droppedIdx !== optIdx ? 0.52 : 1,
                    position: "relative"
                  }}
                  aria-label={`Movie poster for ${opt.title}`}
                >
                  <img
                    src={getTmdbImageUrl(opt.poster, "w342")}
                    alt={opt.title}
                    style={{
                      width: 136,
                      height: 210,
                      objectFit: "cover",
                      borderRadius: 15,
                      filter: clueStates[clueIdx]?.afterDrop &&
                        (!opt.isCorrect && clueStates[clueIdx]?.droppedIdx === optIdx)
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
                      width: "122px",
                      left: 0,
                      bottom: 0,
                      margin: "0 7px",
                    }}
                  >
                    {opt.title}
                  </div>
                  {clueStates[clueIdx]?.afterDrop && clueStates[clueIdx]?.droppedIdx === optIdx && (
                    <span
                      style={{
                        position: "absolute",
                        top: 7,
                        right: 8,
                        fontSize: 32,
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
            <div style={{
              margin: "10px 0 18px 0", minHeight: 32,
              color: clueStates[clueIdx]?.afterDrop
                ? (qobj.options[clueStates[clueIdx]?.droppedIdx]?.isCorrect ? "#0afc76" : "#fc0361")
                : "#f5f4f0",
              fontWeight: 600,
              fontSize: 17
            }}>
              {clueStates[clueIdx]?.feedback}
            </div>
          </div>
        ))}
      </div>
      <div style={{ color: "#fc03e8", fontWeight: 700, marginTop: 12, textAlign: "center" }}>
        {clueStates.every(st => st.afterDrop)
          ? "Nice! Moving to next..."
          : "Match all clues before next question."}
      </div>
    </div>
  );
}
