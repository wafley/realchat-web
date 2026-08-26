export type LastSeenOption = 'everyone' | 'contacts' | 'nobody';
export type GroupAddOption = 'everyone' | 'contacts' | 'nobody';

export interface PrivacySettings {
  lastSeen: LastSeenOption;
  addToGroups: GroupAddOption;
  readReceipts: boolean;
}
