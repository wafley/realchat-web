import { useEffect, useRef } from 'react';
import { socketClient } from '@/lib/socket';
import { isChatViewportAtBottom, subscribeViewport } from '@/lib/chatViewport';
import { emitUserAway, emitUserBack } from '@/services/socket.service';

// Kontrak dengan BE (user-away / user-back, payload { conversationId }):
// "Sedang melihat" = dokumen visible+focus DAN viewport di dekat bottom.
// - viewing true  -> user-back (terdaftar active viewer; pesan baru = SEEN)
// - viewing false -> user-away (tab hidden/blur ATAU sedang scroll ke atas)
// - Retry user-back setelah socket connect (jika masih registered & aktif)
// - Fire-and-forget (tanpa ack), tidak menyentuh presence/isOnline
function isDocumentActive(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus();
}

export function usePageVisibility(conversationId: string | null) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;

    const sync = () => {
      const viewing = isDocumentActive() && isChatViewportAtBottom(conversationId);
      if (viewing && !registeredRef.current) {
        registeredRef.current = true;
        emitUserBack(conversationId);
      } else if (!viewing && registeredRef.current) {
        registeredRef.current = false;
        emitUserAway(conversationId);
      }
    };

    const onConnect = () => {
      if (registeredRef.current && isDocumentActive()) {
        emitUserBack(conversationId);
      }
    };

    sync();
    const unsubscribeViewport = subscribeViewport(sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('blur', sync);
    socketClient.on('connect', onConnect);

    return () => {
      if (registeredRef.current) {
        registeredRef.current = false;
        emitUserAway(conversationId);
      }
      unsubscribeViewport();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('blur', sync);
      socketClient.off('connect', onConnect);
    };
  }, [conversationId]);
}
