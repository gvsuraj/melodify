import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayer } from "../../contexts/PlayerContext";
import { useToast } from "../../contexts/ToastContext";
import "./Settings.css";

export default function Settings() {
  const { user, updateDisplayName, logout } = useAuth();
  const { stop } = usePlayer();
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