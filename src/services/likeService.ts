import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

const likesCollection = collection(db, "likes");

export async function likeSong(
  userId: string,
  songId: string
): Promise<void> {
  const q = query(
    likesCollection,
    where("userId", "==", userId),
    where("songId", "==", songId)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(likesCollection, { userId, songId, createdAt: new Date() });
  }
}

export async function unlikeSong(
  userId: string,
  songId: string
): Promise<void> {
  const q = query(
    likesCollection,
    where("userId", "==", userId),
    where("songId", "==", songId)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, "likes", d.id));
  }
}

export function getLikedSongs(
  userId: string,
  callback: (songIds: string[]) => void
) {
  const q = query(
    likesCollection,
    where("userId", "==", userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const songIds = snapshot.docs.map((doc) => doc.data().songId);
      callback(songIds);
    },
    (error) => {
      console.error("getLikedSongs failed:", error.message);
    }
  );
}
