type MessageHandler = (event: string, payload: unknown) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let shouldReconnect = false;
let messageHandler: MessageHandler | null = null;
let roomId: string | null = null;
let userId: string | null = null;
let userName: string | null = null;

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

function getWebSocketUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

function scheduleReconnect() {
  if (!shouldReconnect) return;
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY
  );
  reconnectTimer = setTimeout(() => {
    reconnectAttempts++;
    connect();
  }, delay);
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(getWebSocketUrl());
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectAttempts = 0;
    if (roomId && userId && userName) {
      ws?.send(JSON.stringify({
        event: "join_room",
        payload: { roomId, userId, userName },
      }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "pong") return;

      if (data.event === "room_state") {
        messageHandler?.("room_state", data.payload);
        return;
      }

      messageHandler?.(data.event, data.payload);
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    ws = null;
    if (shouldReconnect) {
      scheduleReconnect();
    }
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function connectToRoom(
  rId: string,
  uId: string,
  uName: string,
  handler: MessageHandler
): void {
  roomId = rId;
  userId = uId;
  userName = uName;
  messageHandler = handler;
  shouldReconnect = true;
  reconnectAttempts = 0;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  connect();
}

export function disconnectFromRoom(): void {
  shouldReconnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  roomId = null;
  userId = null;
  userName = null;
  messageHandler = null;
  reconnectAttempts = 0;
}

export function sendWsMessage(event: string, payload: unknown): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, payload }));
  }
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN;
}
