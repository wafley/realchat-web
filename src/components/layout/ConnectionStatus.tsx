import { useSocketStore } from '@/store/socketStore';
import { WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const isConnected = useSocketStore((s) => s.isConnected);

  if (isConnected) return null;

  return (
    <WifiOff
      size={14}
      className="shrink-0 animate-pulse text-destructive"
      aria-label="Reconnecting..."
    />
  );
}
