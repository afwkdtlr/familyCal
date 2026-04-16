"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiJson } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";
import { setToken } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
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
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 6 }}>
          로그인
        </button>
      </form>
    </div>
  );
}
