// Pelacak posisi viewport per chat: apakah user sedang berada di dekat bottom
// daftar pesan. Dipakai bersama oleh MessageList (penulis), socket.service
// (keputusan kirim message:seen), dan usePageVisibility (user-away/user-back).

const viewportState = new Map<string, boolean>();
const listeners = new Set<() => void>();

export function setChatViewport(chatId: string, nearBottom: boolean): void {
  if (viewportState.get(chatId) === nearBottom) return;
  viewportState.set(chatId, nearBottom);
  listeners.forEach((fn) => fn());
}

// Default true saat belum ada laporan: perilaku seen sama seperti sebelumnya
// sampai MessageList sempat melaporkan posisi.
export function isChatViewportAtBottom(chatId: string): boolean {
  return viewportState.get(chatId) ?? true;
}

export function subscribeViewport(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
