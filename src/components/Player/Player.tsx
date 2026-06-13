import { useRef, useCallback, useEffect } from "react";
import { usePlayer } from "../../contexts/PlayerContext";
import "./Player.css";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Player() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
  } = usePlayer();

  const volumeDragging = useRef(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef(volume);

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    volumeDragging.current = true;
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!volumeDragging.current || !volumeBarRef.current) return;
      const rect = volumeBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setVolume(Math.max(0, Math.min(1, x / rect.width)));
    };
    const handleMouseUp = () => {
      volumeDragging.current = false;
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setVolume]);

  useEffect(() => {
    if (volume > 0) prevVolumeRef.current = volume;
  }, [volume]);

  if (!currentSong) {
    return (
      <footer className="player player-empty">
        <div className="player-empty-message">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          <span>Select a song to start playing</span>
        </div>
      </footer>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seek(pct * duration);
  };

  return (
    <footer className="player">
      <div className="player-song-info">
        <div className={`player-img${isPlaying ? " playing" : ""}`}>
          {currentSong.coverUrl ? (
            <img src={currentSong.coverUrl} alt={currentSong.title} />
          ) : (
            <div className="placeholder-sm">
              <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
          )}
        </div>
        <div className="player-text">
          <p className="player-title">{currentSong.title}</p>
          <p className="player-artist">{currentSong.artist}</p>
        </div>
      </div>

      <div className="player-controls">
        <div className="controls-buttons">
          <button
            className={`control-btn${repeat > 0 ? " active" : ""}${repeat === 1 ? " repeat-one" : ""}`}
            onClick={toggleRepeat}
            title={repeat === 0 ? "Repeat off" : repeat === 1 ? "Repeat once" : "Repeat all"}
          >
            {repeat === 1 ? (
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                <circle cx="12" cy="13" r="5" fill="var(--bg-primary)"/>
                <text x="12" y="15" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--accent)">1</text>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            )}
          </button>
          <button className="control-btn" onClick={prev} title="Previous">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button className="control-btn play-pause" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="control-btn" onClick={next} title="Next">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button
            className={`control-btn${shuffle ? " active" : ""}`}
            onClick={toggleShuffle}
            title={shuffle ? "Disable shuffle" : "Shuffle"}
          >
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
        </div>
        <div className="progress-bar-container">
          <span className="time current">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleSeek}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <div className="progress-thumb" style={{ left: `${progress}%` }} />
          </div>
          <span className="time total">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <button className="control-btn" onClick={() => {
            if (volume === 0) {
              setVolume(prevVolumeRef.current || 0.7);
            } else {
              prevVolumeRef.current = volume;
              setVolume(0);
            }
          }} title="Mute">
          <svg viewBox="0 0 24 24" width="20" height="20">
            {volume === 0 ? (
              <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            ) : (
              <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            )}
          </svg>
        </button>
        <div
          className="volume-bar"
          ref={volumeBarRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            setVolume(Math.max(0, Math.min(1, x / rect.width)));
          }}
          onMouseDown={handleVolumeMouseDown}
        >
          <div
            className="volume-fill"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
        <span className="volume-label">{Math.round(volume * 100)}%</span>
      </div>
    </footer>
  );
}
