import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import type { Song } from "../types";

export interface RoomMember {
  uid: string;
  name: string;
  joinedAt: Date;
}

export interface VibeRoom {
  id: string;
  code: string;
  hostId: string;
  members: RoomMember[];
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: Date;
  queue: Song[];
  queueIndex: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

export type PlaybackUpdate = Partial<{
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  queue: Song[];
  queueIndex: number;
}>;

const roomsCollection = collection(db, "rooms");

function messagesCollection(roomId: string) {
  return collection(db, "rooms", roomId, "messages");
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(
  userId: string,
  userName: string
): Promise<string> {
  let code = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateRoomCode();
    const q = query(roomsCollection, where("code", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) break;
    if (attempt === 9) throw new Error("Could not generate unique room code");
  }

  const member: RoomMember = {
    uid: userId,
    name: userName,
    joinedAt: new Date(),
  };

  const docRef = await addDoc(roomsCollection, {
    code,
    hostId: userId,
    members: [member],
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    lastUpdated: serverTimestamp(),
    queue: [],
    queueIndex: -1,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export function listenToRoom(
  roomId: string,
  callback: (room: VibeRoom | null) => void
) {
  return onSnapshot(
    doc(db, "rooms", roomId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as VibeRoom);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("listenToRoom failed:", error.message);
    }
  );
}

export async function joinRoomByCode(
  code: string,
  userId: string,
  userName: string
): Promise<VibeRoom> {
  const q = query(roomsCollection, where("code", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Room not found");

  const roomDoc = snap.docs[0];
  const room = { id: roomDoc.id, ...roomDoc.data() } as VibeRoom;

  if (room.members.some((m) => m.uid === userId)) {
    return room;
  }

  if (room.members.length >= 5) {
    throw new Error("Room is full (max 5 members)");
  }

  const newMember: RoomMember = {
    uid: userId,
    name: userName,
    joinedAt: new Date(),
  };

  await updateDoc(doc(db, "rooms", roomDoc.id), {
    members: arrayUnion(newMember),
  });

  return { ...room, members: [...room.members, newMember] };
}

export async function getRoomByCode(code: string): Promise<VibeRoom | null> {
  const q = query(roomsCollection, where("code", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as VibeRoom;
}

export async function leaveRoom(
  roomId: string,
  userId: string
): Promise<{ newHostId: string | null; shouldDelete: boolean }> {
  const roomSnap = await getDoc(doc(db, "rooms", roomId));
  if (!roomSnap.exists()) return { newHostId: null, shouldDelete: true };

  const room = { id: roomSnap.id, ...roomSnap.data() } as VibeRoom;
  const memberToRemove = room.members.find((m) => m.uid === userId);
  if (!memberToRemove) return { newHostId: null, shouldDelete: true };

  const remaining = room.members.filter((m) => m.uid !== userId);

  if (remaining.length === 0) {
    await deleteRoomMessages(roomId);
    await deleteDoc(doc(db, "rooms", roomId));
    return { newHostId: null, shouldDelete: true };
  }

  let newHostId = room.hostId;
  if (room.hostId === userId) {
    const sorted = [...remaining].sort((a, b) => {
      const aMs = a.joinedAt && typeof (a.joinedAt as any).toDate === "function"
        ? (a.joinedAt as any).toDate().getTime()
        : new Date(a.joinedAt).getTime();
      const bMs = b.joinedAt && typeof (b.joinedAt as any).toDate === "function"
        ? (b.joinedAt as any).toDate().getTime()
        : new Date(b.joinedAt).getTime();
      return bMs - aMs;
    });
    newHostId = sorted[0].uid;
  }

  await updateDoc(doc(db, "rooms", roomId), {
    members: remaining,
    hostId: newHostId,
  });

  return { newHostId, shouldDelete: false };
}

export async function transferHost(
  roomId: string,
  newHostId: string
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), { hostId: newHostId });
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  await addDoc(messagesCollection(roomId), {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });
}

export function listenToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    messagesCollection(roomId),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    },
    (error) => {
      console.error("listenToMessages failed:", error.message);
    }
  );
}

export async function deleteRoomMessages(roomId: string): Promise<void> {
  const q = query(messagesCollection(roomId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "rooms", roomId, "messages", d.id))));
}

export async function endSession(roomId: string): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), { sessionEnded: true });
  await deleteRoomMessages(roomId);
  await deleteDoc(doc(db, "rooms", roomId));
}

export async function updatePlayback(
  roomId: string,
  update: PlaybackUpdate
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), {
    ...update,
    lastUpdated: serverTimestamp(),
  });
}
