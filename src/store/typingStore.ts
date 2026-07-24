import { create } from 'zustand';

interface TypingState {
  typingMap: Record<string, boolean>;
  setTyping: (chatId: string, typing: boolean) => void;
}

export const useTypingStore = create<TypingState>((set) => ({
  typingMap: {},
  setTyping: (chatId, typing) =>
    set((state) => ({
      typingMap: { ...state.typingMap, [chatId]: typing },
    })),
}));
