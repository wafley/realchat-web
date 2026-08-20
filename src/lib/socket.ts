import { io, type Socket } from 'socket.io-client';
import { useSocketStore } from '@/store/socketStore';

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
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      useSocketStore.getState().setConnected(true);
      console.log('[Socket] connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      useSocketStore.getState().setConnected(false);
      console.log('[Socket] disconnected:', reason);
    });

    this.socket.io.on('reconnect_attempt', (attempt: number) => {
      useSocketStore.getState().setReconnectAttempts(attempt);
    });

    this.socket.on('connect_error', (err) => {
      const isAuthError = /auth(entication)?|token/i.test(err.message || '');
      if (isAuthError) {
        const newToken = localStorage.getItem('accessToken');
        if (newToken && newToken !== tk) {
          this.socket?.close();
          this.connect(newToken);
        }
      }
    });

    for (const [event, callbacks] of this.listeners) {
      for (const cb of callbacks) {
        this.socket.on(event, cb);
      }
    }

    return this.socket;
  }

  refreshAuthToken(): void {
    const newToken = localStorage.getItem('accessToken') || '';
    if (!this.socket || !newToken) return;
    if (!this.socket.connected) {
      this.socket.auth = { token: newToken };
      this.socket.connect();
    } else if ((this.socket.auth as { token?: string } | undefined)?.token !== newToken) {
      this.socket.auth = { token: newToken };
    }
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
    useSocketStore.getState().setConnected(false);
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

  sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
    callback?: (res: { data?: any; error?: string }) => void,
  ): void {
    this.socket?.emit('message:send', { conversationId, content, replyToId }, callback);
  }

  deleteMessage(
    conversationId: string,
    messageId: string,
    callback?: (res: { data?: any; error?: string }) => void,
  ): void {
    this.socket?.emit('message:delete', { conversationId, messageId }, callback);
  }

  sendMessageAck(
    conversationId: string,
    content: string,
    replyToId?: string,
  ): Promise<{ data?: any; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ error: 'Realtime connection unavailable' });
        return;
      }
      this.socket.emit('message:send', { conversationId, content, replyToId }, (res?: { data?: any; error?: string }) => {
        resolve(res ?? { error: 'No response from server' });
      });
    });
  }

  deleteMessageAck(
    conversationId: string,
    messageId: string,
  ): Promise<{ data?: any; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ error: 'Realtime connection unavailable' });
        return;
      }
      this.socket.emit('message:delete', { conversationId, messageId }, (res?: { data?: any; error?: string }) => {
        resolve(res ?? { error: 'No response from server' });
      });
    });
  }

  // --- Read receipts ---

  emitMessageSeen(conversationId: string, lastSeenMessageId: string): void {
    this.socket?.emit('message:seen', { conversationId, lastSeenMessageId });
  }

  // --- Page visibility (user away/back in room) ---

  emitUserAway(conversationId: string): void {
    this.socket?.emit('user-away', { conversationId });
  }

  emitUserBack(conversationId: string): void {
    this.socket?.emit('user-back', { conversationId });
  }

}

export const socketClient = new SocketClient();
export type { Socket };
