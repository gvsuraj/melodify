type MessageHandler = (event: string, payload: unknown) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let shouldReconnect = false;
let messageHandler: MessageHandler | null = null;
let roomId: string | null = null;
let userId: string | null = null;
let userName: string | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let messageQueue: Array<{ event: string; payload: unknown }> = [];

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
    pingInterval = setInterval(() => {
      sendWsMessage("ping", {});
    }, 20000);
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      if (msg) sendWsMessage(msg.event, msg.payload);
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
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
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
  // Close any existing connection before starting a new one
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.close();
    ws = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  messageQueue = [];
  roomId = rId;
  userId = uId;
  userName = uName;
  messageHandler = handler;
  shouldReconnect = true;
  reconnectAttempts = 0;

  connect();
}

export function disconnectFromRoom(): void {
  shouldReconnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  messageQueue = [];
  roomId = null;
  userId = null;
  userName = null;
  messageHandler = null;
  reconnectAttempts = 0;
}

export function sendWsMessage(event: string, payload: unknown): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, payload }));
    return;
  }
  if (messageQueue.length < 50) {
    messageQueue.push({ event, payload });
  }
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN;
}
