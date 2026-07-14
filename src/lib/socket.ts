import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;

  connect(token?: string): Socket {
    if (this.socket?.connected) return this.socket;

    const tk = token || localStorage.getItem('token') || '';

    this.socket = io(SOCKET_URL, {
      auth: { token: tk },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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
        const newToken = localStorage.getItem('token');
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

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('conversation:join', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('conversation:leave', conversationId);
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('message:typing', { conversationId, isTyping });
  }

  sendMessage(conversationId: string, content: string, replyTo?: { id: string }): void {
    this.socket?.emit('message:send', { conversationId, content, replyTo });
  }
}

export const socketClient = new SocketClient();
export type { Socket };
