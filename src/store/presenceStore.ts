import { create } from 'zustand';

interface PresenceData {
  isOnline: boolean;
  lastSeen: Date | null;
}

interface PresenceState {
  presenceMap: Record<string, PresenceData>;
  setPresence: (userId: string, data: PresenceData) => void;
  setBulkPresence: (entries: Record<string, PresenceData>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  presenceMap: {},

  setPresence: (userId, data) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: data },
    })),

  setBulkPresence: (entries) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, ...entries },
    })),
}));
