export function formatLastSeen(date?: Date | null): string | null {
  if (!date) return null;
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 2) return '1m ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 2) return '1h ago';
  if (hours < 24) return `${hours}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const lastDate = new Date(date);
  lastDate.setHours(0, 0, 0, 0);
  if (lastDate.getTime() === yesterday.getTime()) return 'yesterday';
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  return lastDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
