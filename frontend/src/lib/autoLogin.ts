import { apiJson } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";
import { clearAutoLogin, getAutoLogin, getSavedLogin, getToken, setToken } from "@/lib/storage";

/** 자동 로그인 설정이 있으면 로그인 API 호출 후 토큰 저장. 성공 시 true. */
export async function trySilentLogin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (getToken()) return true;
  const saved = getSavedLogin();
  const auto = getAutoLogin();
  if (!auto || !saved?.username || !saved?.password) return false;
  try {
    const res = await apiJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: saved.username, password: saved.password })
    });
    setToken(res.token);
    return true;
  } catch {
    clearAutoLogin();
    return false;
  }
}
