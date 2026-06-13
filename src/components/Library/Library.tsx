import { useState, useEffect } from "react";
import { getAllSongs } from "../../services/songService";
import { getLikedSongs } from "../../services/likeService";
import { usePlayer } from "../../contexts/PlayerContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { unlikeSong } from "../../services/likeService";
import type { Song } from "../../types";
import AddToPlaylist from "../Playlist/AddToPlaylist";
import "./Library.css";

export default function Library() {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [playlistPopupId, setPlaylistPopupId] = useState<string | null>(null);
  const { play } = usePlayer();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubSongs = getAllSongs(setAllSongs);
    const unsubLikes = getLikedSongs(user!.uid, (ids) => setLikedIds(ids));
    return () => { unsubSongs(); unsubLikes(); };
  }, [user]);

  const likedSongs = allSongs.filter((s) => likedIds.includes(s.id));

  const playSong = (song: Song) => {
    play(song, likedSongs);
  };

  const removeLike = async (song: Song) => {
    await unlikeSong(user!.uid, song.id);
    showToast(`Removed "${song.title}" from liked songs`);
  };

  return (
    <div className="library-page">
      <div className="section-header">
        <h1>Liked Songs</h1>
        <span className="song-count">{likedSongs.length} songs</span>
      </div>

      {likedSongs.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <h2>No liked songs yet</h2>
          <p>Tap the heart icon on any song to save it here</p>
        </div>
      )}

      <div className="song-list">
        {likedSongs.map((song, idx) => (
          <div
            key={song.id}
            className="song-row"
            onClick={() => playSong(song)}
          >
            <span className="song-idx">{idx + 1}</span>
            <div className="song-row-img">
              {song.coverUrl ? (
                <img src={song.coverUrl} alt={song.title} />
              ) : (
                <div className="placeholder-sm">
                  <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </div>
              )}
            </div>
            <div className="song-row-info">
              <p className="song-row-title">{song.title}</p>
              <p className="song-row-artist">{song.artist}</p>
            </div>
            <div className="song-row-album">{song.album}</div>
            <div className="song-row-actions">
              <button
                className="like-btn liked"
                onClick={(e) => { e.stopPropagation(); removeLike(song); }}
                title="Unlike"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              <button
                className="add-to-playlist-btn"
                onClick={(e) => { e.stopPropagation(); setPlaylistPopupId(playlistPopupId === song.id ? null : song.id); }}
                title="Add to playlist"
              >
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
              </button>
              {playlistPopupId === song.id && (
                <AddToPlaylist songId={song.id} songTitle={song.title} onClose={() => setPlaylistPopupId(null)} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
