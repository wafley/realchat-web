import { usePrivacyStore } from '@/store/privacyStore';

export function shouldShowLastSeen(): boolean {
  const { lastSeen } = usePrivacyStore.getState();
  return lastSeen !== 'nobody';
}
