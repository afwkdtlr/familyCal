const TOKEN_KEY = "familycal_token";
const SAVED_LOGIN_KEY = "familycal_saved_login";
const AUTO_LOGIN_KEY = "familycal_auto_login";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export type SavedLogin = {
  username: string;
  password: string;
};

export function getSavedLogin(): SavedLogin | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SAVED_LOGIN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedLogin>;
    if (typeof parsed.username !== "string" || typeof parsed.password !== "string") {
      return null;
    }
    return { username: parsed.username, password: parsed.password };
  } catch {
    return null;
  }
}

export function setSavedLogin(username: string, password: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_LOGIN_KEY, JSON.stringify({ username, password }));
}

export function clearSavedLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAVED_LOGIN_KEY);
}

export function getAutoLogin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTO_LOGIN_KEY) === "true";
}

export function setAutoLogin(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.setItem(AUTO_LOGIN_KEY, "true");
  } else {
    localStorage.removeItem(AUTO_LOGIN_KEY);
  }
}

export function clearAutoLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTO_LOGIN_KEY);
}
