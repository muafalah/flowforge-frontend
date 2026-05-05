import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/api/token-store";

type Listener<T = unknown> = (data: T) => void;
type ConnectionListener = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private url: string;
  private connectionListeners = new Set<ConnectionListener>();

  constructor(url: string) {
    this.url = url;
  }

  /** Notify all connection listeners */
  private notifyConnectionChange(connected: boolean) {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  /** Connect to the Socket.io server with JWT auth */
  connect(): Socket {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    const token = getAccessToken();

    this.socket = io(this.url, {
      transports: ["websocket", "polling"],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      console.log("[Socket.io] Connected:", this.socket?.id);
      this.notifyConnectionChange(true);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket.io] Disconnected:", reason);
      this.notifyConnectionChange(false);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[Socket.io] Connection error:", err.message);
    });

    return this.socket;
  }

  /**
   * Subscribe to connection state changes.
   * The listener is called immediately with the current state,
   * then on every connect/disconnect event.
   * Returns an unsubscribe function.
   */
  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    // Immediately notify with current state
    listener(this.socket?.connected ?? false);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<T = unknown>(event: string, callback: Listener<T>): () => void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback as Listener);
    return () => {
      this.socket?.off(event, callback as Listener);
    };
  }

  /** Emit an event with data */
  emit<T = unknown>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn("[Socket.io] Not connected. Cannot emit:", event);
      return;
    }
    this.socket.emit(event, data);
  }

  /** Join a specific room (e.g., workflow run channel) */
  joinRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit("join-room", { room });
    } else {
      // Queue the join for when we connect
      this.socket?.once("connect", () => {
        this.socket?.emit("join-room", { room });
      });
    }
  }

  /** Leave a specific room */
  leaveRoom(room: string): void {
    this.emit("leave-room", { room });
  }

  /** Check if the socket is currently connected */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /** Get the socket ID */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /** Disconnect and clean up the socket */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connectionListeners.clear();
    }
  }
}

export const socketService = new SocketService(
  import.meta.env.VITE_WS_URL || "http://localhost:3000",
);
