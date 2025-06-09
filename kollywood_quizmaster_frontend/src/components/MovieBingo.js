import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Movie Bingo quiz: select movies that meet given categories (e.g., award, genre).
 */
const BINGO_CATEGORIES = [
  { key: "Action", clue: "Movie with Action genre" },
  { key: "Comedy", clue: "Movie with Comedy genre" },
  { key: "Romance", clue: "Romance flick" },
  { key: "Award", clue: "Nominated or won an award" },
  { key: "Classic", clue: "Released before 2000" },
  { key: "Blockbuster", clue: "Popular/top grossing" },
  { key: "Family", clue: "Family-friendly" },
  { key: "Thriller", clue: "Thriller genre" },
  { key: "Debut", clue: "Actor/Actress debut" },
];

export default function MovieBingo() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState({});
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      // Fetch a pool of tamil movies and randomize
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 7) + 1 });
      setMovies(resp.results?.slice(0, 16) || []);
    }
    load();
  }, []);

  function pickMovie(catIdx, movieId) {
    setSelected({
      ...selected,
      [catIdx]: movieId,
    });
  }

  function finish() {
    // Score: how many different genres/categories matched by title
    setScore(Object.keys(selected).length);
    setDone(true);
  }

  if (!movies.length) {
    return (
      <div className="container">
        <h2>Loading Bingo…</h2>
      </div>
    );
  }
  if (done) {
    return (
      <div className="container">
        <h2>Bingo Complete!</h2>
        <div>
          You filled {Object.keys(selected).length} category{Object.keys(selected).length > 1 ? "ies" : "y"}!
        </div>
        <button className="btn btn-large" onClick={() => navigate("/result", { state: { score, total: BINGO_CATEGORIES.length } })}>
          See Full Results
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: 44 }}>
      <BackButton />
      <h2 className="subtitle" style={{ color: "#fc03e8" }}>
        Movie Bingo (Pick a movie for each category)
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, margin: "24px 0" }}>
        {BINGO_CATEGORIES.map((cat, idx) => (
          <div key={cat.key} style={{
            border: "2px solid #fc03e8",
            borderRadius: 10,
            padding: 12,
            background: "#0a0000",
            minWidth: 180,
            flex: "1 1 180px",
          }}>
            <div style={{ fontWeight: 700, color: "#f5f4f0", fontSize: 16, marginBottom: 8 }}>{cat.key}</div>
            <div style={{ color: "#fc03e8", fontSize: 13, marginBottom: 8 }}>{cat.clue}</div>
            <select
              value={selected[idx] || ""}
              style={{
                width: "96%",
                padding: "7px 4px",
                borderRadius: 6,
                border: "1px solid #fc03e8",
                fontSize: 15,
              }}
              onChange={e => pickMovie(idx, e.target.value)}
            >
              <option value="">--Pick Movie--</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button className="btn btn-large" style={{ background: "#fc03e8", color: "#fff" }} onClick={finish}>
        Finish Bingo
      </button>
    </div>
  );
}
