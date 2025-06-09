import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

/**
 * PUBLIC_INTERFACE
 * Login page for Kollywood QuizMaster. Simple username login (no password backend, mock for MVP).
 */
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) {
      setErr("Please enter a username");
      return;
    }
    login(username.trim());
    navigate("/dashboard");
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 120 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--base-dark, #00008b)",
          borderRadius: 12,
          boxShadow: "0 2px 14px 0 rgba(0,0,0,0.12)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h2 style={{ color: "#fc03e8", marginBottom: 10 }}>Kollywood QuizMaster</h2>
        <label htmlFor="username" style={{ color: "#f5f4f0" }}>
          Enter your name to play
        </label>
        <input
          id="username"
          placeholder="Your name"
          value={username}
          style={{
            padding: "10px",
            border: "1px solid #fc03e8",
            borderRadius: 6,
            fontSize: 16,
          }}
          onChange={e => setUsername(e.target.value)}
          autoFocus
        />
        {err && <div style={{ color: "red" }}>{err}</div>}
        <button className="btn btn-large" style={{ background: "#fc03e8" }}>
          Play Now
        </button>
      </form>
    </div>
  );
}
