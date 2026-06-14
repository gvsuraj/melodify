import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVibe } from "../../contexts/VibeContext";
import "./Vibe.css";

export default function VibeTogether() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, roomLoading, roomError } = useVibe();
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");

  const handleCreate = async () => {
    try {
      await createRoom();
      navigate("/room");
    } catch {
      // error is set in context
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinRoom(joinCode.trim());
      navigate("/room");
    } catch {
      // error is set in context
    }
  };

  return (
    <div className="vibe-container">
      <div className="vibe-header">
        <div className="vibe-icon">
          <svg viewBox="0 0 24 24" width="40" height="40">
            <path
              fill="currentColor"
              d="M21 3H3v18h18V3zm-4 10h-2v4h-2v-4h-2v-2h2V7h2v4h2v2z"
            />
          </svg>
        </div>
        <h1>Vibe Together</h1>
        <p className="vibe-subtitle">
          Create a room and listen to music in sync with up to 5 friends
        </p>
      </div>

      {roomError && (
        <div className="vibe-error">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          <span>{roomError}</span>
        </div>
      )}

      {mode === "choose" && (
        <div className="vibe-actions">
          <button
            className="vibe-btn vibe-btn-primary"
            onClick={handleCreate}
            disabled={roomLoading}
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M21 3H3v18h18V3zm-4 10h-2v4h-2v-4h-2v-2h2V7h2v4h2v2z"
              />
            </svg>
            {roomLoading ? "Creating..." : "Create a Room"}
          </button>
          <div className="vibe-divider">
            <span>or</span>
          </div>
          <button
            className="vibe-btn vibe-btn-secondary"
            onClick={() => setMode("join")}
            disabled={roomLoading}
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
            Join a Room
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="vibe-create-mode">
          <button
            className="vibe-btn vibe-btn-primary vibe-btn-large"
            onClick={handleCreate}
            disabled={roomLoading}
          >
            {roomLoading ? "Creating Room..." : "Create Room"}
          </button>
          <button
            className="vibe-btn vibe-btn-ghost"
            onClick={() => setMode("choose")}
          >
            Back
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="vibe-join-form">
          <label htmlFor="room-code">Enter Room Code</label>
          <div className="vibe-code-input-row">
            <input
              id="room-code"
              type="text"
              className="vibe-code-input"
              placeholder="e.g. ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              autoFocus
            />
            <button
              className="vibe-btn vibe-btn-primary"
              onClick={handleJoin}
              disabled={roomLoading || !joinCode.trim()}
            >
              {roomLoading ? "Joining..." : "Join"}
            </button>
          </div>
          <button
            className="vibe-btn vibe-btn-ghost"
            onClick={() => {
              setMode("choose");
              setJoinCode("");
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
