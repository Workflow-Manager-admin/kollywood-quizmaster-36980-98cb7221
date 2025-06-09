import React, { useState, useEffect } from "react";
import { fetchTamilMovies, fetchMovieDetails } from "../tmdbApi";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Movie Timeline Challenge: Drag/arrange movies in order of release year.
 */
export default function MovieTimeline() {
  const [movies, setMovies] = useState([]);
  const [order, setOrder] = useState([]);
  const [inputArr, setInputArr] = useState([]);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch 5 random tamil movies with release dates
    async function load() {
      const resp = await fetchTamilMovies({ page: Math.floor(Math.random() * 10) + 1 });
      let ms = (resp.results || []).slice(0, 6);
      ms = await Promise.all(
        ms.map(async m => {
          const detail = await fetchMovieDetails(m.id);
          return { ...m, year: detail.release_date?.substring(0, 4) || "Unknown" };
        })
      );
      ms = ms.filter(m => m.year !== "Unknown");
      setMovies(ms);
      setOrder(ms.map(m => m.title).sort(() => 0.5 - Math.random()));
      setInputArr([]);
    }
    load();
  }, []);

  function onArrange(idx, dir) {
    const arr = [...order];
    if (
      (dir === "up" && idx === 0) ||
      (dir === "down" && idx === arr.length - 1)
    )
      return;
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
    setOrder(arr);
  }

  function finish() {
    // Score: compare order to actual year order (ascending)
    const corr = [...movies]
      .sort((a, b) => a.year.localeCompare(b.year))
      .map(m => m.title);
    let points = 0;
    for (let i = 0; i < corr.length; i++)
      if (order[i] === corr[i]) points++;
    setScore(points);
    setDone(true);
  }

  if (!movies.length) {
    return (
      <div className="container">
        <h2>Loading Timeline Challenge…</h2>
      </div>
    );
  }
  if (done) {
    return (
      <div className="container">
        <BackButton />
        <h2>Timeline Complete!</h2>
        <div>
          You got {score} out of {movies.length} in correct order!
        </div>
        <button className="btn btn-large" onClick={() => navigate("/result", { state: { score, total: movies.length } })}>
          See Full Results
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: 44, maxWidth: 520 }}>
      <BackButton />
      <h2 className="subtitle" style={{ color: "#fc03e8" }}>
        Arrange the movies in order of release (top=earliest)
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {order.map((title, idx) => (
          <li
            key={title}
            style={{
              padding: "12px 8px",
              background: "#0a0000",
              border: "2px solid #fc03e8",
              color: "#f5f4f0",
              fontWeight: 600,
              borderRadius: 9,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ flex: 1 }}>{title}</span>
            <button className="btn" style={{ background: "#fc03e8" }} onClick={() => onArrange(idx, "up")}>
              ↑
            </button>
            <button className="btn" style={{ background: "#fc03e8" }} onClick={() => onArrange(idx, "down")}>
              ↓
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-large" style={{ background: "#fc03e8", color: "#fff" }} onClick={finish}>
        Check Order
      </button>
    </div>
  );
}
