import { useState, useEffect, useRef, useCallback } from "react";
import type { BotStatus, LogEntry } from "@shared/schema";

interface WSMessage {
  type: "status" | "pairing_code" | "log";
  data: any;
}

export function useWebSocket() {
  const [status, setStatus] = useState<BotStatus>({
    state: "disconnected",
    pairingCode: null,
    phoneNumber: null,
    name: null,
    uptime: 0,
    startTime: null,
    messagesReceived: 0,
    messagesSent: 0,
  });
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === "status") {
          setStatus(msg.data);
          if (msg.data.pairingCode) {
            setPairingCode(msg.data.pairingCode);
          } else if (msg.data.state === "connected") {
            setPairingCode(null);
          }
        } else if (msg.type === "pairing_code") {
          setPairingCode(msg.data);
        } else if (msg.type === "log") {
          setLogs((prev) => [...prev.slice(-200), msg.data]);
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { status, pairingCode, logs, connected };
}
