const CLEARED_CHATS_KEY = 'hallowok-cleared-chats';

export function getClearedChats(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CLEARED_CHATS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function isChatCleared(chatId: string): string | null {
  return getClearedChats()[chatId] ?? null;
}

export function markChatCleared(chatId: string): void {
  const cleared = getClearedChats();
  cleared[chatId] = new Date().toISOString();
  localStorage.setItem(CLEARED_CHATS_KEY, JSON.stringify(cleared));
}
