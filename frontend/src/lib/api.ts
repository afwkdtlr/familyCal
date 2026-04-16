import { clearToken, getToken } from "./storage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? resolveApiBase();

function resolveApiBase() {
  if (typeof window === "undefined") {
    return "http://localhost:11115";
  }
  return `${window.location.protocol}//${window.location.hostname}:11115`;
}

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearToken();
  }
  const text = await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, text);
  }
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
