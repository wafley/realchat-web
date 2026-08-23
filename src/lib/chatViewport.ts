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

// Halaman dianggap aktif hanya jika visible DAN punya focus window.
export function isDocumentActive(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus();
}

// Penerima benar-benar "melihat" chat: dokumen aktif DAN viewport di bottom.
export function isChatViewable(chatId: string): boolean {
  return isDocumentActive() && isChatViewportAtBottom(chatId);
}

// Hapus state viewport saat keluar chat agar tidak ada sisa entry basi.
// Sengaja tanpa notifikasi listener: hanya dipanggil saat unmount.
export function clearChatViewport(chatId: string): void {
  viewportState.delete(chatId);
}
