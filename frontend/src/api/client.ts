const API_BASE = import.meta.env.VITE_API_URL || "/api";

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
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let msg: string;
    if (Array.isArray(err.detail)) {
      msg = err.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ");
    } else if (typeof err.detail === "string") {
      msg = err.detail;
    } else if (err.detail && typeof err.detail === "object") {
      msg = (err.detail as { msg?: string }).msg ?? JSON.stringify(err.detail);
    } else {
      msg = res.statusText || "Request failed";
    }
    throw new Error(msg);
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
