import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import type { Song } from "../types";

const songsCollection = collection(db, "songs");

export function getAllSongs(callback: (songs: Song[]) => void) {
  const q = query(songsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const songs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];
      callback(songs);
    },
    (error) => {
      console.error("getAllSongs failed:", error.message);
    }
  );
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
  const term = searchTerm.toLowerCase();
  const q = query(
    songsCollection,
    orderBy("title")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const prefixMatches = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];
      const filtered = prefixMatches.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.artist.toLowerCase().includes(term) ||
          s.album.toLowerCase().includes(term) ||
          s.genre.toLowerCase().includes(term)
      );
      callback(filtered);
    },
    (error) => {
      console.error("searchSongs failed:", error.message);
    }
  );
}

export function getSongsByIds(
  songIds: string[],
  callback: (songs: Song[]) => void
) {
  if (songIds.length === 0) {
    callback([]);
    return () => {};
  }

  const chunks: string[][] = [];
  for (let i = 0; i < songIds.length; i += 10) {
    chunks.push(songIds.slice(i, i + 10));
  }

  let cancelled = false;

  (async () => {
    const resultsMap = new Map<string, Song>();

    for (const chunk of chunks) {
      if (cancelled) return;
      try {
        const q = query(songsCollection, where("__name__", "in", chunk));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((doc) => {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Song);
        });
      } catch (err) {
        console.error("getSongsByIds failed:", err);
        return;
      }
    }

    if (!cancelled) {
      const ordered = songIds
        .map((id) => resultsMap.get(id))
        .filter(Boolean) as Song[];
      callback(ordered);
    }
  })();

  return () => {
    cancelled = true;
  };
}
