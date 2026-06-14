import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getUserPlaylists, createPlaylist, addSongToPlaylist } from "../../services/playlistService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { Playlist } from "../../types";
import "./Playlist.css";

interface Props {
  songId: string;
  songTitle: string;
  onClose: () => void;
  onSongAdded?: (playlistId: string, songId: string) => void;
}

export default function AddToPlaylist({ songId, songTitle, onClose, onSongAdded }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = getUserPlaylists(user!.uid, (ps) => setPlaylists(ps));
    return unsub;
  }, [user]);

  const handleAdd = async (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    if (pl.songIds.includes(songId)) {
      showToast(`"${songTitle}" already exists in "${pl.name}"`, "info");
      onClose();
      return;
    }
    await addSongToPlaylist(playlistId, songId);
    onSongAdded?.(playlistId, songId);
    showToast(`Added to "${pl.name}"`);
    onClose();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createPlaylist(user!.uid, newName.trim());
    await addSongToPlaylist(id, songId);
    onSongAdded?.(id, songId);
    showToast(`Created & added to "${newName.trim()}"`);
    setNewName("");
    onClose();
  };

  return createPortal(
    <div className="add-to-playlist-backdrop" onClick={onClose}>
      <div className="add-to-playlist-popup" onClick={(e) => e.stopPropagation()}>
        <div className="add-to-playlist-header">
          <span>Add to Playlist</span>
          <button className="add-to-playlist-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div className="add-to-playlist-list">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className="add-to-playlist-item"
              onClick={() => handleAdd(pl.id)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
              {pl.name}
            </button>
          ))}
        </div>

        {showCreate ? (
          <div className="add-to-playlist-create-form">
            <input
              type="text"
              placeholder="New playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <button onClick={handleCreate}>Create & Add</button>
            <button className="cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        ) : (
          <button className="add-to-playlist-new" onClick={() => setShowCreate(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            New Playlist
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
