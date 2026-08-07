import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

type EventCallback = (...args: any[]) => void;

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  connect(token?: string): Socket {
    if (this.socket?.connected) return this.socket;

    const tk = token || localStorage.getItem('accessToken') || '';

    this.socket = io(SOCKET_URL, {
      auth: { token: tk },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      if (err.message === 'Authentication error') {
        const newToken = localStorage.getItem('accessToken');
        if (newToken && newToken !== tk) {
          this.socket?.close();
          this.connect(newToken);
        }
      }
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.listeners.clear();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  // --- Room ---

  joinRoom(conversationId: string): void {
    this.socket?.emit('group:join', { conversationId });
  }

  leaveRoom(conversationId: string): void {
    this.socket?.emit('group:leave', { conversationId });
  }

  // --- Typing ---

  emitTypingStart(conversationId: string): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  emitTypingStop(conversationId: string): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  // --- Message ---

  sendMessage(conversationId: string, content: string, replyTo?: { id: string }): void {
    this.socket?.emit('message:send', { conversationId, content, replyTo });
  }

  emitMessageSeen(conversationId: string): void {
    this.socket?.emit('message:seen', { conversationId });
  }

}

export const socketClient = new SocketClient();
export type { Socket };
