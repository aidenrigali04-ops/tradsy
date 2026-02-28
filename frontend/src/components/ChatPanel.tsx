import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { chat, type ChatMessage } from "../api/client";
import RiskWarningCard from "./RiskWarningCard";
import ExecutionProgressCard from "./ExecutionProgressCard";

const SESSION_KEY = "tradsy_chat_session_id";

const GENERATING_STEP_LABELS: { id: string; label: string; status: "pending" }[] = [
  { id: "analyze", label: "Analyzing market data", status: "pending" },
  { id: "chart", label: "Chart analysis completed", status: "pending" },
  { id: "tradingview", label: "Applying execution on Trading View", status: "pending" },
];

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
  containerFullScreen: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    background: "#fff",
    overflow: "hidden",
  },
  welcomeCenter: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  welcomeTitle: { fontSize: 28, fontWeight: 600, color: "#111", textAlign: "center" },
  welcomeSub: { fontSize: 15, color: "#666", textAlign: "center", maxWidth: 480 },
  examplePrompts: { display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 520 },
  examplePrompt: {
    padding: "14px 18px",
    background: "#f5f5f5",
    border: "1px solid #eee",
    borderRadius: 12,
    fontSize: 14,
    color: "#333",
    textAlign: "left",
    cursor: "pointer",
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
  loadingBubble: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "14px 18px",
    background: "#f0f0f0",
    borderRadius: 12,
    maxWidth: "fit-content",
  },
  loadingDots: { display: "flex", alignItems: "center", gap: 5 },
  error: { padding: 8, fontSize: 14, color: "#c00", background: "#fee", borderRadius: 8, marginTop: 8 },
  empty: { padding: 24, textAlign: "center", color: "#888", fontSize: 15 },
};

const EXAMPLE_PROMPTS = [
  "Using my strategy, find a good entry for AAPL.",
  "What's the current risk/reward on this setup?",
  "Summarize key levels and suggest a stop loss.",
  "I want to execute the current trade—confirm size and risk.",
];

type Props = {
  symbol?: string | null;
  symbolLabel?: string;
  placeholder?: string;
  resetKey?: number;
  /** When set, this message is sent through the chat (e.g. execution request); clear after send. */
  triggerMessage?: string;
  onTriggerSent?: () => void;
  /** Full-screen chat (e.g. main Chat page); no border, welcome + example prompts. */
  fullScreen?: boolean;
  userName?: string;
};

export default function ChatPanel({
  symbol = null,
  symbolLabel = "AAPL",
  placeholder = "Using my strategy, find a good entry...",
  resetKey = 0,
  triggerMessage,
  onTriggerSent,
  fullScreen = false,
  userName,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [riskCard, setRiskCard] = useState<{ symbol: string; probability_loss_pct: number; balance: number; message: string } | null>(null);
  const [executionState, setExecutionState] = useState<{
    executionId: string;
    symbol: string;
    steps: { id: string; label: string; status: string }[];
    allCompleted: boolean;
  } | null>(null);
  const [generatingSteps, setGeneratingSteps] = useState<{ id: string; label: string; status: string }[] | null>(null);
  const generatingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const executionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** Only show full 3-step card for trading analysis (Deep Analysis / Strategy); regular chat uses 3-dot only */
  const loadingKindRef = useRef<"chat" | "analysis">("chat");

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
      setRiskCard(null);
      setExecutionState(null);
      setGeneratingSteps(null);
      generatingTimersRef.current.forEach(clearTimeout);
      generatingTimersRef.current = [];
      if (executionPollRef.current) {
        clearInterval(executionPollRef.current);
        executionPollRef.current = null;
      }
    }
  }, [resetKey]);

  const generatingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) {
      if (generatingClearRef.current) {
        clearTimeout(generatingClearRef.current);
        generatingClearRef.current = null;
      }
      if (loadingKindRef.current === "analysis") {
        setGeneratingSteps(GENERATING_STEP_LABELS.map((s) => ({ ...s })));
        const t1 = setTimeout(() => {
          setGeneratingSteps((prev) =>
            prev ? prev.map((s, i) => (i === 0 ? { ...s, status: "completed" } : s)) : prev
          );
        }, 900);
        const t2 = setTimeout(() => {
          setGeneratingSteps((prev) =>
            prev ? prev.map((s, i) => (i === 1 ? { ...s, status: "completed" } : s)) : prev
          );
        }, 2400);
        generatingTimersRef.current = [t1, t2];
      } else {
        setGeneratingSteps(null);
      }
      return () => {
        generatingTimersRef.current.forEach(clearTimeout);
        generatingTimersRef.current = [];
      };
    } else {
      setGeneratingSteps((prev) => {
        if (!prev) return null;
        return prev.map((s, i) => (i === 2 ? { ...s, status: "completed" as const } : s));
      });
      generatingClearRef.current = setTimeout(() => {
        setGeneratingSteps(null);
        generatingClearRef.current = null;
      }, 500);
      return () => {
        if (generatingClearRef.current) {
          clearTimeout(generatingClearRef.current);
          generatingClearRef.current = null;
        }
      };
    }
  }, [loading]);

  const handleRiskCheck = () => {
    const sym = symbol ?? "AAPL";
    setError(null);
    chat.riskAssessment({ symbol: sym })
      .then((r) => setRiskCard({ symbol: r.symbol, probability_loss_pct: r.probability_loss_pct, balance: r.balance, message: r.message }))
      .catch((e) => setError(e instanceof Error ? e.message : "Risk check failed"));
  };

  const handleApplyRiskManagement = () => {
    const sym = symbol ?? "AAPL";
    setError(null);
    setRiskCard(null);
    chat.executionStart({ symbol: sym })
      .then((r) => {
        setExecutionState({
          executionId: r.execution_id,
          symbol: r.symbol,
          steps: r.steps,
          allCompleted: false,
        });
        executionPollRef.current = setInterval(() => {
          chat.executionStatus(r.execution_id).then((status) => {
            setExecutionState({
              executionId: status.execution_id,
              symbol: status.symbol,
              steps: status.steps,
              allCompleted: status.all_completed,
            });
            if (status.all_completed && executionPollRef.current) {
              clearInterval(executionPollRef.current);
              executionPollRef.current = null;
            }
          }).catch(() => {});
        }, 1500);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Execution start failed"));
  };

  useEffect(() => {
    return () => {
      if (executionPollRef.current) {
        clearInterval(executionPollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, riskCard, executionState, generatingSteps]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    loadingKindRef.current = "chat";
    setLoading(true);
    setStreamingContent("");

    const addAssistantMessage = (content: string) => {
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    };

    try {
      const res = await chat.send({
        message: text,
        session_id: sessionId,
        symbol: symbol ?? undefined,
      });
      setSessionId(res.session_id);
      addAssistantMessage(res.reply);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Failed to send. Try again.";
      setError(errMsg);
      addAssistantMessage(`Error: ${errMsg}`);
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
    loadingKindRef.current = "analysis";
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
    loadingKindRef.current = "analysis";
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

  const containerStyle = fullScreen ? styles.containerFullScreen : styles.container;

  return (
    <div style={containerStyle}>
      <div style={styles.messages}>
        {messages.length === 0 && !loading && fullScreen && (
          <div style={styles.welcomeCenter}>
            <h2 style={styles.welcomeTitle}>
              Hi{userName ? ` ${userName}` : ""}, what do you want to trade?
            </h2>
            <p style={styles.welcomeSub}>
              Ask Tradsy for analysis, entries, or strategy. Get ideas and execution context—ChatGPT for traders.
            </p>
            <div style={styles.examplePrompts}>
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  style={styles.examplePrompt}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.length === 0 && !loading && !fullScreen && (
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
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 8px 0" }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
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
        {riskCard && (
          <div style={styles.messageRow}>
            <RiskWarningCard
              symbol={riskCard.symbol}
              probabilityLossPct={riskCard.probability_loss_pct}
              balance={riskCard.balance}
              message={riskCard.message}
              onApplyRiskManagement={handleApplyRiskManagement}
            />
          </div>
        )}
        {executionState && (
          <div style={styles.messageRow}>
            <ExecutionProgressCard
              symbol={executionState.symbol}
              steps={executionState.steps}
              allCompleted={executionState.allCompleted}
              showLoadingDots={!executionState.allCompleted}
            />
          </div>
        )}
        {generatingSteps && (
          <div style={styles.messageRow}>
            <ExecutionProgressCard
              symbol={symbol ?? "AAPL"}
              steps={generatingSteps}
              allCompleted={generatingSteps.every((s) => s.status === "completed")}
              showLoadingDots={!generatingSteps.every((s) => s.status === "completed")}
              subtitle={`Generating analysis for ${symbol ?? "AAPL"}`}
            />
          </div>
        )}
        {loading && !streamingContent && !generatingSteps && (
          <div style={styles.messageRow}>
            <div>
              <div style={styles.label}>Tradsy</div>
              <div style={styles.loadingBubble}>
                <div style={styles.loadingDots} aria-hidden="true">
                  <span className="tradsy-typing-dot" />
                  <span className="tradsy-typing-dot" />
                  <span className="tradsy-typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}
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
          <button
            type="button"
            style={{ ...styles.pill, ...(loading ? styles.pillDisabled : {}) }}
            onClick={handleRiskCheck}
            disabled={loading}
          >
            Risk check
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
