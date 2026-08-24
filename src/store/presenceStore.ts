import { create } from 'zustand';

interface PresenceData {
  isOnline: boolean;
  lastSeen: Date | null;
  updatedAt: number;
}

interface PresenceState {
  presenceMap: Record<string, PresenceData>;
  setPresence: (userId: string, data: Omit<PresenceData, 'updatedAt'>) => void;
  setBulkPresence: (entries: Record<string, Omit<PresenceData, 'updatedAt'>>) => void;
  clearPresence: (userId: string) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  presenceMap: {},

  setPresence: (userId, data) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: { ...data, updatedAt: Date.now() } },
    })),

  setBulkPresence: (entries) =>
    set((state) => {
      const now = Date.now();
      const stamped = Object.fromEntries(
        Object.entries(entries).map(([id, d]) => [id, { ...d, updatedAt: now }]),
      );
      return { presenceMap: { ...state.presenceMap, ...stamped } };
    }),

  clearPresence: (userId) =>
    set((state) => {
      if (!(userId in state.presenceMap)) return state;
      const next = { ...state.presenceMap };
      delete next[userId];
      return { presenceMap: next };
    }),
}));
