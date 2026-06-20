import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type RepeatMode = 0 | 1 | 2;
import type { Song } from "../types";
import { getDirectDownloadLink } from "../services/dropboxService";

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
  play: (song: Song, queue?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  stop: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem("melodify_volume");
    return saved ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.7;
  });
  const [repeat, setRepeat] = useState<RepeatMode>(0);
  const repeatRef = useRef<RepeatMode>(0);
  const [shuffle, setShuffle] = useState(false);
  const originalQueueRef = useRef<Song[] | null>(null);
  const nextRef = useRef<() => void>(() => {});
  const prevRef = useRef<() => void>(() => {});
  const queueIndexRef = useRef(queueIndex);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    localStorage.setItem("melodify_volume", String(volume));
  }, [volume]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || "",
        artwork: currentSong.coverUrl
          ? [{ src: currentSong.coverUrl, sizes: "256x256", type: "image/jpeg" }]
          : [],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [currentSong]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => resume());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextRef.current());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevRef.current());
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const mode = repeatRef.current;
      if (mode === 0) {
        nextRef.current();
      } else if (mode === 1) {
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        nextRef.current();
      }
    };
    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [currentSong]);

  const loadAndPlay = useCallback((song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;
    const directLink = getDirectDownloadLink(song.dropboxLink);
    audio.src = directLink;
    audio.load();
    setIsPlaying(true);
    audio.play().catch(() => setIsPlaying(false));
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const play = useCallback(
    (song: Song, songs?: Song[]) => {
      setShuffle(false);
      originalQueueRef.current = null;
      if (songs) {
        const idx = songs.findIndex((s) => s.id === song.id);
        setQueueState(songs);
        setQueueIndex(idx);
      } else {
        setQueueIndex(-1);
        setQueueState([]);
      }
      loadAndPlay(song);
    },
    [loadAndPlay]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else resume();
  }, [isPlaying, pause, resume]);

  const next = useCallback(() => {
    if (queue.length === 0) {
      pause();
      setCurrentSong(null);
      return;
    }
    if (queueIndex < 0 || queueIndex >= queue.length - 1) {
      const nextIdx = 0;
      setQueueIndex(nextIdx);
      loadAndPlay(queue[nextIdx]);
      setIsPlaying(true);
      return;
    }
    const nextIdx = queueIndex + 1;
    setQueueIndex(nextIdx);
    loadAndPlay(queue[nextIdx]);
    setIsPlaying(true);
  }, [queue, queueIndex, loadAndPlay, pause]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const prev = useCallback(() => {
    if (queue.length === 0 || queueIndex <= 0) {
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        return;
      }
      return;
    }
    const prevIdx = queueIndex - 1;
    setQueueIndex(prevIdx);
    loadAndPlay(queue[prevIdx]);
    setIsPlaying(true);
  }, [queue, queueIndex, loadAndPlay]);

  useEffect(() => {
    prevRef.current = prev;
  }, [prev]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setVolumeState(vol);
  }, []);

  const setQueue = useCallback((songs: Song[]) => {
    setQueueState(songs);
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueueState((prev) => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueueState((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentTime(0);
    setDuration(0);
    setQueueIndex(-1);
    setQueueState([]);
    setRepeat(0);
    setShuffle(false);
    originalQueueRef.current = null;
  }, []);

  useEffect(() => {
    const onLogout = () => stop();
    window.addEventListener("melodify:logout", onLogout);
    return () => window.removeEventListener("melodify:logout", onLogout);
  }, [stop]);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => {
      if (prev === 0) return 1;
      if (prev === 1) return 2;
      return 0;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      if (prev) {
        if (originalQueueRef.current) {
          setQueueState(originalQueueRef.current);
          originalQueueRef.current = null;
        }
        return false;
      } else {
        setQueueState((q) => {
          if (q.length < 2) return q;
          originalQueueRef.current = [...q];
          const currentIdx = queueIndexRef.current;
          if (currentIdx < 0 || currentIdx >= q.length) return q;
          const current = q[currentIdx];
          const rest = q.filter((_, i) => i !== currentIdx);

          for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
          }

          rest.splice(currentIdx, 0, current);
          return rest;
        });
        return true;
      }
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        repeat,
        shuffle,
        play,
        pause,
        resume,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        setQueue,
        addToQueue,
        removeFromQueue,
        stop,
        toggleRepeat,
        toggleShuffle,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
