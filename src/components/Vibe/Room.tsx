import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useVibe } from "../../contexts/VibeContext";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayer } from "../../contexts/PlayerContext";
import { useToast } from "../../contexts/ToastContext";
import { getDirectDownloadLink } from "../../services/dropboxService";
import { searchSongs } from "../../services/songService";
import type { Song } from "../../types";
import "./Vibe.css";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Room() {
  const navigate = useNavigate();
  const {
    room,
    messages,
    isHost,
    isInRoom,
    leaveRoom,
    transferHost,
    syncPlayback,
    endSession,
    sessionEnded,
    sendMessage,
  } = useVibe();
  const { user } = useAuth();
  const { volume, setVolume } = usePlayer();
  const { showToast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevVolumeRef = useRef(volume);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumeDragging = useRef(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const isHostRef = useRef(isHost);
  const roomRef = useRef(room);
  const syncPlaybackRef = useRef(syncPlayback);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const songListenersRef = useRef<{
    onCanPlay: () => void;
    onError: () => void;
  } | null>(null);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    syncPlaybackRef.current = syncPlayback;
  }, [syncPlayback]);

  useEffect(() => {
    if (sessionEnded) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      showToast("Session ended");
      const timer = setTimeout(() => navigate("/vibe-together"), 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionEnded, navigate, showToast]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setLocalTime(t);
      const r = roomRef.current;
      if (isHostRef.current && r && r.isPlaying) {
        syncPlaybackRef.current({ currentTime: t });
      }
    };
    const onDurationChange = () => setLocalDuration(audio.duration || 0);
    const onEnded = () => {
      setLocalPlaying(false);
      const hostRoom = roomRef.current;
      const sync = syncPlaybackRef.current;
      if (isHostRef.current && hostRoom) {
        const { queue, queueIndex } = hostRoom;
        if (queue && queue.length > 0 && queueIndex >= 0) {
          const nextIdx =
            queueIndex < queue.length - 1 ? queueIndex + 1 : 0;
          const nextSong = queue[nextIdx];
          if (nextSong) {
            sync({
              currentSong: nextSong,
              currentTime: 0,
              isPlaying: true,
              queueIndex: nextIdx,
            });
            return;
          }
        }
        sync({
          currentSong: null,
          isPlaying: false,
          currentTime: 0,
          queue: [],
          queueIndex: -1,
        });
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  // Sync volume from PlayerContext to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (volume > 0) prevVolumeRef.current = volume;
  }, [volume]);

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
    if (!audioRef.current || !room) return;
    const audio = audioRef.current;

    if (room.currentSong?.id !== (audio.dataset.songId || undefined)) {
      // Clean up any previous lingering listeners before switching songs
      if (songListenersRef.current) {
        audio.removeEventListener("canplay", songListenersRef.current.onCanPlay);
        audio.removeEventListener("error", songListenersRef.current.onError);
        songListenersRef.current = null;
      }

      if (room.currentSong) {
        const directLink = getDirectDownloadLink(room.currentSong.dropboxLink);
        const hostTime = room.currentTime || 0;
        audio.src = directLink;
        audio.dataset.songId = room.currentSong.id;
        audio.load();
        setLocalDuration(0);
        setLocalPlaying(false);

        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          songListenersRef.current = null;
          audio.currentTime = hostTime;
          setLocalTime(hostTime);
          if (room?.isPlaying) {
            audio.play().then(() => setLocalPlaying(true)).catch(() => setLocalPlaying(false));
          }
        };
        const onError = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          songListenersRef.current = null;
          setLocalPlaying(false);
        };
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("error", onError);
        songListenersRef.current = { onCanPlay, onError };
      } else {
        audio.pause();
        audio.src = "";
        delete audio.dataset.songId;
        setLocalPlaying(false);
        setLocalTime(0);
        setLocalDuration(0);
      }
      return;
    }

    const hostPlaying = room.isPlaying;
    if (hostPlaying && !localPlaying) {
      audio.play().then(() => setLocalPlaying(true)).catch(() => {});
    } else if (!hostPlaying && localPlaying) {
      audio.pause();
      setLocalPlaying(false);
    }
  }, [room?.currentSong?.id, room?.isPlaying]);

  useEffect(() => {
    if (!room || !audioRef.current || !localPlaying) return;
    const hostTime = room.currentTime || 0;
    const drift = Math.abs(localTime - hostTime);
    if (drift > 0.2) {
      audioRef.current.currentTime = hostTime;
      setLocalTime(hostTime);
    }
  }, [room?.currentTime]);

  // Periodic drift correction for non-host members
  useEffect(() => {
    if (!room || isHost) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      const hostTime = roomRef.current?.currentTime || 0;
      const local = audio.currentTime;
      const diff = local - hostTime;
      const drift = Math.abs(diff);

      if (drift > 0.2) {
        audio.playbackRate = 1;
        audio.currentTime = hostTime;
        setLocalTime(hostTime);
      } else if (drift > 0.05) {
        audio.playbackRate = diff > 0 ? 0.95 : 1.05;
      } else {
        audio.playbackRate = 1;
      }
    }, 800);
    return () => clearInterval(interval);
  }, [room?.currentSong?.id, isHost]);

  useEffect(() => {
    if (!isInRoom) {
      navigate("/vibe-together");
    }
  }, [isInRoom, navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const unsub = searchSongs(searchQuery.trim(), setSearchResults);
    return unsub;
  }, [searchQuery]);

  const playAudio = useCallback((song: Song, time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Remove any previous play-now listeners to prevent accumulation
    if (songListenersRef.current) {
      audio.removeEventListener("canplay", songListenersRef.current.onCanPlay);
      audio.removeEventListener("error", songListenersRef.current.onError);
      songListenersRef.current = null;
    }

    const directLink = getDirectDownloadLink(song.dropboxLink);
    audio.src = directLink;
    audio.dataset.songId = song.id;
    audio.load();
    setLocalTime(time);
    setLocalDuration(0);
    setLocalPlaying(false);

    const onCanPlay = () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      songListenersRef.current = null;
      audio.currentTime = time;
      audio.play().then(() => setLocalPlaying(true)).catch(() => setLocalPlaying(false));
    };
    const onError = () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      songListenersRef.current = null;
      setLocalPlaying(false);
    };
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);
    songListenersRef.current = { onCanPlay, onError };
  }, []);

  const handlePlayNow = (song: Song) => {
    if (!isHost || !room) return;
    const queue = room.queue ? [...room.queue] : [];
    if (room.currentSong) {
      const insertAt = room.queueIndex >= 0 ? room.queueIndex + 1 : queue.length;
      queue.splice(insertAt, 0, song);
    }
    const newQueue = room.currentSong ? queue : [song];
    const newIndex = room.currentSong ? (room.queueIndex >= 0 ? room.queueIndex + 1 : newQueue.length - 1) : 0;

    playAudio(song, 0);

    syncPlayback({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      queue: newQueue,
      queueIndex: newIndex,
    });
    showToast(`Playing "${song.title}"`);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddToQueue = (song: Song) => {
    if (!isHost || !room) return;
    const newQueue = room.queue ? [...room.queue, song] : [song];
    syncPlayback({ queue: newQueue });
    showToast(`Added "${song.title}" to queue`);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleTogglePlay = useCallback(async () => {
    if (!isHost || !room?.currentSong) return;
    const nowPlaying = !localPlaying;
    await syncPlayback({ isPlaying: nowPlaying, currentTime: localTime });
  }, [isHost, localPlaying, room, localTime, syncPlayback]);

  const handleSeek = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHost || !audioRef.current || !room?.currentSong) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      const time = pct * localDuration;
      audioRef.current.currentTime = time;
      setLocalTime(time);
      await syncPlayback({ currentTime: time, isPlaying: true });
    },
    [isHost, localDuration, room, syncPlayback]
  );

  const handleNext = useCallback(async () => {
    if (!isHost || !room) return;
    const { queue, queueIndex } = room;
    if (queue && queue.length > 0) {
      const nextIdx =
        queueIndex < queue.length - 1 ? queueIndex + 1 : 0;
      const nextSong = queue[nextIdx];
      await syncPlayback({
        currentSong: nextSong,
        currentTime: 0,
        isPlaying: true,
        queueIndex: nextIdx,
      });
    }
  }, [isHost, room, syncPlayback]);

  const handlePrev = useCallback(async () => {
    if (!isHost || !room) return;
    const { queue, queueIndex } = room;
    if (audioRef.current && localTime > 3) {
      audioRef.current.currentTime = 0;
      setLocalTime(0);
      await syncPlayback({ currentTime: 0 });
      return;
    }
    if (queue && queue.length > 0 && queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      const prevSong = queue[prevIdx];
      await syncPlayback({
        currentSong: prevSong,
        currentTime: 0,
        isPlaying: true,
        queueIndex: prevIdx,
      });
    }
  }, [isHost, room, localTime, syncPlayback]);

  const handleTransfer = useCallback(
    async (uid: string) => {
      await transferHost(uid);
      showToast("Host transferred");
    },
    [transferHost, showToast]
  );

  const handleCopyCode = useCallback(() => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      showToast("Room code copied!");
    }
  }, [room?.code, showToast]);

  const handleLeave = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    await leaveRoom();
    navigate("/vibe-together");
  }, [leaveRoom, navigate]);

  if (sessionEnded) {
    return (
      <div className="room-page room-ended">
        <div className="room-ended-overlay">
          <div className="room-ended-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h2>Session Ended</h2>
          <p>The host has ended this listening session.</p>
          <span className="room-ended-countdown">Returning to Vibe Together...</span>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="vibe-container">
        <div className="vibe-loading">Loading room...</div>
      </div>
    );
  }

  const members = room.members || [];
  const currentSong = room.currentSong;
  const progress =
    localDuration > 0 ? (localTime / localDuration) * 100 : 0;

  return (
    <div className="room-page">
      <div className="room-top-bar">
        <div className="room-code-badge">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M21 3H3v18h18V3zm-4 10h-2v4h-2v-4h-2v-2h2V7h2v4h2v2z"
            />
          </svg>
          Room: <strong>{room.code}</strong>
          <button
            className="room-copy-btn"
            onClick={handleCopyCode}
            title="Copy room code"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path
                fill="currentColor"
                d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
              />
            </svg>
          </button>
        </div>
        <div className="room-member-count">
          {members.length}/5 members
        </div>
        {isHost && (
          <button className="room-end-btn" onClick={endSession}>
            End Session
          </button>
        )}
        <button className="room-leave-btn" onClick={handleLeave}>
          Leave Room
        </button>
      </div>

      {isHost && (
        <div className="room-search-section">
          <div className="room-search-box">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search songs to add to queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="room-search-clear" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="room-search-results">
              {searchResults.map((song) => (
                <div
                  key={song.id}
                  className="room-search-item"
                  onClick={() => handlePlayNow(song)}
                >
                  <div className="room-search-art">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} />
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    )}
                  </div>
                  <div className="room-search-text">
                    <span className="room-search-title">{song.title}</span>
                    <span className="room-search-artist">{song.artist}</span>
                  </div>
                  <button
                    className="room-search-add-btn"
                    onClick={(e) => { e.stopPropagation(); handleAddToQueue(song); }}
                    title="Add to queue"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    Queue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="room-layout">
        <div className="room-player-section">
          {currentSong ? (
            <div className="room-player">
              <div className="room-current-art">
                {currentSong.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className={localPlaying ? "room-art-spin" : ""}
                  />
                ) : (
                  <div className="room-art-placeholder">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                      <path
                        fill="currentColor"
                        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="room-current-info">
                <h2>{currentSong.title}</h2>
                <p>{currentSong.artist}</p>
              </div>

              {isHost && (
                <div className="room-controls">
                  <button
                    className="room-ctrl-btn"
                    onClick={handlePrev}
                    title="Previous"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        fill="currentColor"
                        d="M6 6h2v12H6zm3.5 6l8.5 6V6z"
                      />
                    </svg>
                  </button>
                  <button
                    className="room-ctrl-btn room-play-btn"
                    onClick={handleTogglePlay}
                    title={localPlaying ? "Pause" : "Play"}
                  >
                    {localPlaying ? (
                      <svg viewBox="0 0 24 24" width="28" height="28">
                        <path
                          fill="currentColor"
                          d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="28" height="28">
                        <path
                          fill="currentColor"
                          d="M8 5v14l11-7z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    className="room-ctrl-btn"
                    onClick={handleNext}
                    title="Next"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        fill="currentColor"
                        d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {!isHost && (
                <div className="room-member-status">
                  <span className="room-status-dot" />
                  Listening along
                </div>
              )}

              <div className="room-progress-bar" onClick={handleSeek}>
                <div
                  className="room-progress-fill"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="room-progress-thumb"
                  style={{ left: `${progress}%` }}
                />
              </div>
              <div className="room-time-labels">
                <span>{formatTime(localTime)}</span>
                <span>{formatTime(localDuration)}</span>
              </div>

              <div className="room-volume">
                <button
                  className="room-vol-btn"
                  onClick={() => {
                    if (volume === 0) {
                      setVolume(prevVolumeRef.current || 0.7);
                    } else {
                      prevVolumeRef.current = volume;
                      setVolume(0);
                    }
                  }}
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    {volume === 0 ? (
                      <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    ) : (
                      <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    )}
                  </svg>
                </button>
                <div
                  className="room-vol-bar"
                  ref={volumeBarRef}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    setVolume(Math.max(0, Math.min(1, x / rect.width)));
                  }}
                  onMouseDown={handleVolumeMouseDown}
                >
                  <div
                    className="room-vol-fill"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
                <span className="room-vol-label">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          ) : (
            <div className="room-empty-player">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path
                  fill="currentColor"
                  d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                />
              </svg>
              <p>Waiting for the host to play a song...</p>
              <div className="room-volume room-volume-empty">
                <button
                  className="room-vol-btn"
                  onClick={() => {
                    if (volume === 0) {
                      setVolume(prevVolumeRef.current || 0.7);
                    } else {
                      prevVolumeRef.current = volume;
                      setVolume(0);
                    }
                  }}
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    {volume === 0 ? (
                      <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    ) : (
                      <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    )}
                  </svg>
                </button>
                <div
                  className="room-vol-bar"
                  ref={volumeBarRef}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    setVolume(Math.max(0, Math.min(1, x / rect.width)));
                  }}
                  onMouseDown={handleVolumeMouseDown}
                >
                  <div
                    className="room-vol-fill"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
                <span className="room-vol-label">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="room-members-section">
          <h3>Members</h3>
          <div className="room-members-list">
            {members.map((m) => (
              <div
                key={m.uid}
                className={`room-member${m.uid === room.hostId ? " is-host" : ""}`}
              >
                <div className="room-member-avatar">
                  {m.name[0]?.toUpperCase() || "?"}
                </div>
                <div className="room-member-info">
                  <span className="room-member-name">
                    {m.name}
                    {m.uid === room.hostId && (
                      <span className="room-host-badge">Host</span>
                    )}
                  </span>
                </div>
                {isHost && m.uid !== room.hostId && (
                  <button
                    className="room-transfer-btn"
                    onClick={() => handleTransfer(m.uid)}
                    title="Transfer host"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                    Transfer
                  </button>
                )}
              </div>
            ))}
          </div>
          {room.queue && room.queue.length > 0 && (
            <div className="room-queue-section">
              <h3>
                Up Next
                <span className="room-queue-count">{room.queue.length}</span>
              </h3>
              <div className="room-queue-list">
                {room.queue.map((song, i) => (
                  <div
                    key={`${song.id}-${i}`}
                    className={`room-queue-item${i === room.queueIndex ? " room-queue-current" : ""}`}
                  >
                    <span className="room-queue-idx">
                      {i === room.queueIndex ? (
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path fill="currentColor" d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="room-queue-art">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} />
                      ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      )}
                    </div>
                    <div className="room-queue-text">
                      <span className="room-queue-title">{song.title}</span>
                      <span className="room-queue-artist">{song.artist}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="room-chat-section">
        <h3>Chat</h3>
        <div className="room-chat-list">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`room-chat-msg${msg.senderId === user?.uid ? " room-chat-self" : ""}`}
            >
              <span className="room-chat-sender">{msg.senderName}</span>
              <span className="room-chat-text">{msg.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form
          className="room-chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (chatInput.trim()) {
              sendMessage(chatInput);
              setChatInput("");
            }
          }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" disabled={!chatInput.trim()}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
