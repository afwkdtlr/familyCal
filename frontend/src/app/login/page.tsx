"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trySilentLogin } from "@/lib/autoLogin";
import { apiJson } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";
import {
  clearAutoLogin,
  clearSavedLogin,
  getAutoLogin,
  getSavedLogin,
  getToken,
  setAutoLogin,
  setSavedLogin,
  setToken
} from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(false);
  const [autoLogin, setAutoLoginState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/");
      return;
    }

    const saved = getSavedLogin();
    const auto = getAutoLogin();

    if (saved) {
      setUsername(saved.username);
      setPassword(saved.password);
      setRememberLogin(true);
    }
    if (auto) {
      setAutoLoginState(true);
    }

    if (!auto || !saved) {
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const ok = await trySilentLogin();
      if (cancelled) return;
      if (ok) {
        setLoading(false);
        router.replace("/");
        return;
      }
      setError("자동 로그인에 실패했습니다. 아이디와 비밀번호를 확인한 뒤 다시 로그인해 주세요.");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      const persistCredentials = rememberLogin || autoLogin;
      if (persistCredentials) {
        setSavedLogin(username, password);
      } else {
        clearSavedLogin();
        clearAutoLogin();
      }
      if (autoLogin) {
        setAutoLogin(true);
      } else {
        clearAutoLogin();
      }
      setToken(res.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>FamilyCal</div>
        <div className="pill" style={{ marginBottom: 14 }}>
          관리자가 부여한 계정으로 로그인합니다.
        </div>
        <div className="field">
          <div className="label">아이디</div>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <div className="label">비밀번호</div>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <label className="row" style={{ gap: 8, marginBottom: 6 }}>
          <input type="checkbox" checked={rememberLogin} onChange={(e) => setRememberLogin(e.target.checked)} />
          <span className="pill">아이디/비밀번호 저장하기</span>
        </label>
        <label className="row" style={{ gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => {
              const on = e.target.checked;
              setAutoLoginState(on);
              if (on) {
                setRememberLogin(true);
              }
            }}
          />
          <span className="pill">자동 로그인</span>
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 6 }}>
          로그인
        </button>
      </form>
    </div>
  );
}
