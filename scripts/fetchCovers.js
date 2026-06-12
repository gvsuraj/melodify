import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

function getServiceAccount() {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (p && existsSync(resolve(__dirname, "..", p))) {
    return JSON.parse(readFileSync(resolve(__dirname, "..", p), "utf-8"));
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);
  return null;
}

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const sa = getServiceAccount();
if (getApps().length === 0) {
  if (sa) initializeApp({ credential: cert(sa) });
  else initializeApp({ projectId });
}
const db = getFirestore();

async function fetchArtwork(artist, album, title) {
  const queries = [];
  if (album) queries.push(`${artist} ${album}`);
  queries.push(`${artist} ${title}`);

  for (const q of queries) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=3`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.resultCount > 0) {
        const match = data.results.find(
          (r) =>
            r.artistName?.toLowerCase().includes(artist.toLowerCase().split(",")[0].trim()) &&
            (album ? r.collectionName?.toLowerCase().includes(album.toLowerCase()) : true)
        ) || data.results[0];
        if (match?.artworkUrl100) {
          return match.artworkUrl100.replace("100x100", "600x600");
        }
      }
    } catch {}
  }
  return "";
}

const snap = await db.collection("songs").get();
let updated = 0;
let failed = 0;

for (const doc of snap.docs) {
  const { title, artist, album } = doc.data();
  process.stdout.write(`${title}... `);
  const coverUrl = await fetchArtwork(artist, album, title);
  if (coverUrl) {
    await doc.ref.update({ coverUrl });
    console.log(`OK`);
    updated++;
  } else {
    console.log(`NOT FOUND`);
    failed++;
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\nDone! ${updated} covers found, ${failed} not found.`);
