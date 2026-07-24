import { create } from 'zustand';
import type { PrivacySettings } from '@/types/settings';

interface PrivacyState extends PrivacySettings {
  setLastSeen: (v: PrivacySettings['lastSeen']) => void;
  setAddToGroups: (v: PrivacySettings['addToGroups']) => void;
  setReadReceipts: (v: boolean) => void;
}

const STORAGE_KEY = 'hallo-wok-privacy';

function load(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastSeen: 'everyone', addToGroups: 'everyone', readReceipts: true };
}

function save(settings: PrivacySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const initial = load();

export const usePrivacyStore = create<PrivacyState>((set) => ({
  ...initial,
  setLastSeen: (lastSeen) => set((s) => {
    const next = { ...s, lastSeen };
    save(next);
    return { lastSeen };
  }),
  setAddToGroups: (addToGroups) => set((s) => {
    const next = { ...s, addToGroups };
    save(next);
    return { addToGroups };
  }),
  setReadReceipts: (readReceipts) => set((s) => {
    const next = { ...s, readReceipts };
    save(next);
    return { readReceipts };
  }),
}));
