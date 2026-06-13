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

const snap = await db.collection("songs").where("title", "==", "Water Packet").get();
if (!snap.empty) {
  const doc = snap.docs[0];
  await doc.ref.update({
    artist: "A. R. Rahman",
    album: "Raayan",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/60/14/60/60146079-3868-0011-e53e-39359095f4e9/198588623275.jpg/600x600bb.jpg"
  });
  console.log("Updated Water Packet");
} else {
  console.log("Water Packet not found in Firebase");
}
