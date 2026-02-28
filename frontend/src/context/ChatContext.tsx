import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import type { ArchivedChat } from "../types/chatHistory";
import {
  CHAT_HISTORY_STORAGE_KEY,
  CHAT_HISTORY_MAX_ITEMS,
} from "../types/chatHistory";

export interface CurrentChatData {
  symbol: string;
  messages: { role: "user" | "assistant"; content: string }[];
  sessionId: string | null;
}

type ChatContextType = {
  newChatKey: number;
  requestNewChat: () => void;
  chatHistory: ArchivedChat[];
  addToHistory: (chat: Omit<ArchivedChat, "id" | "lastMessageAt">) => void;
  registerGetCurrentChatData: (fn: (() => CurrentChatData | null) | null) => void;
  getChatById: (id: string) => ArchivedChat | undefined;
  activeChatId: string | null;
  selectChatFromHistory: (id: string | null) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

function loadHistory(): ArchivedChat[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArchivedChat[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history: ArchivedChat[]) {
  try {
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [newChatKey, setNewChatKey] = useState(0);
  const [chatHistory, setChatHistory] = useState<ArchivedChat[]>(loadHistory);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const getCurrentChatDataRef = useRef<(() => CurrentChatData | null) | null>(
    null
  );

  useEffect(() => {
    saveHistory(chatHistory);
  }, [chatHistory]);

  const registerGetCurrentChatData = useCallback(
    (fn: (() => CurrentChatData | null) | null) => {
      getCurrentChatDataRef.current = fn;
    },
    []
  );

  const addToHistory = useCallback(
    (chat: Omit<ArchivedChat, "id" | "lastMessageAt">) => {
      const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const lastMessageAt = Date.now();
      const entry: ArchivedChat = { ...chat, id, lastMessageAt };
      setChatHistory((prev) => {
        const next = [entry, ...prev].slice(0, CHAT_HISTORY_MAX_ITEMS);
        return next;
      });
    },
    []
  );

  const requestNewChat = useCallback(() => {
    const data = getCurrentChatDataRef.current?.() ?? null;
    if (data && data.messages.length > 0) {
      const firstUser = data.messages.find((m) => m.role === "user");
      const title =
        (firstUser?.content?.slice(0, 60)?.trim() || `Chat about ${data.symbol}`) +
        (firstUser && firstUser.content.length > 60 ? "…" : "");
      addToHistory({
        symbol: data.symbol,
        title,
        messages: data.messages,
        sessionId: data.sessionId,
      });
    }
    setActiveChatId(null);
    setNewChatKey((k) => k + 1);
  }, [addToHistory]);

  const getChatById = useCallback(
    (id: string) => chatHistory.find((c) => c.id === id),
    [chatHistory]
  );

  const selectChatFromHistory = useCallback((id: string | null) => {
    setActiveChatId(id);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        newChatKey,
        requestNewChat,
        chatHistory,
        addToHistory,
        registerGetCurrentChatData,
        getChatById,
        activeChatId,
        selectChatFromHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  return (
    ctx ?? {
      newChatKey: 0,
      requestNewChat: () => {},
      chatHistory: [],
      addToHistory: () => {},
      registerGetCurrentChatData: () => {},
      getChatById: () => undefined,
      activeChatId: null,
      selectChatFromHistory: () => {},
    }
  );
}
