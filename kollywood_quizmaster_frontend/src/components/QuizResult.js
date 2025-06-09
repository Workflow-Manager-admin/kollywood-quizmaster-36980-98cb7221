import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

/**
 * PUBLIC_INTERFACE
 * Result and summary screen shared for all game modes in Kollywood QuizMaster.
 */
export default function QuizResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const score = location.state?.score || 0;
  const total = location.state?.total || 10;

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 70 }}>
      <BackButton label="Back to Quiz" />
      <h2 style={{ color: "#fc03e8", marginBottom: 22 }}>Quiz Complete!</h2>
      <div style={{ fontWeight: 600, fontSize: 32, marginBottom: 12, color: "#0a0000", background: "#f5f4f0", borderRadius: 12, padding: 18 }}>
        {score} / {total}
      </div>
      <div style={{ color: "#f5f4f0", marginBottom: 28, fontSize: 17 }}>
        {score === total
          ? "Incredible! You're a Kollywood Genius! 🎉"
          : score > total * 0.7
            ? "Great job! Try for a perfect score next time."
            : "Keep practicing for Kollywood stardom!"}
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <button className="btn btn-large" style={{ background: "#fc03e8", color: "#fff" }} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
        <button className="btn btn-large" style={{ background: "#a1a1a1", color: "#fff" }} onClick={() => navigate(0)}>
          Play Again
        </button>
      </div>
    </div>
  );
}
