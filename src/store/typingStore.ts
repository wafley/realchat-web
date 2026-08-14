import { create } from 'zustand';

export interface TypingUser {
  userId: string;
  name: string;
}

interface TypingState {
  typingMap: Record<string, TypingUser[]>;
  setTyping: (chatId: string, typing: boolean, user: TypingUser) => void;
  clearTyping: (chatId: string) => void;
}

export const useTypingStore = create<TypingState>((set) => ({
  typingMap: {},
  setTyping: (chatId, typing, user) =>
    set((state) => {
      const current = state.typingMap[chatId] ?? [];
      if (!typing) {
        return {
          typingMap: {
            ...state.typingMap,
            [chatId]: current.filter((t) => t.userId !== user.userId),
          },
        };
      }
      if (current.some((t) => t.userId === user.userId)) return state;
      return {
        typingMap: { ...state.typingMap, [chatId]: [...current, user] },
      };
    }),
  clearTyping: (chatId) =>
    set((state) => {
      if (!state.typingMap[chatId]) return state;
      const next = { ...state.typingMap };
      delete next[chatId];
      return { typingMap: next };
    }),
}));

export function formatTypingLabel(names: string[]): string {
  const known = names.filter((n) => n && n !== 'Unknown');
  if (known.length === 0) return 'Typing...';
  if (known.length === 1) return `${known[0]} is typing...`;
  if (known.length === 2) return `${known[0]} and ${known[1]} are typing...`;
  return `${known[0]} and ${known.length - 1} others are typing...`;
}