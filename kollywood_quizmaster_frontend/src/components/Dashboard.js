import React from "react";
import { Link } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Dashboard/homepage displaying all Kollywood QuizMaster game modes.
 */
export default function Dashboard() {
  const gameModes = [
    {
      path: "/quiz/blurred-poster",
      title: "Blurred Poster Guess",
      desc: "Guess the movie from a blurred poster with clues.",
      emoji: "🖼️",
    },
    {
      path: "/quiz/character-match",
      title: "Character-Movie Match",
      desc: "Match Kollywood character names to their movies.",
      emoji: "🎭",
    },
    {
      path: "/quiz/movie-bingo",
      title: "Movie Bingo",
      desc: "Select movies matching fun categories or genres.",
      emoji: "🔢",
    },
    {
      path: "/quiz/timeline",
      title: "Movie Timeline Challenge",
      desc: "Arrange movies in the order they were released.",
      emoji: "📅",
    },
    {
      path: "/quiz/spin-the-wheel",
      title: "Spin the Wheel",
      desc: "Spin to get actor, actress, year — guess the movie!",
      emoji: "🎰",
    },
    {
      path: "/quiz/cast-combo",
      title: "Cast Combo",
      desc: "Guess the film from an actor duo or spot the odd one out!",
      emoji: "👯",
    },
  ];

  return (
    <div className="container" style={{ maxWidth: 900, marginTop: 60, marginBottom: 32 }}>
      <h1 className="title" style={{ color: "#fc03e8", marginBottom: 28 }}>Choose Your Challenge</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          justifyContent: "center",
        }}
      >
        {gameModes.map((mode) => (
          <Link
            to={mode.path}
            key={mode.path}
            style={{
              textDecoration: "none",
              flex: "0 1 320px",
              background: "#0a0000",
              color: "#fc03e8",
              border: "2px solid #fc03e8",
              borderRadius: 14,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "border .18s",
              minHeight: 170,
            }}
          >
            <span style={{ fontSize: 38, marginBottom: 10 }}>{mode.emoji}</span>
            <div style={{ fontWeight: 700, fontSize: 21, marginBottom: 8, color: "#f5f4f0" }}>
              {mode.title}
            </div>
            <div style={{ fontSize: 15, color: "#fc03e8" }}>{mode.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
