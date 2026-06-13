import { useState, useEffect, useCallback } from "react";
import { searchSongs } from "../../services/songService";
import { usePlayer } from "../../contexts/PlayerContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { likeSong, unlikeSong, getLikedSongs } from "../../services/likeService";
import type { Song } from "../../types";
import AddToPlaylist from "../Playlist/AddToPlaylist";
import "./Search.css";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [playlistPopupId, setPlaylistPopupId] = useState<string | null>(null);
  const { play } = usePlayer();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = getLikedSongs(user!.uid, (ids) => setLikedIds(ids));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const unsub = searchSongs(query.trim(), (songs) => setResults(songs));
    return unsub;
  }, [query]);

  const toggleLike = useCallback(
    async (songId: string) => {
      if (likedIds.includes(songId)) {
        await unlikeSong(user!.uid, songId);
        showToast("Removed from liked songs");
      } else {
        await likeSong(user!.uid, songId);
        showToast("Added to liked songs");
      }
    },
    [likedIds, user, showToast]
  );

  const playSong = (song: Song, allResults: Song[]) => {
    play(song, allResults);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search</h1>
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" width="24" height="24" className="search-icon"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery("")}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {query && results.length === 0 && (
          <div className="no-results">
            <p>No results found for "{query}"</p>
          </div>
        )}
        {results.map((song, idx) => (
          <div
            key={song.id}
            className="song-row"
            onClick={() => playSong(song, results)}
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
                className={`like-btn ${likedIds.includes(song.id) ? "liked" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  {likedIds.includes(song.id) ? (
                    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  ) : (
                    <path fill="currentColor" d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                  )}
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
