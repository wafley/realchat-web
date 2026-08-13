const DELETED_CHATS_KEY = 'hallowok-deleted-chats';

export function getDeletedChats(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_CHATS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function isChatDeleted(chatId: string): boolean {
  return getDeletedChats().has(chatId);
}

function persist(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_CHATS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function hideChats(chatIds: string[]): void {
  if (chatIds.length === 0) return;
  const deleted = getDeletedChats();
  for (const id of chatIds) deleted.add(id);
  persist(deleted);
}

export function unhideChat(chatId: string): void {
  const deleted = getDeletedChats();
  if (deleted.delete(chatId)) persist(deleted);
}
