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
  if (p && existsSync(resolve(__dirname, "..", p)))
    return JSON.parse(readFileSync(resolve(__dirname, "..", p), "utf-8"));
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

const UPDATES = [
  {
    title: "Un Mela Aasadhan",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/42/8c/8c/428c8c57-b89a-6b68-1b59-ed0f18c327d6/884977166910.jpg/600x600bb.jpg",
  },
  {
    title: "Polladha Boomi",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/f2/06/6ff206eb-c064-6d6d-a678-35c0782f2138/8904337201999.jpg/600x600bb.jpg",
  },
  {
    title: "Idhazhin Oram",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/46/b0/7d/46b07d77-0826-f06b-a6e4-e1475860c1b0/886443332195.jpg/600x600bb.jpg",
    artist: "Anirudh Ravichander",
  },
];

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function findSong(title) {
  const snap = await db.collection("songs").where("title", "==", title).get();
  if (!snap.empty) return snap.docs[0];

  const all = await db.collection("songs").get();
  const norm = normalize(title);
  return all.docs.find(d => normalize(d.data().title || "") === norm) || null;
}

async function main() {
  for (const song of UPDATES) {
    const doc = await findSong(song.title);
    if (doc) {
      const updateData = { coverUrl: song.coverUrl };
      if (song.artist) updateData.artist = song.artist;
      await doc.ref.update(updateData);
      console.log(`✓ Updated '${doc.data().title}' → coverUrl set${song.artist ? `, artist → ${song.artist}` : ""}`);
    } else {
      console.log(`✗ '${song.title}' not found`);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
