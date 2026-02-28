import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ChatContextType = {
  newChatKey: number;
  requestNewChat: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [newChatKey, setNewChatKey] = useState(0);
  const requestNewChat = useCallback(() => setNewChatKey((k) => k + 1), []);
  return (
    <ChatContext.Provider value={{ newChatKey, requestNewChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  return ctx ?? { newChatKey: 0, requestNewChat: () => {} };
}
