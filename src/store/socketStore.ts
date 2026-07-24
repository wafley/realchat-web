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

    const socket = socketClient.getSocket();
    if (!socket) return;

    socket.off('connect');
    socket.off('disconnect');
    socket.io.off('reconnect_attempt');

    socket.on('connect', () => {
      set({ isConnected: true, reconnectAttempts: 0 });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.io.on('reconnect_attempt', (attempt: number) => {
      set({ reconnectAttempts: attempt });
    });
  },

  disconnect: () => {
    socketClient.disconnect();
    set({ isConnected: false, reconnectAttempts: 0 });
  },
}));
