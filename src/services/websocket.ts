type Listener<T = unknown> = (data: T) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Record<string, Listener<any>[]> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;
        if (type && this.listeners[type]) {
          this.listeners[type].forEach(listener => listener(data));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error);
      this.ws?.close();
    };
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting WebSocket... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached. Could not connect to WebSocket.');
    }
  }

  listen<T = unknown>(event: string, callback: Listener<T>) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.listeners[event].push(callback as Listener<any>);

    // Return an unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(l => l !== callback);
    };
  }

  send<T = unknown>(type: string, data: T) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
  }
}

// Ensure the environment variable is loaded, otherwise fallback to localhost
export const wsService = new WebSocketService(import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws');
