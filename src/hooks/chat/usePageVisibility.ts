import { useEffect, useRef } from 'react';
import { socketClient } from '@/lib/socket';
import { emitUserAway, emitUserBack } from '@/services/socket.service';

// Kontrak dengan BE (user-away / user-back, payload { conversationId }):
// - Room pertama kali terlihat / mount        -> user-back
// - Ganti room / unmount                       -> user-away
// - Tab hidden / window blur                   -> user-away
// - Tab visible / focus                        -> user-back
// - Guard `registered` -> emit idempotent, tanpa double-emit
// - Retry user-back setelah socket connect (jika masih registered & visible)
// - Fire-and-forget (tanpa ack), tidak menyentuh presence/isOnline
export function usePageVisibility(conversationId: string | null) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;

    const comeBack = () => {
      if (registeredRef.current) return;
      registeredRef.current = true;
      emitUserBack(conversationId);
    };

    const goAway = () => {
      if (!registeredRef.current) return;
      registeredRef.current = false;
      emitUserAway(conversationId);
    };

    const onVisibilityChange = () => {
      if (document.hidden) goAway();
      else comeBack();
    };

    const onBlur = () => goAway();
    const onFocus = () => comeBack();

    const onConnect = () => {
      if (registeredRef.current && document.visibilityState === 'visible') {
        emitUserBack(conversationId);
      }
    };

    if (document.visibilityState === 'visible') comeBack();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    socketClient.on('connect', onConnect);

    return () => {
      goAway();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      socketClient.off('connect', onConnect);
    };
  }, [conversationId]);
}