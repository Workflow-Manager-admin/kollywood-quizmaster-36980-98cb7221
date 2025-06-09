import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
/**
 * PUBLIC_INTERFACE
 * Character-Movie Match: Drag character names to the correct movie slots.
 * Features 10 moderate questions per game session.
 */
export default function CharacterMovieMatch() {
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [done, setDone] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // For MVP: simulate quiz data (random tamil movies with character info)
    async function load() {
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 5) + 1 });
      let movies = (resp.results || []).filter(m => m.id && m.title);
      movies = movies.slice(0, 10);
      // Get details for character list
      const questionsArr = await Promise.all(
        movies.map(async film => {
          const details = await fetchMovieDetails(film.id);
          const cast = details.credits?.cast?.slice(0, 5).map(c => c.character) || [];
          return {
            title: film.title,
            id: film.id,
            characters: cast.filter(Boolean),
          };
        })
      );
      // pick 4 movies/questions with enough character data
      const filtered = questionsArr.filter(q => q.characters.length >= 2).slice(0, 4);
      setQuestions(filtered);
      setQIdx(0);
    }
    load();
  }, []);

  if (!questions.length) {
    return (
      <div className="container">
        <h2>Loading quiz…</h2>
      </div>
    );
  }
  if (done) {
    return (
      <div className="container">
        <h2>Quiz Complete!</h2>
        <div>Your Score: {score} / {questions.length}</div>
        <button className="btn btn-large" onClick={() => navigate("/result", { state: { score, total: questions.length } })}>
          See Full Results
        </button>
      </div>
    );
  }

  const movie = questions[qIdx];

  const shuffled = [...movie.characters]
    .sort(() => 0.5 - Math.random());
  // Choose correct movie slot and two decoys (for matching)
  const options = [
    { id: movie.id, title: movie.title },
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `fake${i}`,
      title: `Fake Movie ${i + 1}`,
    })),
  ].sort(() => 0.5 - Math.random());

  function submit(guess) {
    setUserAnswers({
      ...userAnswers,
      [qIdx]: guess,
    });
    const correct = guess === movie.title;
    if (correct) setScore(score + 1);
    if (qIdx === questions.length - 1) setDone(true);
    else setQIdx(qIdx + 1);
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 44 }}>
      <BackButton />
      <div style={{ marginBottom: 16 }}>
        <span className="subtitle" style={{ color: "#fc03e8" }}>
          Character-Movie Match: Q{qIdx + 1} / {questions.length}
        </span>
      </div>
      <div style={{ fontWeight: 600, color: "#f5f4f0" }}>
        For which movie do <span style={{ color: "#fc03e8" }}>{shuffled[0]}</span> and <span style={{ color: "#fc03e8" }}>{shuffled[1]}</span> appear?
      </div>
      <div style={{ margin: "20px 0", display: "flex", gap: 14 }}>
        {options.map(opt => (
          <button
            key={opt.id}
            className="btn"
            style={{
              background: "#fc03e8",
              color: "#fff",
              minWidth: 120,
            }}
            onClick={() => submit(opt.title)}
          >
            {opt.title}
          </button>
        ))}
      </div>
    </div>
  );
}
