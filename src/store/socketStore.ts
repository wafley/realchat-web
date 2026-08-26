import { create } from 'zustand';

interface SocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  setConnected: (value: boolean) => void;
  setReconnectAttempts: (attempt: number) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  reconnectAttempts: 0,
  setConnected: (value) =>
    set(value ? { isConnected: true, reconnectAttempts: 0 } : { isConnected: false }),
  setReconnectAttempts: (attempt) => set({ reconnectAttempts: attempt }),
}));