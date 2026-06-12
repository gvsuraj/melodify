import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import type { Song } from "../types";

const songsCollection = collection(db, "songs");

export function getAllSongs(callback: (songs: Song[]) => void) {
  const q = query(songsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const songs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];
    callback(songs);
  });
}

export async function getSongById(songId: string): Promise<Song | null> {
  const docSnap = await getDoc(doc(db, "songs", songId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Song;
  }
  return null;
}

export function searchSongs(
  searchTerm: string,
  callback: (songs: Song[]) => void
) {
  const q = query(
    songsCollection,
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const allSongs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];
    const term = searchTerm.toLowerCase();
    const filtered = allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term) ||
        s.album.toLowerCase().includes(term) ||
        s.genre.toLowerCase().includes(term)
    );
    callback(filtered);
  });
}

export function getSongsByIds(
  songIds: string[],
  callback: (songs: Song[]) => void
) {
  if (songIds.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(songsCollection, where("__name__", "in", songIds.slice(0, 10)));
  return onSnapshot(q, (snapshot) => {
    const songs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];
    const ordered = songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean) as Song[];
    callback(ordered);
  });
}
