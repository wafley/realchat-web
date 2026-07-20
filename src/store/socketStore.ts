import { create } from 'zustand';
import { socketClient } from '@/lib/socket';

interface SocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: (token?: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  reconnectAttempts: 0,

  connect: (token?: string) => {
    if (socketClient.isConnected) {
      set({ isConnected: true, reconnectAttempts: 0 });
      return;
    }

    socketClient.connect(token);

    socketClient.on('connect', () => {
      set({ isConnected: true, reconnectAttempts: 0 });
    });

    socketClient.on('disconnect', () => {
      set({ isConnected: false });
    });

    const socket = socketClient.getSocket();
    if (socket) {
      socket.io.on('reconnect_attempt', (attempt: number) => {
        set({ reconnectAttempts: attempt });
      });
    }
  },

  disconnect: () => {
    socketClient.disconnect();
    set({ isConnected: false, reconnectAttempts: 0 });
  },
}));
