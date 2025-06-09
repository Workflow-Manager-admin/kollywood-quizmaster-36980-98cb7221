import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails, getTmdbImageUrl } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Character-Movie Match: Drag the character name clue onto the correct movie poster.
 * Features 5 moderate questions per game session.
 *
 * Robustly initializes the quiz, ensures question generation, and properly transitions from loading to quiz play or error on failure.
 */
export default function CharacterMovieMatch() {
  const [questions, setQuestions] = useState(null); // null (not loaded), [] (failed), or [question...]
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [clueStates, setClueStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      setQuestions(null);
      setError("");
      setQIdx(0);
      setScore(0);
      setDone(false);

      try {
        // Static fallback pool: known Tamil movies/characters/posters
        const FALLBACK_CHAR_MOVIE_POOL = [
          {
            characterName: "Arunachalam",
            movieId: 9736,
            poster: "/tQotpWimZTrUfxkbLaYGhvIfVvQ.jpg",
            title: "Arunachalam",
          },
          {
            characterName: "Chitti",
            movieId: 74812,
            poster: "/5PL6mDfQW2LaxhUJQ6nU5zTh0ac.jpg",
            title: "Enthiran",
          },
          {
            characterName: "Vasool Raja",
            movieId: 236115,
            poster: "/8kE6pHKH5qdXZ0HBPwIp6uo1JiV.jpg",
            title: "Vasool Raja MBBS",
          },
          {
            characterName: "Duraisingam",
            movieId: 36586,
            poster: "/jHSPf4JkA7tnO4STPuxtuX2tZ1N.jpg",
            title: "Singam",
          },
          {
            characterName: "Thamizhselvan",
            movieId: 41384,
            poster: "/zFl30L7cWt1Aag2zqLN4M9Ch5nw.jpg",
            title: "Iruvar",
          },
          {
            characterName: "Remo",
            movieId: 407709,
            poster: "/s4p6zCyvQ3xBou1d1u9hTflU2WX.jpg",
            title: "Remo",
          },
          {
            characterName: "Muralishwaran",
            movieId: 78574,
            poster: "/98XxiU8negEeGph4dWlevFIPEKV.jpg",
            title: "Kushi",
          },
          {
            characterName: "Nallasivam",
            movieId: 61020,
            poster: "/vGcH4FfW3JNIokX4OVtwN8pH0eU.jpg",
            title: "Anbe Sivam",
          },
          {
            characterName: "Velu Naicker",
            movieId: 20666,
            poster: "/qlfIYYQJv8DGE6Btfk9QAZfV1XI.jpg",
            title: "Nayakan",
          },
          {
            characterName: "Super Subramani",
            movieId: 86777,
            poster: "/n8j3iQKDexBdBAqCJQxm00rt1k8.jpg",
            title: "Boss Engira Bhaskaran",
          },
          {
            characterName: "Saroja",
            movieId: 145106,
            poster: "/eZy5jp2ftGddbRZTsaaQeIMN9vr.jpg",
            title: "Saroja",
          },
          {
            characterName: "Kaali",
            movieId: 38148,
            poster: "/lY5UfP8UOoVBVcB4J0gta78A7zb.jpg",
            title: "Kaali",
          },
          {
            characterName: "Manickam",
            movieId: 15793,
            poster: "/jMuask0aXkQoaJ2kA316N0qI4sm.jpg",
            title: "Baashha",
          },
          {
            characterName: "Kumudha",
            movieId: 31752,
            poster: "/szHCbEMbZ1kB7lpyT2tV4AvbwHK.jpg",
            title: "Sillunu Oru Kaadhal",
          },
          {
            characterName: "Parattai",
            movieId: 102068,
            poster: "/wospfgZ4LV0e4pb1dlRJ1IkhT4w.jpg",
            title: "16 Vayathinile",
          },
          {
            characterName: "Shankar",
            movieId: 23967,
            poster: "/xtEA1zXUUQmQ2Oyxo3urQgolu2d.jpg",
            title: "Jeans",
          },
          {
            characterName: "Iyarkkai",
            movieId: 49982,
            poster: "/sQ1iEFpr8e0QHHJbcaCsHmt7tjg.jpg",
            title: "Iyarkkai",
          },
          {
            characterName: "Kokki Kumar",
            movieId: 40089,
            poster: "/ggQqzGq3F3zDbMTmyTtZYpYdHV2.jpg",
            title: "Pudhupettai",
          },
          {
            characterName: "Auto Raja",
            movieId: 88903,
            poster: "/nmhN3fQ1D0w2mh7Zy8y3nSQPQQF.jpg",
            title: "Auto Raja",
          },
          {
            characterName: "Sathyamoorthy",
            movieId: 24865,
            poster: "/sJK3A3zjbvGcEu95H96A95F4AVc.jpg",
            title: "Aboorva Sagodharargal",
          }
        ];

        // Step 1: Try to gather character-movie pairs from TMDB API
        let charMoviePool = [];
        let checkedMovieIds = new Set();
        let tries = 0;

        for (let page = 1; page < 7 && charMoviePool.length < 20 && tries < 80; page++, tries++) {
          try {
            const resp = await fetchTamilMovies({ page: (Math.floor(Math.random() * 7) + 1) });
            let movies = (resp.results || []).filter(m => m.id && m.title && m.poster_path);
            for (const film of movies) {
              if (checkedMovieIds.has(film.id)) continue;
              checkedMovieIds.add(film.id);
              try {
                const details = await fetchMovieDetails(film.id);
                const cast = (details.credits?.cast || []).filter(c => !!c.character);
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
              } catch {}
              if (charMoviePool.length >= 20) break;
            }
          } catch {}
          if (charMoviePool.length >= 20) break;
        }

        // Step 2: Supplement pool with fallback if not enough pairs found
        if (charMoviePool.length < 12) {
          // Add only new/unseen pairs from fallback.
          const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
          let takenSoFar = new Set(charMoviePool.map(
            e => `${e.characterName?.toLowerCase()?.trim() || ""}::${e.title?.toLowerCase()?.trim() || ""}`
          ));
          let poolAdd = shuffle(FALLBACK_CHAR_MOVIE_POOL).filter(e =>
            !takenSoFar.has(`${e.characterName.toLowerCase().trim()}::${e.title.toLowerCase().trim()}`)
          );
          for (let i = 0; charMoviePool.length < 20 && i < poolAdd.length; ++i) {
            charMoviePool.push(poolAdd[i]);
          }
        }

        // Step 3: If for any reason still not enough, use fallback entirely
        if (charMoviePool.length < 10) {
          charMoviePool = [...FALLBACK_CHAR_MOVIE_POOL];
        }

        // Step 4: Shuffle pool so we get randomness
        charMoviePool = charMoviePool.sort(() => 0.5 - Math.random());

        // Step 5: Build questions (2 pairs per question, 5 rounds)
        const numQuestions = 5;
        const pairsPerQuestion = 2;
        let usedCharMoviePairs = new Set();
        let usedMovieIds = new Set();
        let usedCharacterNames = new Set();
        let usedClues = new Set();

        let questionsArr = [];
        let availablePairs = [...charMoviePool];
        let maxTries = 30;
        for (let qIdxInner = 0; qIdxInner < numQuestions; qIdxInner++) {
          let cluesForThisRound = [];
          let triesLocal = 0;

          while (
            cluesForThisRound.length < pairsPerQuestion && triesLocal < maxTries
          ) {
            const pairIdx = availablePairs.findIndex(
              p =>
                !usedCharMoviePairs.has(`${p.movieId}::${p.characterName}`) &&
                !usedMovieIds.has(p.movieId) &&
                !usedCharacterNames.has(p.characterName)
            );
            if (pairIdx === -1) break;
            const picked = availablePairs[pairIdx];
            cluesForThisRound.push(picked);
            usedCharMoviePairs.add(`${picked.movieId}::${picked.characterName}`);
            usedMovieIds.add(picked.movieId);
            usedCharacterNames.add(picked.characterName);
            usedClues.add(`${picked.characterName}::${picked.movieId}`);
            triesLocal++;
          }

          if (cluesForThisRound.length < pairsPerQuestion) break;

          let qItemArray = [];
          for (let j = 0; j < cluesForThisRound.length; j++) {
            const real = cluesForThisRound[j];
            let decoyOpts = [];
            let decoyTry = 0;
            for (
              let k = 0;
              decoyOpts.length < 2 && decoyTry < availablePairs.length * 2;
              k++, decoyTry++
            ) {
              const dIdx = (k + Math.floor(Math.random() * availablePairs.length)) % availablePairs.length;
              const decoy = availablePairs[dIdx];
              if (
                !usedCharMoviePairs.has(`${decoy.movieId}::${decoy.characterName}`) &&
                !usedMovieIds.has(decoy.movieId) &&
                !usedCharacterNames.has(decoy.characterName) &&
                !usedClues.has(`${decoy.characterName}::${decoy.movieId}`) &&
                decoy.movieId !== real.movieId &&
                decoy.characterName !== real.characterName &&
                !decoyOpts.find(
                  e =>
                    e.movieId === decoy.movieId ||
                    e.characterName === decoy.characterName
                )
              ) {
                decoyOpts.push(decoy);
              }
            }
            if (decoyOpts.length < 2) break;

            decoyOpts.forEach(d =>
              usedCharMoviePairs.add(`${d.movieId}::${d.characterName}`)
            );
            decoyOpts.forEach(d => usedMovieIds.add(d.movieId));
            decoyOpts.forEach(d => usedCharacterNames.add(d.characterName));
            decoyOpts.forEach(d =>
              usedClues.add(`${d.characterName}::${d.movieId}`)
            );

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
          if (qItemArray.length < pairsPerQuestion) break;
          questionsArr.push(qItemArray);
        }

        if (!abort) {
          if (questionsArr.length > 0) {
            setQuestions(questionsArr);
          } else {
            // Should never occur due to fallback logic above, but just in case
            setQuestions([]);
            setError("Sorry, couldn't generate sufficient quiz questions. Please try again.");
          }
          setLoading(false);
        }
      } catch (err) {
        if (!abort) {
          setQuestions([]);
          setError("Unexpected error: Could not load quiz. Please refresh or contact support!");
          setLoading(false);
        }
      }
    }
    load();
    return () => { abort = true; };
  }, []);

  // Track per-clue states for each multi-clue question
  useEffect(() => {
    // Reset clue states when qIdx/ questions update, and quiz not loading or errored.
    if (
      questions &&
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
  if (questions && Array.isArray(questions)) {
    for (const q of questions) totalQuestions += Array.isArray(q) ? q.length : 1;
  }

  // UI rendering
  if (loading) {
    return (
      <div className="container">
        <h2>Loading Character-Movie Match…</h2>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container" style={{ marginTop: 80, color: "#fc0361", fontWeight: 600 }}>
        <h2>Unable to Start Game</h2>
        <div style={{ margin: "18px 0" }}>{error}</div>
        <button className="btn" style={{ background: "#fc03e8", color: "#fff" }} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
  if (!questions || !questions.length) {
    return (
      <div className="container">
        <h2>No questions generated.</h2>
        <div style={{ margin: "12px 0" }}>
          The quiz couldn't be set up. Please try again.
        </div>
        <button className="btn" style={{ background: "#fc03e8", color: "#fff" }} onClick={() => window.location.reload()}>
          Reload Game
        </button>
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
