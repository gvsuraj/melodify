import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllSongs } from "../../services/songService";
import { usePlayer } from "../../contexts/PlayerContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { likeSong, unlikeSong, getLikedSongs } from "../../services/likeService";
import type { Song } from "../../types";
import { getUserPlaylists } from "../../services/playlistService";
import type { Playlist } from "../../types";
import AddToPlaylist from "../Playlist/AddToPlaylist";
import "./Home.css";

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistPopupId, setPlaylistPopupId] = useState<string | null>(null);
  const { play } = usePlayer();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubSongs = getAllSongs(setSongs);
    const unsubLikes = getLikedSongs(user!.uid, (ids) => setLikedIds(ids));
    const unsubPlaylists = getUserPlaylists(user!.uid, (ps) => setPlaylists(ps));
    return () => {
      unsubSongs();
      unsubLikes();
      unsubPlaylists();
    };
  }, [user]);

  const toggleLike = async (songId: string) => {
    if (likedIds.includes(songId)) {
      await unlikeSong(user!.uid, songId);
      showToast("Removed from liked songs");
    } else {
      await likeSong(user!.uid, songId);
      showToast("Added to liked songs");
    }
  };

  const playSong = (song: Song) => {
    play(song, songs);
  };

  const recentSongs = songs.slice(0, 8);

  return (
    <div className="home">
      <section className="greeting">
        <h1>Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}, {user?.displayName || "Listener"}</h1>
      </section>

      {playlists.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Your Playlists</h2>
            <Link to="/playlists" className="see-all">See all</Link>
          </div>
          <div className="playlist-grid">
            {playlists.slice(0, 6).map((pl) => (
              <Link to={`/playlists/${pl.id}`} key={pl.id} className="playlist-card">
                <div className="card-img playlist-img">
                  {pl.coverUrl ? (
                    <img src={pl.coverUrl} alt={pl.name} />
                  ) : (
                    <div className="playlist-icon">
                      <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
                    </div>
                  )}
                </div>
                <p className="card-title">{pl.name}</p>
                <p className="card-subtitle">Playlist • {pl.songIds.length} songs</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h2>Recent Songs</h2>
        </div>
        <div className="song-grid">
          {recentSongs.map((song) => (
            <div key={song.id} className="song-card" onClick={() => playSong(song)}>
              <div className="card-img">
                {song.coverUrl ? (
                  <img src={song.coverUrl} alt={song.title} />
                ) : (
                  <div className="placeholder-img">
                    <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  </div>
                )}
                <button
                  className="play-btn"
                  onClick={(e) => { e.stopPropagation(); playSong(song); }}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                </button>
              </div>
              <p className="card-title">{song.title}</p>
              <p className="card-subtitle">{song.artist}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>All Songs</h2>
        </div>
        <div className="song-list">
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
                  className="add-to-playlist-btn"
                  onClick={(e) => { e.stopPropagation(); setPlaylistPopupId(playlistPopupId === song.id ? null : song.id); }}
                  title="Add to playlist"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
                </button>
                {playlistPopupId === song.id && (
                  <AddToPlaylist songId={song.id} onClose={() => setPlaylistPopupId(null)} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
