import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails, getTmdbImageUrl } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Character-Movie Match: Drag the character name clue onto the correct movie poster.
 * Features 5 moderate questions per game session.
 *
 * **Improved logic:**
 * - Ensures EACH character-movie pair appears only once per session
 * - No movie or character clue is reused as a choice or clue in any subsequent round
 * - No repeating of clues/options within a question
 * - No poster appears more than once per question/quiz
 */
export default function CharacterMovieMatch() {
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [clueStates, setClueStates] = useState([]);

  const navigate = useNavigate();

  // Utility: Builds quiz questions with fully unique character-movie pairs and distractors across the whole session
  useEffect(() => {
    async function load() {
      setQuestions([]);
      setQIdx(0);
      setScore(0);
      setDone(false);

      // Step 1: Build a big flat pool of unique character-movie pairs from many movies
      let charMoviePool = [];
      let checkedMovieIds = new Set();
      let tries = 0;
      // Aim for 18-24 movies
      for (let page = 1; page < 7 && charMoviePool.length < 20 && tries < 70; page++, tries++) {
        try {
          const resp = await fetchTamilMovies({ page: (Math.floor(Math.random() * 7) + 1) });
          let movies = (resp.results || []).filter(m => m.id && m.title && m.poster_path);
          for (const film of movies) {
            if (checkedMovieIds.has(film.id)) continue;
            checkedMovieIds.add(film.id);
            try {
              const details = await fetchMovieDetails(film.id);
              const cast = (details.credits?.cast || []).filter(c => !!c.character);
              // Only characters with ok names, not boring names like "Self"
              const chars = cast
                .map(c => c.character)
                .filter(ch =>
                  ch.length > 1 &&
                  !/^himself|herself|themselves|self|guest|appearance|man|woman|boy|girl$/i.test(
                    ch.trim()
                  )
                );
              for (const ch of chars) {
                if (ch.length < 2) continue;
                // Pair each unique character+movie only once
                if (
                  !charMoviePool.find(
                    e => e.movieId === film.id && e.characterName.toLowerCase() === ch.toLowerCase()
                  )
                ) {
                  charMoviePool.push({
                    characterName: ch,
                    movieId: film.id,
                    poster: film.poster_path,
                    title: film.title,
                  });
                }
                if (charMoviePool.length >= 20) break;
              }
            } catch { }
            if (charMoviePool.length >= 20) break;
          }
        } catch { }
        if (charMoviePool.length >= 20) break;
      }

      // Step 2: Shuffle pool so we get randomness
      charMoviePool = charMoviePool.sort(() => 0.5 - Math.random());

      // Step 3: Build questions for the quiz (2 clues/questions per round, 5 rounds = 10 pairs)
      // Goal: Each [character+movie] used ONCE only (as clue/correct/choice/decoy), no repeats anywhere per session
      const numQuestions = 5; // rounds
      const pairsPerQuestion = 2;
      let usedCharMoviePairs = new Set(); // e.g. "movieId::character"
      let usedMovieIds = new Set(); // no poster reused as option/decoy
      let usedCharacterNames = new Set();
      let usedClues = new Set(); // all clues appeared so far

      let questionsArr = [];
      let availablePairs = [...charMoviePool];

      // Try up to maxTries for each question to build non-repeating clues/options
      let maxTries = 30;
      for (let qIdxInner = 0; qIdxInner < numQuestions; qIdxInner++) {
        let questionSet = [];
        let cluesForThisRound = [];
        let triesLocal = 0;

        while (
          cluesForThisRound.length < pairsPerQuestion && triesLocal < maxTries
        ) {
          // Pick a char-movie pair, not used anywhere yet as a clue/correct/option/decoy
          const pairIdx = availablePairs.findIndex(
            p =>
              !usedCharMoviePairs.has(`${p.movieId}::${p.characterName}`) &&
              !usedMovieIds.has(p.movieId) &&
              !usedCharacterNames.has(p.characterName)
          );
          if (pairIdx === -1) break;
          const picked = availablePairs[pairIdx];
          cluesForThisRound.push(picked);
          // Mark for global no-reuse
          usedCharMoviePairs.add(`${picked.movieId}::${picked.characterName}`);
          usedMovieIds.add(picked.movieId);
          usedCharacterNames.add(picked.characterName);
          usedClues.add(`${picked.characterName}::${picked.movieId}`);
          // Remove this specific pair, but other pairs for unused films could be chosen as distractors for later (unless blocked by usedMovieIds)
        }

        // If not enough clues for this round, quit
        if (cluesForThisRound.length < pairsPerQuestion) break;

        // For each clue, pick decoy options (unused movies/posters, not used in any clue or option so far globally)
        let qItemArray = [];
        for (let j = 0; j < cluesForThisRound.length; j++) {
          const real = cluesForThisRound[j];
          // Decoys: 2 unused char-movie pairs where movie and char both not used globally
          let decoyOpts = [];
          let decoyTry = 0;
          for (
            let k = 0;
            decoyOpts.length < 2 && decoyTry < availablePairs.length * 2;
            k++, decoyTry++
          ) {
            const dIdx = (k + Math.floor(Math.random() * availablePairs.length)) % availablePairs.length;
            const decoy = availablePairs[dIdx];

            // Decoy rules:
            // -- Do not repeat character, movie, or clue used anywhere before in session (incl. correct answers and other decoys)
            if (
              !usedCharMoviePairs.has(`${decoy.movieId}::${decoy.characterName}`) &&
              !usedMovieIds.has(decoy.movieId) &&
              !usedCharacterNames.has(decoy.characterName) &&
              !usedClues.has(`${decoy.characterName}::${decoy.movieId}`) &&
              decoy.movieId !== real.movieId &&
              decoy.characterName !== real.characterName &&
              // Must not already be added as decoy for this clue
              !decoyOpts.find(
                e =>
                  e.movieId === decoy.movieId ||
                  e.characterName === decoy.characterName
              )
            ) {
              decoyOpts.push(decoy);
            }
          }
          // If not enough decoys, skip this clue round
          if (decoyOpts.length < 2) break;

          // Mark decoy pairs as used
          decoyOpts.forEach(d =>
            usedCharMoviePairs.add(`${d.movieId}::${d.characterName}`)
          );
          decoyOpts.forEach(d => usedMovieIds.add(d.movieId));
          decoyOpts.forEach(d => usedCharacterNames.add(d.characterName));
          decoyOpts.forEach(d =>
            usedClues.add(`${d.characterName}::${d.movieId}`)
          );

          // Options: correct + 2 decoys, shuffled
          const opts = [
            {
              id: real.movieId,
              title: real.title,
              poster: real.poster,
              isCorrect: true,
            },
            ...decoyOpts.map(dc => ({
              id: dc.movieId,
              title: dc.title,
              poster: dc.poster,
              isCorrect: false,
            })),
          ].sort(() => 0.5 - Math.random());

          qItemArray.push({
            clue: real.characterName,
            correctMovieId: real.movieId,
            options: opts,
          });
        }

        // If we built enough options for this round, commit the question; otherwise, break (end of possible unique rounds)
        if (qItemArray.length < pairsPerQuestion) break;
        questionsArr.push(qItemArray);
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
