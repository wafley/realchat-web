import { create } from 'zustand';
import { toast } from 'sonner';
import type { GroupAddOption, LastSeenOption, PrivacySettings } from '@/types/settings';
import { getPrivacy, updatePrivacy } from '@/services/user';

interface PrivacyState extends PrivacySettings {
  setLastSeen: (v: LastSeenOption) => void;
  setAddToGroups: (v: GroupAddOption) => void;
  setReadReceipts: (v: boolean) => void;
  syncFromServer: () => Promise<void>;
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

function apply(partial: Partial<PrivacySettings>) {
  const s = usePrivacyStore.getState();
  const next: PrivacySettings = {
    lastSeen: partial.lastSeen ?? s.lastSeen,
    addToGroups: partial.addToGroups ?? s.addToGroups,
    readReceipts: partial.readReceipts ?? s.readReceipts,
  };
  usePrivacyStore.setState(next);
  save(next);
}

export const usePrivacyStore = create<PrivacyState>((_, get) => ({
  ...initial,
  setLastSeen: (lastSeen) => {
    const prev = get().lastSeen;
    apply({ lastSeen });
    updatePrivacy({ lastSeenVisibility: lastSeen.toUpperCase() }).catch(() => {
      apply({ lastSeen: prev });
      toast.error('Failed to update last seen visibility');
    });
  },
  setAddToGroups: (addToGroups) => {
    const prev = get().addToGroups;
    apply({ addToGroups });
    updatePrivacy({ groupInvitePolicy: addToGroups.toUpperCase() }).catch(() => {
      apply({ addToGroups: prev });
      toast.error('Failed to update group invite policy');
    });
  },
  setReadReceipts: (readReceipts) => {
    apply({ readReceipts });
  },
  syncFromServer: async () => {
    try {
      const p = await getPrivacy();
      const lastSeen = p.lastSeenVisibility.toLowerCase() as LastSeenOption;
      const addToGroups = p.groupInvitePolicy.toLowerCase() as GroupAddOption;
      if (!['everyone', 'contacts', 'nobody'].includes(lastSeen)) return;
      if (!['everyone', 'contacts', 'nobody'].includes(addToGroups)) return;
      apply({ lastSeen, addToGroups });
    } catch {
      // Offline / server down: keep cached local values.
    }
  },
}));
