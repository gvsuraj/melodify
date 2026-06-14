import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayer } from "../../contexts/PlayerContext";
import { useToast } from "../../contexts/ToastContext";
import "./Settings.css";

export default function Settings() {
  const { user, updateDisplayName, logout } = useAuth();
  const { volume, setVolume, stop } = usePlayer();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Name cannot be empty", "error");
      return;
    }
    if (trimmed === user?.displayName) {
      showToast("No changes made", "info");
      return;
    }
    setSaving(true);
    try {
      await updateDisplayName(trimmed);
      showToast("Profile name updated");
    } catch {
      showToast("Failed to update name", "error");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    stop();
    await logout();
    showToast("Logged out successfully.");
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Profile</h2>
        <div className="settings-field">
          <label>Email</label>
          <input type="email" value={user?.email || ""} disabled />
        </div>
        <div className="settings-field">
          <label>Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </section>

      <section className="settings-section">
        <h2>Playback</h2>
        <div className="settings-field">
          <label>Volume</label>
          <div className="volume-control-row">
            <svg viewBox="0 0 24 24" width="20" height="20" className="volume-icon">
              <path fill="currentColor" d={
                volume === 0
                  ? "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                  : volume < 0.5
                  ? "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                  : "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              }/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </section>

      <section className="settings-section settings-danger">
        <h2>Account</h2>
        <p>Once you log out, you'll need to sign in again to access your music.</p>
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          Log Out
        </button>
      </section>
    </div>
  );
}