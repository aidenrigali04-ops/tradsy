/**
 * Chat history types for archiving and restoring conversations by symbol.
 */

export interface ArchivedChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ArchivedChat {
  id: string;
  symbol: string;
  title: string;
  lastMessageAt: number;
  messages: ArchivedChatMessage[];
  sessionId?: string | null;
}

export const CHAT_HISTORY_STORAGE_KEY = "tradsy_chat_history";
export const CHAT_HISTORY_MAX_ITEMS = 50;
