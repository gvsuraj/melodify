import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import * as vibeService from "../services/vibeService";

interface VibeContextType {
  roomId: string | null;
  room: vibeService.VibeRoom | null;
  messages: vibeService.ChatMessage[];
  isHost: boolean;
  isInRoom: boolean;
  roomLoading: boolean;
  roomError: string | null;
  sessionEnded: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  transferHost: (uid: string) => Promise<void>;
  syncPlayback: (update: vibeService.PlaybackUpdate) => Promise<void>;
  endSession: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
}

const VibeContext = createContext<VibeContextType | null>(null);

export function VibeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pause } = usePlayer();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<vibeService.VibeRoom | null>(null);
  const [messages, setMessages] = useState<vibeService.ChatMessage[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const isHost = room !== null && user !== null && room.hostId === user.uid;
  const isInRoom = roomId !== null;

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    const unsub = vibeService.listenToRoom(roomId, (updated) => {
      if (updated) {
        setRoom(updated);
        if ((updated as any).sessionEnded) {
          setSessionEnded(true);
        } else {
          setSessionEnded(false);
        }
      } else {
        setRoom(null);
        setRoomId(null);
      }
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }
    const unsub = vibeService.listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [roomId]);

  const createRoom = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    setSessionEnded(false);
    setRoomLoading(true);
    setRoomError(null);
    try {
      pause();
      const id = await vibeService.createRoom(
        user.uid,
        user.displayName || user.email || "Unknown"
      );
      setRoomId(id);
      return id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create room";
      setRoomError(msg);
      throw err;
    } finally {
      setRoomLoading(false);
    }
  }, [user, pause]);

  const joinRoom = useCallback(
    async (code: string) => {
      if (!user) throw new Error("Not authenticated");
      setSessionEnded(false);
      setRoomLoading(true);
      setRoomError(null);
      try {
        pause();
        const updatedRoom = await vibeService.joinRoomByCode(
          code.toUpperCase(),
          user.uid,
          user.displayName || user.email || "Unknown"
        );
        setRoomId(updatedRoom.id);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to join room";
        setRoomError(msg);
        throw err;
      } finally {
        setRoomLoading(false);
      }
    },
    [user, pause]
  );

  const leaveRoom = useCallback(async () => {
    if (!user || !roomId) return;
    setRoomLoading(true);
    try {
      await vibeService.leaveRoom(roomId, user.uid);
    } catch {
      // room may already be deleted
    } finally {
      setRoomId(null);
      setRoom(null);
      setRoomLoading(false);
    }
  }, [user, roomId]);

  const transferHost = useCallback(
    async (uid: string) => {
      if (!roomId) return;
      try {
        await vibeService.transferHost(roomId, uid);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to transfer host";
        setRoomError(msg);
      }
    },
    [roomId]
  );

  const syncPlayback = useCallback(
    async (update: vibeService.PlaybackUpdate) => {
      if (!roomId) return;
      await vibeService.updatePlayback(roomId, update);
    },
    [roomId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !roomId || !text.trim()) return;
      try {
        await vibeService.sendMessage(
          roomId,
          user.uid,
          user.displayName || user.email || "Unknown",
          text.trim()
        );
      } catch {
        // ignore
      }
    },
    [user, roomId]
  );

  const endSession = useCallback(async () => {
    if (!roomId) return;
    setSessionEnded(true);
    try {
      await vibeService.endSession(roomId);
    } catch {
      // room may have been deleted already
    }
    setRoomId(null);
    setRoom(null);
  }, [roomId]);

  return (
    <VibeContext.Provider
      value={{
        roomId,
        room,
        messages,
        isHost,
        isInRoom,
        roomLoading,
        roomError,
        sessionEnded,
        createRoom,
        joinRoom,
        leaveRoom,
        transferHost,
        syncPlayback,
        endSession,
        sendMessage,
      }}
    >
      {children}
    </VibeContext.Provider>
  );
}

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error("useVibe must be used within VibeProvider");
  return ctx;
}
