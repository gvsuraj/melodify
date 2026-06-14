import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import * as vibeService from "../services/vibeService";
import {
  connectToRoom,
  disconnectFromRoom,
  sendWsMessage,
} from "../services/websocketService";

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
  const roomIdRef = useRef(roomId);
  const userRef = useRef(user);

  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { userRef.current = user; }, [user]);

  const isHost = room !== null && user !== null && room.hostId === user.uid;
  const isInRoom = roomId !== null;

  function dedupeMembers(members: vibeService.RoomMember[]): vibeService.RoomMember[] {
    const seen = new Set<string>();
    return members.filter((m) => {
      if (seen.has(m.uid)) return false;
      seen.add(m.uid);
      return true;
    });
  }

  // Firestore listener for full room state (source of truth)
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    const unsub = vibeService.listenToRoom(roomId, (updated) => {
      if (updated) {
        setRoom({ ...updated, members: dedupeMembers(updated.members) });
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

  // Firestore listener for chat history
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

  // WebSocket connection: started after room create/join
  const connectWs = useCallback((rId: string) => {
    const u = userRef.current;
    if (!u) return;
    connectToRoom(
      rId,
      u.uid,
      u.displayName || u.email || "Unknown",
      (event, payload: any) => {
        switch (event) {
          case "playback_synced":
            setRoom((prev) => {
              if (!prev) return prev;
              return { ...prev, ...payload };
            });
            break;

          case "chat_message":
            setMessages((prev) => [...prev, {
              id: payload.id,
              senderId: payload.senderId,
              senderName: payload.senderName,
              text: payload.text,
              createdAt: new Date(payload.createdAt),
            }]);
            break;

          case "member_joined":
            setRoom((prev) => {
              if (!prev) return prev;
              if (prev.members.some((m) => m.uid === payload.userId)) return prev;
              return {
                ...prev,
                members: dedupeMembers([
                  ...prev.members,
                  { uid: payload.userId, name: payload.userName, joinedAt: new Date() },
                ]),
              };
            });
            break;

          case "member_left":
            setRoom((prev) => {
              if (!prev) return prev;
              const remaining = prev.members.filter((m) => m.uid !== payload.userId);
              const updated = { ...prev, members: remaining };
              if (payload.newHostId) {
                updated.hostId = payload.newHostId;
              }
              return updated;
            });
            break;

          case "host_changed":
            setRoom((prev) => {
              if (!prev) return prev;
              return { ...prev, hostId: payload.newHostId };
            });
            break;

          case "session_ended":
            setSessionEnded(true);
            break;
        }
      }
    );
  }, []);

  const disconnectWs = useCallback(() => {
    disconnectFromRoom();
  }, []);

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
      connectWs(id);
      return id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create room";
      setRoomError(msg);
      throw err;
    } finally {
      setRoomLoading(false);
    }
  }, [user, pause, connectWs]);

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
        connectWs(updatedRoom.id);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to join room";
        setRoomError(msg);
        throw err;
      } finally {
        setRoomLoading(false);
      }
    },
    [user, pause, connectWs]
  );

  const leaveRoom = useCallback(async () => {
    if (!user || !roomIdRef.current) return;
    const rId = roomIdRef.current;
    const uId = user.uid;
    disconnectWs();
    setRoomLoading(true);
    try {
      await vibeService.leaveRoom(rId, uId);
    } catch {
      // room may already be deleted
    } finally {
      setRoomId(null);
      setRoom(null);
      setRoomLoading(false);
    }
  }, [user, disconnectWs]);

  const transferHost = useCallback(
    async (uid: string) => {
      if (!roomIdRef.current) return;
      sendWsMessage("host_transfer", { newHostId: uid });
      try {
        await vibeService.transferHost(roomIdRef.current, uid);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to transfer host";
        setRoomError(msg);
      }
    },
    []
  );

  const syncPlayback = useCallback(
    async (update: vibeService.PlaybackUpdate) => {
      if (!roomIdRef.current) return;
      sendWsMessage("playback_update", update);
      // Optimistic update so the host sees changes immediately
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, ...update };
      });
    },
    []
  );

  const sendMessageFn = useCallback(
    async (text: string) => {
      if (!userRef.current || !roomIdRef.current || !text.trim()) return;
      sendWsMessage("chat_message", { text: text.trim() });
    },
    []
  );

  const endSession = useCallback(async () => {
    if (!roomIdRef.current) return;
    sendWsMessage("end_session", {});
    setSessionEnded(true);
    disconnectWs();
    try {
      await vibeService.endSession(roomIdRef.current);
    } catch {
      // room may have been deleted already
    }
    setRoomId(null);
    setRoom(null);
  }, [disconnectWs]);

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
        sendMessage: sendMessageFn,
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
