import { useState, useRef, useEffect } from "react";
import { chat, type ChatMessage } from "../api/client";

const SESSION_KEY = "tradsy_chat_session_id";

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 320,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #eee",
    overflow: "hidden",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  messageRow: { display: "flex", justifyContent: "flex-start" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: 12,
    fontSize: 15,
    lineHeight: 1.5,
  },
  bubbleAssistant: { background: "#f0f0f0", color: "#111" },
  bubbleUser: { background: "#111", color: "#fff" },
  label: { fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 600 },
  inputRow: {
    padding: 12,
    borderTop: "1px solid #eee",
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    background: "#fafafa",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 15,
    resize: "none",
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    padding: "12px 20px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
  sendBtnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  loading: { padding: 8, fontSize: 14, color: "#666" },
  error: { padding: 8, fontSize: 14, color: "#c00", background: "#fee" },
  empty: { padding: 24, textAlign: "center", color: "#888", fontSize: 15 },
};

type Props = {
  symbol?: string | null;
  placeholder?: string;
  /** When this key changes, conversation is reset (e.g. from "New chat"). */
  resetKey?: number;
};

export default function ChatPanel({ symbol = null, placeholder = "Using my strategy, find a good entry...", resetKey = 0 }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sessionId) sessionStorage.setItem(SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (resetKey > 0) {
      sessionStorage.removeItem(SESSION_KEY);
      setSessionId(null);
      setMessages([]);
      setError(null);
      setStreamingContent("");
    }
  }, [resetKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setStreamingContent("");

    try {
      try {
        const gen = chat.streamMessages({
          message: text,
          session_id: sessionId,
          symbol: symbol ?? undefined,
        });
        let fullReply = "";
        for await (const event of gen) {
          if (event.type === "token" && event.text) {
            fullReply += event.text;
            setStreamingContent(fullReply);
          }
          if (event.type === "done" && event.session_id) {
            setSessionId(event.session_id);
          }
          if (event.type === "error" || event.type === "refused") {
            setError(event.text ?? "Something went wrong.");
            break;
          }
        }
        if (fullReply) {
          setMessages((prev) => [...prev, { role: "assistant", content: fullReply }]);
        }
      } catch {
        const fallback = await chat.send({
          message: text,
          session_id: sessionId,
          symbol: symbol ?? undefined,
        });
        setSessionId(fallback.session_id);
        setMessages((prev) => [...prev, { role: "assistant", content: fallback.reply }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send. Try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setStreamingContent("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.length === 0 && !loading && (
          <div style={styles.empty}>
            Ask Tradsy anything—analysis, entries, or strategy. Example: &ldquo;{placeholder}&rdquo;
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ ...styles.messageRow, ...(m.role === "user" ? styles.messageRowUser : {}) }}
          >
            <div>
              <div style={styles.label}>{m.role === "user" ? "You" : "Tradsy"}</div>
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant),
                }}
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && streamingContent && (
          <div style={styles.messageRow}>
            <div>
              <div style={styles.label}>Tradsy</div>
              <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
                {streamingContent}
                <span style={{ opacity: 0.6 }}>▌</span>
              </div>
            </div>
          </div>
        )}
        {loading && !streamingContent && <div style={styles.loading}>Thinking...</div>}
        {error && <div style={styles.error}>{error}</div>}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputRow}>
        <textarea
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={loading}
        />
        <button
          type="button"
          style={{ ...styles.sendBtn, ...(loading ? styles.sendBtnDisabled : {}) }}
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
