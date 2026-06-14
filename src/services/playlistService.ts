import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import type { Playlist } from "../types";

const playlistsCollection = collection(db, "playlists");

export function getUserPlaylists(
  userId: string,
  callback: (playlists: Playlist[]) => void
) {
  const q = query(
    playlistsCollection,
    where("userId", "==", userId)
  );
  return onSnapshot(q, (snapshot) => {
    const playlists = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Playlist[];

    playlists.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    callback(playlists);
  });
}

export async function createPlaylist(
  userId: string,
  name: string,
  coverUrl: string = ""
): Promise<string> {
  const docRef = await addDoc(playlistsCollection, {
    name,
    userId,
    songIds: [],
    coverUrl,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function addSongToPlaylist(
  playlistId: string,
  songId: string
): Promise<void> {
  await updateDoc(doc(db, "playlists", playlistId), {
    songIds: arrayUnion(songId),
  });
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<void> {
  await updateDoc(doc(db, "playlists", playlistId), {
    songIds: arrayRemove(songId),
  });
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await deleteDoc(doc(db, "playlists", playlistId));
}

export async function getPlaylistById(
  playlistId: string
): Promise<Playlist | null> {
  const docSnap = await getDoc(doc(db, "playlists", playlistId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Playlist;
  }
  return null;
}

export function listenToPlaylist(
  playlistId: string,
  callback: (playlist: Playlist | null) => void
) {
  return onSnapshot(doc(db, "playlists", playlistId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Playlist);
    } else {
      callback(null);
    }
  });
}
