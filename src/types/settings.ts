export interface PrivacySettings {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  addToGroups: 'everyone' | 'contacts';
  readReceipts: boolean;
}

export type LastSeenOption = PrivacySettings['lastSeen'];
export type GroupAddOption = PrivacySettings['addToGroups'];
