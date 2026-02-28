const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

function getToken(): string | null {
  return localStorage.getItem("tradsy_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (e) {
    const msg =
      e instanceof TypeError && e.message === "Failed to fetch"
        ? "Network error. The server may be unreachable—check your connection or try again later."
        : e instanceof Error
          ? e.message
          : "Network error";
    throw new Error(msg);
  }
  if (!res.ok) {
    const text = await res.text();
    let err: { detail?: unknown };
    try {
      err = text ? JSON.parse(text) : {};
    } catch {
      err = { detail: text || res.statusText };
    }
    if (typeof err.detail === "string") {
      throw new Error(err.detail);
    }
    if (Array.isArray(err.detail)) {
      const msg = err.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ");
      throw new Error(msg);
    }
    if (err.detail && typeof err.detail === "object" && "msg" in err.detail) {
      throw new Error((err.detail as { msg?: string }).msg ?? JSON.stringify(err.detail));
    }
    throw new Error(res.statusText || "Request failed");
  }
  return res.json();
}

export const auth = {
  register: (data: { first_name: string; email: string; password: string }) =>
    api<{ access_token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  requestPasswordReset: (data: { email: string }) =>
    api<{ ok: boolean }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const users = {
  me: () => api<{ id: number; email: string; first_name: string | null; email_verified: boolean; is_active: boolean }>("/users/me"),
  profile: () =>
    api<{
      risk_tolerance: string | null;
      experience_level: string | null;
      onboarding_completed: boolean;
      custom_strategy_description: string | null;
      selected_guru_id: number | null;
      selected_strategy_id: number | null;
    }>("/users/me/profile"),
};

export const onboarding = {
  status: () =>
    api<{ onboarding_completed: boolean; step: number }>("/onboarding/status"),
  step1: (data: {
    first_name: string;
    risk_tolerance: string;
    experience_level: string;
    risk_disclaimer_accepted: boolean;
  }) =>
    api<{ ok: boolean; next_step: number }>("/onboarding/step1", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  step2: (data: {
    custom_strategy_description?: string | null;
    selected_guru_id?: number | null;
    selected_strategy_id?: number | null;
  }) =>
    api<{ ok: boolean; onboarding_completed: boolean }>("/onboarding/step2", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const strategies = {
  list: (guruId?: number) =>
    api<{ id: number; guru_id: number; name: string; strategy_type: string | null }[]>(
      guruId != null ? `/strategies?guru_id=${guruId}` : "/strategies"
    ),
  similar: (strategyId: number) =>
    api<{ id: number; guru_id: number; name: string; strategy_type: string | null }[]>(
      `/strategies/similar?strategy_id=${strategyId}`
    ),
};

export const chart = {
  bars: (params: { symbol: string; from_ts: number; to_ts: number; resolution?: string }) => {
    const q = new URLSearchParams({
      symbol: params.symbol,
      from_ts: String(params.from_ts),
      to_ts: String(params.to_ts),
      resolution: params.resolution ?? "1D",
    });
    return api<{ s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }>(
      `/chart/bars?${q}`
    );
  },
  symbol: (symbol: string) =>
    api<{ name: string; exchange: string; type: string; description: string }>(`/chart/symbol?symbol=${encodeURIComponent(symbol)}`),
};

export const gurus = {
  list: () =>
    api<{ id: number; name: string; slug: string; description: string | null; image_url: string | null }[]>("/gurus"),
  strategies: (guruId: number) =>
    api<{ id: number; guru_id: number; name: string; strategy_type: string | null }[]>(
      `/gurus/${guruId}/strategies`
    ),
  similar: (guruId: number) =>
    api<{ id: number; name: string; slug: string; description: string | null; image_url: string | null }[]>(
      `/gurus/similar?guru_id=${guruId}`
    ),
};

/** Chat with AI: session_id for continuity; symbol for symbol-specific context. */
export type ChatMessage = { role: "user" | "assistant"; content: string };

export const chat = {
  /** Non-streaming: single request/response. */
  send: (params: {
    message: string;
    session_id?: string | null;
    symbol?: string | null;
  }) =>
    api<{ reply: string; session_id: string; intent_task?: string; usage_tokens?: number }>(
      "/chat/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message: params.message,
          session_id: params.session_id ?? undefined,
          symbol: params.symbol ?? undefined,
          stream: false,
        }),
      }
    ),

  /** Deep analysis for a symbol; returns structured analysis. */
  deepAnalysis: (params: { symbol: string; timeframe?: string }) =>
    api<{ symbol: string; timeframe: string; analysis: string }>("/chat/deep-analysis", {
      method: "POST",
      body: JSON.stringify({ symbol: params.symbol, timeframe: params.timeframe ?? "1D" }),
    }),

  /** Stream tokens via SSE; yields { type, text?, session_id? }. */
  async *streamMessages(params: {
    message: string;
    session_id?: string | null;
    symbol?: string | null;
  }): AsyncGenerator<{ type: string; text?: string; session_id?: string }> {
    const token = getToken();
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: params.message,
        session_id: params.session_id ?? undefined,
        symbol: params.symbol ?? undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? res.statusText);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const dec = new TextDecoder();
    let buf = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (value) buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as { type: string; text?: string; session_id?: string };
              yield data;
            } catch {
              // skip non-json
            }
          }
        }
        if (done) break;
      }
      if (buf.trim().startsWith("data: ")) {
        try {
          const data = JSON.parse(buf.trim().slice(6)) as { type: string; text?: string; session_id?: string };
          yield data;
        } catch {
          // ignore
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
