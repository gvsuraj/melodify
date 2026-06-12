import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

const DROPBOX_API = "https://api.dropboxapi.com/2";

function getDropboxToken() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("DROPBOX_ACCESS_TOKEN not set in .env");
  return token;
}

function getServiceAccount() {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && existsSync(resolve(__dirname, "..", path))) {
    const data = readFileSync(resolve(__dirname, "..", path), "utf-8");
    return JSON.parse(data);
  }
  return null;
}

function useEnvServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);
  return null;
}

function initFirebase() {
  if (getApps().length > 0) return getFirestore();
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const sa = getServiceAccount() || useEnvServiceAccount();
  if (sa) {
    initializeApp({ credential: cert(sa) });
  } else {
    initializeApp({ projectId });
  }
  return getFirestore();
}

async function dropboxRequest(endpoint, body, token) {
  const res = await fetch(`${DROPBOX_API}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Dropbox API error: ${data.error_summary || JSON.stringify(data)}`);
  return data;
}

function parseFilename(name) {
  const withoutExt = name.replace(/\.[^/.]+$/, "").trim();
  const bracketMatch = withoutExt.match(/^(.+?)\s*-\s*(.+?)\s*\((.+?)\)\s*$/);
  if (bracketMatch) {
    return { artist: bracketMatch[1].trim(), title: bracketMatch[2].trim(), album: bracketMatch[3].trim() };
  }
  const dashMatch = withoutExt.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim(), album: "" };
  }
  return { artist: "Unknown", title: withoutExt, album: "" };
}

async function getSharedLink(path, token) {
  try {
    const result = await dropboxRequest("sharing/create_shared_link_with_settings", {
      path,
      settings: { access: "viewer", requested_visibility: "public" },
    }, token);
    return result.url;
  } catch (err) {
    if (err.message.includes("shared_link_already_exists")) {
      const result = await dropboxRequest("sharing/list_shared_links", { path, direct_only: true }, token);
      if (result.links?.length > 0) return result.links[0].url;
    }
    if (err.message.includes("shared_link_already_exists")) {
      const result = await dropboxRequest("sharing/list_shared_links", { path }, token);
      if (result.links?.length > 0) return result.links[0].url;
    }
    throw err;
  }
}

async function listFiles(folderPath, token) {
  const allEntries = [];
  let cursor = null;
  do {
    const body = cursor
      ? { cursor }
      : { path: folderPath, recursive: false, include_media_info: true };
    const endpoint = cursor ? "files/list_folder/continue" : "files/list_folder";
    const result = await dropboxRequest(endpoint, body, token);
    allEntries.push(...result.entries);
    cursor = result.has_more ? result.cursor : null;
  } while (cursor);
  const audioExts = new Set([".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"]);
  return allEntries.filter((e) => e[".tag"] === "file" && audioExts.has(e.name.toLowerCase().slice(e.name.lastIndexOf("."))));
}

function parseDurationMs(mediaInfo) {
  if (mediaInfo?.metadata?.[".tag"] === "audio" && mediaInfo.metadata.duration) {
    return Math.round(mediaInfo.metadata.duration);
  }
  return 0;
}

async function main() {
  const folderPath = process.env.DROPBOX_FOLDER_PATH || "";
  const token = getDropboxToken();
  const db = initFirebase();

  console.log(`Scanning Dropbox folder: "${folderPath || "root"}"`);
  const files = await listFiles(folderPath, token);
  console.log(`Found ${files.length} audio files`);

  let added = 0;
  let skipped = 0;

  for (const file of files) {
    console.log(`  Processing: ${file.name}`);

    const existing = await db.collection("songs").where("dropboxPath", "==", file.path_lower).get();
    if (!existing.empty) {
      console.log(`    Skipped (already exists)`);
      skipped++;
      continue;
    }

    const link = await getSharedLink(file.path_lower, token);
    const meta = parseFilename(file.name);
    const duration = parseDurationMs(file.media_info) || 0;

    await db.collection("songs").add({
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      coverUrl: "",
      duration,
      dropboxLink: link,
      dropboxPath: file.path_lower,
      genre: "",
      createdAt: Timestamp.now(),
    });

    console.log(`    Added: ${meta.artist} - ${meta.title}`);
    added++;
  }

  console.log(`\nDone! Added ${added} songs, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
