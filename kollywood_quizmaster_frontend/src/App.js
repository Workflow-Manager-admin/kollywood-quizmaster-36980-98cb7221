import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
} from "react-router-dom";
import "./App.css";
import "./index.css";

// Import dynamic quiz mode pages (to be created below)
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import BlurredPosterQuiz from "./components/BlurredPosterQuiz";
import CharacterMovieMatch from "./components/CharacterMovieMatch";
import MovieBingo from "./components/MovieBingo";
import MovieTimeline from "./components/MovieTimeline";
import SpinTheWheel from "./components/SpinTheWheel";
import CastCombo from "./components/CastCombo";
import QuizResult from "./components/QuizResult";

// Theme colors (from requirements)
const KQTheme = {
  primary: "#0a0000",
  secondary: "#fc03e8",
  accent: "#f5f4f0",
  lightBg: "#fff",
};

const ThemeContext = createContext(KQTheme);

/**
 * PUBLIC_INTERFACE
 * Handles user authentication and provides user context to the app.
 */
export const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * Hook for accessing authentication context in the app.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * PUBLIC_INTERFACE
 * Main container for Kollywood QuizMaster App.
 */
function App() {
  const [user, setUser] = useState(() => {
    // Check if user is stored in localStorage (simple persistence)
    try {
      const stored = localStorage.getItem("kq_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Login handling (mock, no backend, any username)
  function login(username) {
    setUser({ username });
    localStorage.setItem("kq_user", JSON.stringify({ username }));
  }
  function logout() {
    setUser(null);
    localStorage.removeItem("kq_user");
  }

  return (
    <ThemeContext.Provider value={KQTheme}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Router>
          <NavBar />
          <div className="app-main-content" style={{ paddingTop: 70 }}>
            <Routes>
              <Route
                path="/"
                element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
              />
              <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              {/* Quiz Game Mode Routes */}
              <Route
                path="/quiz/blurred-poster"
                element={
                  <RequireAuth>
                    <BlurredPosterQuiz />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz/character-match"
                element={
                  <RequireAuth>
                    <CharacterMovieMatch />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz/movie-bingo"
                element={
                  <RequireAuth>
                    <MovieBingo />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz/timeline"
                element={
                  <RequireAuth>
                    <MovieTimeline />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz/spin-the-wheel"
                element={
                  <RequireAuth>
                    <SpinTheWheel />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz/cast-combo"
                element={
                  <RequireAuth>
                    <CastCombo />
                  </RequireAuth>
                }
              />
              {/* Results common route */}
              <Route
                path="/result"
                element={
                  <RequireAuth>
                    <QuizResult />
                  </RequireAuth>
                }
              />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

/** Simple navigation bar for Kollywood QuizMaster */
function NavBar() {
  const { user, logout } = useAuth();
  const theme = useContext(ThemeContext);
  const navigate = useNavigate();

  return (
    <nav
      className="navbar"
      style={{
        backgroundColor: theme.primary,
        borderBottom: `2px solid ${theme.secondary}`,
        color: theme.accent,
      }}
    >
      <div className="container" style={{ width: "100%" }}>
        <div className="logo" style={{ color: theme.secondary }}>
          <span className="logo-symbol" style={{ color: theme.secondary }}>
            <span role="img" aria-label="🎬">
              🎬
            </span>
          </span>{" "}
          Kollywood QuizMaster
        </div>
        <div style={{ flex: 1 }} />
        {user && (
          <>
            <span className="username" style={{ marginRight: 12, color: theme.accent }}>
              Hello, <b>{user.username}</b>
            </span>
            <button
              className="btn"
              style={{ background: theme.secondary, color: theme.primary }}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

/** Component to enforce auth for protected routes */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default App;