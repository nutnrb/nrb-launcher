// Login state helpers — localStorage backed, plus postMessage bridge to Hub iframe.

const LS_KEY = "nrb.auth.v1";

export interface AuthUser {
  name?: string | null;
  email?: string | null;
  /** Optional role / sub; launcher doesn't care — just shows the pill. */
  role?: string | null;
  avatarLetter?: string | null;
  loggedInAt?: string;
  /** "dev-override" when the user clicked the simulator button. */
  source?: string;
}

export function loadAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.email && !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(user: AuthUser): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(user));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Subscribe to postMessage events from the Hub login iframe.
 * Returns the unsubscribe function.
 */
export function onHubMessage(
  cb: (msg: { type: string; user?: AuthUser }) => void,
): () => void {
  function handler(ev: MessageEvent) {
    const data = ev.data as { type?: string; user?: AuthUser } | null;
    if (!data || typeof data !== "object") return;
    if (typeof data.type !== "string") return;
    if (!data.type.startsWith("hub-")) return;
    cb({ type: data.type, user: data.user });
  }
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
