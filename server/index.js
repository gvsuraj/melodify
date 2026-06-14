import { readFileSync, existsSync } from "fs";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== "production";

// ── Firebase Admin ─────────────────────────────────────────────
function initFirebaseAdmin() {
  if (admin.getApps().length > 0) return admin;

  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envJson) {
    try {
      admin.initializeApp({ credential: admin.cert(JSON.parse(envJson)) });
      console.log("Firebase Admin initialized from env var");
      return admin;
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e.message);
    }
  }

  const keyPath = join(__dirname, "..", "serviceAccountKey.json");
  if (existsSync(keyPath)) {
    try {
      const cert = JSON.parse(readFileSync(keyPath, "utf-8"));
      admin.initializeApp({ credential: admin.cert(cert) });
      console.log("Firebase Admin initialized from serviceAccountKey.json");
      return admin;
    } catch (e) {
      console.warn("Failed to load serviceAccountKey.json:", e.message);
    }
  }

  try {
    admin.initializeApp();
    console.log("Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS");
  } catch (e) {
    console.warn("No Firebase Admin credentials found. Persistence disabled.", e.message);
  }
  return admin;
}

const fb = initFirebaseAdmin();
const db = fb.getApps().length > 0 ? getFirestore() : null;

// ── Express ─────────────────────────────────────────────────────
const app = express();
const distPath = join(__dirname, "..", "dist");

if (!isDev && existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

// ── HTTP Server ────────────────────────────────────────────────
const server = createServer(app);

// ── WebSocket ──────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });

// In-memory room state
const rooms = new Map();           // roomId -> Map<ws, { userId, userName }>
const clientInfo = new Map();      // ws -> { roomId, userId, userName }
const roomPlaybackStates = new Map(); // roomId -> aggregated playback state
const persistTimers = new Map();      // roomId -> setTimeout

function send(ws, event, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ event, payload }));
  }
}

function broadcast(roomId, event, payload, exclude) {
  const clients = rooms.get(roomId);
  if (!clients) return;
  for (const ws of clients.keys()) {
    if (ws !== exclude) {
      send(ws, event, payload);
    }
  }
}

function broadcastAll(roomId, event, payload) {
  broadcast(roomId, event, payload, null);
}

async function persistPlayback(roomId, update) {
  if (!db) return;
  try {
    await db.collection("rooms").doc(roomId).update({
      ...update,
      lastUpdated: FieldValue.serverTimestamp(),
    });
  } catch {
    // room may have been deleted
  }
}

// Debounced persist: aggregates rapid updates, only persists after 300ms of quiet
function debouncedPersist(roomId) {
  if (persistTimers.has(roomId)) {
    clearTimeout(persistTimers.get(roomId));
  }
  persistTimers.set(roomId, setTimeout(async () => {
    persistTimers.delete(roomId);
    const state = roomPlaybackStates.get(roomId);
    if (state) {
      await persistPlayback(roomId, state);
    }
  }, 300));
}

async function persistMessage(roomId, msg) {
  if (!db) return;
  try {
    await db.collection("rooms").doc(roomId).collection("messages").add({
      ...msg,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    // room may have been deleted
  }
}

async function persistHostChange(roomId, newHostId) {
  if (!db) return;
  try {
    await db.collection("rooms").doc(roomId).update({ hostId: newHostId });
  } catch { /* ignore */ }
}

async function deleteRoom(roomId) {
  if (!db) return;
  try {
    const msgsSnap = await db.collection("rooms").doc(roomId).collection("messages").get();
    const batch = db.batch();
    msgsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection("rooms").doc(roomId));
    await batch.commit();
  } catch { /* ignore */ }
}

// ── WS Connection Handler ──────────────────────────────────────
wss.on("connection", (ws) => {
  let heartbeatInterval = null;
  let heartbeatTimeout = null;

  const startHeartbeat = () => {
    clearInterval(heartbeatInterval);
    clearTimeout(heartbeatTimeout);
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === 1) {
        send(ws, "pong", {});
      }
    }, 10000);
  };

  const resetHeartbeatTimeout = () => {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(() => {
      ws.terminate();
    }, 30000);
  };

  startHeartbeat();

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return send(ws, "error", { message: "Invalid JSON" });
    }

    const { event, payload } = data;
    if (!event) return send(ws, "error", { message: "Missing event" });

    // Ping — respond immediately
    if (event === "ping") {
      resetHeartbeatTimeout();
      return send(ws, "pong", {});
    }

    const info = clientInfo.get(ws);

    switch (event) {
      case "join_room": {
        if (!payload?.roomId || !payload?.userId || !payload?.userName) {
          return send(ws, "error", { message: "Missing roomId/userId/userName" });
        }
        const { roomId, userId, userName } = payload;

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
        const clients = rooms.get(roomId);
        clients.set(ws, { userId, userName });
        clientInfo.set(ws, { roomId, userId, userName });

        const count = clients.size;
        // Don't echo member_joined to the joining client — they get room_state instead
        broadcast(roomId, "member_joined", { userId, userName, memberCount: count }, ws);

        // Don't persist to Firestore — the client already handled this via vibeService
        // Send current member list back to the joining client
        const members = [];
        for (const [, info] of clients) {
          members.push({ uid: info.userId, name: info.userName });
        }
        send(ws, "room_state", { roomId, members, memberCount: count });

        resetHeartbeatTimeout();
        break;
      }

      case "leave_room": {
        if (!info) return;
        const { roomId, userId, userName } = info;
        const clients = rooms.get(roomId);
        if (clients) {
          clients.delete(ws);
          const count = clients.size;
          let newHostId = null;

          // Determine new host if the leaving user was host
          if (payload?.newHostId) {
            newHostId = payload.newHostId;
          }

          broadcastAll(roomId, "member_left", {
            userId,
            userName,
            newHostId,
            memberCount: count,
          });

          if (count === 0) {
            rooms.delete(roomId);
            roomPlaybackStates.delete(roomId);
            if (persistTimers.has(roomId)) {
              clearTimeout(persistTimers.get(roomId));
              persistTimers.delete(roomId);
            }
          }
        }
        clientInfo.delete(ws);
        resetHeartbeatTimeout();
        break;
      }

      case "playback_update": {
        if (!info) return;
        const { roomId } = info;
        // Merge into aggregated room playback state
        const current = roomPlaybackStates.get(roomId) || {};
        const merged = { ...current, ...payload };
        roomPlaybackStates.set(roomId, merged);
        // Broadcast the full aggregated state to all other clients
        broadcast(roomId, "playback_synced", merged, ws);
        // Debounce Firestore persist to prevent race conditions
        debouncedPersist(roomId);
        resetHeartbeatTimeout();
        break;
      }

      case "chat_message": {
        if (!info || !payload?.text?.trim()) return;
        const { roomId, userId, userName } = info;
        const msg = {
          id: crypto.randomUUID(),
          senderId: userId,
          senderName: userName,
          text: payload.text.trim(),
          createdAt: new Date(),
        };
        broadcastAll(roomId, "chat_message", msg);
        persistMessage(roomId, { senderId: userId, senderName: userName, text: msg.text });
        resetHeartbeatTimeout();
        break;
      }

      case "host_transfer": {
        if (!info || !payload?.newHostId) return;
        const { roomId } = info;
        broadcastAll(roomId, "host_changed", { newHostId: payload.newHostId });
        persistHostChange(roomId, payload.newHostId);
        resetHeartbeatTimeout();
        break;
      }

      case "end_session": {
        if (!info) return;
        const { roomId } = info;
        broadcastAll(roomId, "session_ended", {});
        const clients = rooms.get(roomId);
        if (clients) {
          for (const ws of clients.keys()) {
            clientInfo.delete(ws);
          }
          clients.clear();
          rooms.delete(roomId);
        }
        roomPlaybackStates.delete(roomId);
        if (persistTimers.has(roomId)) {
          clearTimeout(persistTimers.get(roomId));
          persistTimers.delete(roomId);
        }
        deleteRoom(roomId);
        resetHeartbeatTimeout();
        break;
      }

      default:
        send(ws, "error", { message: `Unknown event: ${event}` });
    }
  });

  ws.on("close", () => {
    clearInterval(heartbeatInterval);
    clearTimeout(heartbeatTimeout);
    const info = clientInfo.get(ws);
    if (info) {
      const { roomId, userId, userName } = info;
      const clients = rooms.get(roomId);
      if (clients) {
        clients.delete(ws);
        const count = clients.size;
        broadcastAll(roomId, "member_left", {
          userId,
          userName,
          newHostId: null,
          memberCount: count,
        });
        if (count === 0) {
          rooms.delete(roomId);
        }
      }
      clientInfo.delete(ws);
    }
  });

  ws.on("error", () => {
    // handled by close
  });
});

server.listen(PORT, () => {
  const proto = process.env.NODE_ENV === "production" ? "wss" : "ws";
  console.log(`Melodify server running on port ${PORT}`);
  console.log(`WebSocket ready on ${proto}://localhost:${PORT}/ws`);
});
