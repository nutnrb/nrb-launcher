import { invoke } from "@tauri-apps/api/core";

export interface Program {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  iconUrl: string | null;
  latestVersion: string;
  fileSize: string;
  creditPerUse: number;
  creditPerMinute: string | null;
  requiresSubscription: boolean;
  latestDownload: {
    version: string;
    size: string;
    downloadPath: string;
    sha256: string;
  } | null;
}

export interface WalletData {
  credits: string;
  balance: number;
}

const HUB_URL = import.meta.env.VITE_HUB_URL || "https://hub.nutnrb.com";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("nrb_token", token);
  } else {
    localStorage.removeItem("nrb_token");
  }
}

export function loadAuthToken(): string | null {
  const t = localStorage.getItem("nrb_token");
  if (t) authToken = t;
  return authToken;
}

async function callHub<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HUB_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listPrograms(): Promise<{ programs: Program[] }> {
  return callHub("/api/v1/programs");
}

export async function getWallet(): Promise<WalletData> {
  return callHub("/api/v1/wallet");
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  return invoke("login", { email, password });
}

export async function logout(): Promise<void> {
  await invoke("logout");
  setAuthToken(null);
}
