import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSongsByIds } from "../../services/songService";
import { listenToPlaylist, removeSongFromPlaylist } from "../../services/playlistService";
import { usePlayer } from "../../contexts/PlayerContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { likeSong, unlikeSong, getLikedSongs } from "../../services/likeService";
import type { Song, Playlist } from "../../types";
import "./Playlist.css";

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const { play } = usePlayer();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    const unsub1 = listenToPlaylist(id, (pl) => setPlaylist(pl));
    const unsub2 = getLikedSongs(user!.uid, (ids) => setLikedIds(ids));
    return () => { unsub1(); unsub2(); };
  }, [id, user]);

  useEffect(() => {
    if (!playlist) return;
    const unsub = getSongsByIds(playlist.songIds, (s) => setSongs(s));
    return unsub;
  }, [playlist]);

  const playSong = (song: Song) => {
    play(song, songs);
  };

  const removeSong = async (song: Song) => {
    if (!id) return;
    await removeSongFromPlaylist(id, song.id);
    showToast(`Removed "${song.title}" from playlist`);
  };

  const toggleLike = async (songId: string) => {
    if (likedIds.includes(songId)) {
      await unlikeSong(user!.uid, songId);
    } else {
      await likeSong(user!.uid, songId);
    }
  };

  if (!playlist) {
    return <div className="loading">Loading playlist...</div>;
  }

  return (
    <div className="playlist-detail">
      <div className="playlist-header">
        <div className="playlist-cover-large">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} />
          ) : (
            <div className="playlist-icon-large">
              <svg viewBox="0 0 24 24" width="64" height="64"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
            </div>
          )}
        </div>
        <div className="playlist-info">
          <span className="label">Playlist</span>
          <h1>{playlist.name}</h1>
          <p className="playlist-meta">{songs.length} songs</p>
          {songs.length > 0 && (
            <button
              className="play-all-btn"
              onClick={() => playSong(songs[0])}
            >
              <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
              Play
            </button>
          )}
        </div>
      </div>

      <div className="playlist-songs">
        <div className="song-list-header">
          <span className="col-idx">#</span>
          <span className="col-title">Title</span>
          <span className="col-album">Album</span>
          <span className="col-actions"></span>
        </div>
        {songs.length === 0 && (
          <div className="empty-playlist">
            <p>This playlist is empty</p>
            <Link to="/search" className="browse-link">Browse songs</Link>
          </div>
        )}
        {songs.map((song, idx) => (
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
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); removeSong(song); }}
                title="Remove from playlist"
              >
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
