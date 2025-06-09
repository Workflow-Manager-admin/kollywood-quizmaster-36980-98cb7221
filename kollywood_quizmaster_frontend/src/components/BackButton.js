import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * BackButton: Consistently styled reusable button to navigate to the previous page
 * Used in all Kollywood QuizMaster game modes.
 */
export default function BackButton({ style = {}, label = "Back" }) {
  const navigate = useNavigate();
  return (
    <button
      className="btn"
      style={{
        background: "#1A1A1A",
        color: "#fc03e8",
        border: "2px solid #fc03e8",
        borderRadius: 8,
        fontWeight: 600,
        padding: "6px 22px",
        fontSize: 16,
        marginBottom: 20,
        marginRight: "auto",
        marginTop: 0,
        ...style,
      }}
      onClick={() => navigate(-1)}
      aria-label="Back"
      type="button"
    >
      <span aria-hidden="true" style={{ fontWeight: 600, marginRight: 9 }}>←</span>
      {label}
    </button>
  );
}
