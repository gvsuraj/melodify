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

const titlesToRemove = [
  "Adiye",
  "Agasatha",
  "Anbenum",
  "Arakkiyae",
  "Dheemthanakka Thillana",
  "Ennodu Nee Irundhal (Reprise)",
  "God Bless U",
  "Goindhammavaala",
  "Hey Sandakkara",
  "Hi Sonna Pothum",
  "Idhuvum Kadandhu Pogum",
  "Jinguchaa",
  "Kannana Kanne",
  "Kissik",
  "Maatikkinaru Orutharu",
  "Matta",
  "Mei Nigara",
  "Mersalayitten",
  "Oruthi Maelae",
  "Otha Thamarai",
  "Pallikoodam",
  "Peelings",
  "Prabalamagavey",
  "Sawadeeka",
  "Soodana",
  "Thaiyya Thaiyya",
  "Udhungada Sangu",
  "Unakku Thaan",
  "Usuru Narambula",
  "Veesum Velichathile",
  "What A Karavad",
  "Whistle Podu",
  "Kadandhu-Pogum-(The-Healing-Song)-MassTamilan.fm",
];

let deleted = 0;
let notFound = 0;

for (const title of titlesToRemove) {
  const snap = await db.collection("songs").where("title", "==", title).get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    await doc.ref.delete();
    console.log(`Deleted: ${title}`);
    deleted++;
  } else {
    console.log(`Not found: ${title}`);
    notFound++;
  }
}

console.log(`\nDone! Deleted: ${deleted}, Not found: ${notFound}`);
