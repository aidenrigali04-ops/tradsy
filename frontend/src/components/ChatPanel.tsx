import { useState, useRef, useEffect } from "react";
import { chat, type ChatMessage } from "../api/client";

const SESSION_KEY = "tradsy_chat_session_id";

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 360,
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
  inputSection: {
    padding: 16,
    borderTop: "1px solid #eee",
    background: "#fafafa",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 52,
  },
  symbolIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "12px 0",
    fontSize: 15,
    resize: "none",
    minHeight: 28,
    maxHeight: 100,
    background: "transparent",
  },
  sendBtn: {
    width: 40,
    height: 40,
    padding: 0,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#111",
  },
  addBtn: {
    position: "absolute" as const,
    top: -8,
    right: 48,
    width: 28,
    height: 28,
    padding: 0,
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
  },
  pillsRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  pill: {
    padding: "8px 16px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  pillDisabled: { opacity: 0.6, cursor: "not-allowed" },
  iconBtn: {
    width: 32,
    height: 32,
    padding: 0,
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    marginLeft: 4,
  },
  loading: { padding: 8, fontSize: 14, color: "#666" },
  error: { padding: 8, fontSize: 14, color: "#c00", background: "#fee", borderRadius: 8, marginTop: 8 },
  empty: { padding: 24, textAlign: "center", color: "#888", fontSize: 15 },
};

type Props = {
  symbol?: string | null;
  symbolLabel?: string;
  placeholder?: string;
  resetKey?: number;
  /** When set, this message is sent through the chat (e.g. execution request); clear after send. */
  triggerMessage?: string;
  onTriggerSent?: () => void;
};

export default function ChatPanel({
  symbol = null,
  symbolLabel = "AAPL",
  placeholder = "Using my strategy, find a good entry...",
  resetKey = 0,
  triggerMessage,
  onTriggerSent,
}: Props) {
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
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

  const handleSend = () => sendMessage(input.trim());

  const handleDeepAnalysis = async () => {
    const sym = symbol ?? "AAPL";
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: `Deep analysis for ${sym}` }]);
    setLoading(true);
    try {
      const res = await chat.deepAnalysis({ symbol: sym, timeframe: "1D" });
      setMessages((prev) => [...prev, { role: "assistant", content: res.analysis }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deep analysis failed.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleStrategy = () => {
    const text = "Using my strategy, analyze the current setup and suggest a good entry.";
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const msg = triggerMessage?.trim();
    if (msg && !loading) {
      onTriggerSent?.();
      sendMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when triggerMessage is set by parent
  }, [triggerMessage]);

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
      <div style={styles.inputSection}>
        <div style={styles.inputWrapper}>
          <div style={styles.symbolIcon} title={symbolLabel}>
            🍎
          </div>
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
            style={styles.sendBtn}
            onClick={handleSend}
            disabled={loading}
            title="Send"
            aria-label="Send"
          >
            ◆
          </button>
          <button type="button" style={styles.addBtn} title="Add" aria-label="Add">
            +
          </button>
        </div>
        <div style={styles.pillsRow}>
          <button
            type="button"
            style={{ ...styles.pill, ...(loading ? styles.pillDisabled : {}) }}
            onClick={handleDeepAnalysis}
            disabled={loading}
          >
            Deep Analysis
          </button>
          <button
            type="button"
            style={{ ...styles.pill, ...(loading ? styles.pillDisabled : {}) }}
            onClick={handleStrategy}
            disabled={loading}
          >
            Strategy
          </button>
          <button type="button" style={styles.iconBtn} title="TradingView">
            TV
          </button>
          <button type="button" style={styles.iconBtn} title="More">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
