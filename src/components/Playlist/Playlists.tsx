import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserPlaylists, createPlaylist, deletePlaylist } from "../../services/playlistService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { Playlist } from "../../types";
import "./Playlist.css";

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = getUserPlaylists(user!.uid, (ps) => setPlaylists(ps));
    return unsub;
  }, [user]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(user!.uid, newName.trim());
    showToast(`Created "${newName.trim()}"`);
    setNewName("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete "${name}"?`)) {
      await deletePlaylist(id);
      showToast(`Deleted "${name}"`);
    }
  };

  return (
    <div className="playlists-page">
      <div className="section-header">
        <h1>Your Playlists</h1>
        <button className="create-btn" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Playlist
        </button>
      </div>

      {showCreate && (
        <div className="create-playlist-form">
          <input
            type="text"
            placeholder="Playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate}>Create</button>
          <button className="cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
        </div>
      )}

      {playlists.length === 0 && !showCreate && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
          <h2>Create your first playlist</h2>
          <p>It's easy, we'll help you</p>
        </div>
      )}

      <div className="playlist-grid">
        {playlists.map((pl) => (
          <Link to={`/playlists/${pl.id}`} key={pl.id} className="playlist-card">
            <div className="card-img playlist-img">
              {pl.coverUrl ? (
                <img src={pl.coverUrl} alt={pl.name} />
              ) : (
                <div className="playlist-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
                </div>
              )}
              <button
                className="delete-playlist-btn"
                onClick={(e) => handleDelete(pl.id, pl.name, e)}
                title="Delete playlist"
              >
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
            <p className="card-title">{pl.name}</p>
            <p className="card-subtitle">{pl.songIds.length} songs</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
