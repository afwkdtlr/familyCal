"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trySilentLogin } from "@/lib/autoLogin";
import { apiJson } from "@/lib/api";
import { clearAutoLogin, clearToken, getToken } from "@/lib/storage";
import type { GroupResponse, MeResponse, UserRole, UserSummaryResponse } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [me, setMe] = useState<MeResponse | null>(null);
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("USER");

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const [memberGroupId, setMemberGroupId] = useState<string>("");
  const [memberUserId, setMemberUserId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!getToken()) {
          const ok = await trySilentLogin();
          if (cancelled) return;
          if (!ok) {
            routerRef.current.replace("/login");
            return;
          }
        }
        const profile = await apiJson<MeResponse>("/api/me");
        if (cancelled) return;
        setMe(profile);
        if (profile.role !== "ADMIN") {
          routerRef.current.replace("/");
          return;
        }
        const [u, g] = await Promise.all([
          apiJson<UserSummaryResponse[]>("/api/admin/users"),
          apiJson<GroupResponse[]>("/api/admin/groups")
        ]);
        if (cancelled) return;
        setUsers(u);
        setGroups(g);
      } catch {
        if (cancelled) return;
        clearToken();
        clearAutoLogin();
        routerRef.current.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshAll() {
    const [u, g] = await Promise.all([
      apiJson<UserSummaryResponse[]>("/api/admin/users"),
      apiJson<GroupResponse[]>("/api/admin/groups")
    ]);
    setUsers(u);
    setGroups(g);
  }

  async function createUser() {
    setError(null);
    try {
      await apiJson("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      setNewUsername("");
      setNewPassword("");
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    }
  }

  async function createGroup() {
    setError(null);
    try {
      await apiJson("/api/admin/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName, description: groupDesc || null })
      });
      setGroupName("");
      setGroupDesc("");
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    }
  }

  async function addMember() {
    setError(null);
    try {
      await apiJson(`/api/admin/groups/${memberGroupId}/members/${memberUserId}`, { method: "POST" });
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    }
  }

  function logout() {
    clearToken();
    clearAutoLogin();
    routerRef.current.replace("/login");
  }

  return (
    <div className="layout-shell">
      <header className="top-bar">
        <div className="brand">FamilyCal · 관리</div>
        <div className="nav-actions">
          <Link className="btn" href="/">
            캘린더
          </Link>
          <button className="btn" type="button" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="main-area">
        {error ? <div className="error">{error}</div> : null}
        <div className="grid admin-grid" style={{ marginTop: 12 }}>
          <section className="card stack">
            <div style={{ fontWeight: 800 }}>사용자 생성</div>
            <div className="field">
              <div className="label">아이디</div>
              <input className="input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">임시 비밀번호</div>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">역할</div>
              <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button className="btn btn-primary" type="button" onClick={createUser}>
              생성
            </button>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 800 }}>사용자 목록</div>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>아이디</th>
                    <th>역할</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card stack">
            <div style={{ fontWeight: 800 }}>그룹 생성</div>
            <div className="field">
              <div className="label">이름</div>
              <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">설명</div>
              <input className="input" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="button" onClick={createGroup}>
              생성
            </button>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 800 }}>그룹에 멤버 추가</div>
            <div className="field">
              <div className="label">그룹</div>
              <select className="select" value={memberGroupId} onChange={(e) => setMemberGroupId(e.target.value)}>
                <option value="">선택</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <div className="label">사용자 ID</div>
              <input className="input" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} placeholder="예: 2" />
            </div>
            <button className="btn btn-primary" type="button" onClick={addMember}>
              추가
            </button>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 800 }}>그룹 목록</div>
            <div className="stack">
              {groups.map((g) => (
                <div key={g.id} className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{g.name}</div>
                    <div className="pill">{g.description ?? ""}</div>
                  </div>
                  <span className="badge">ID {g.id}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {me ? <div className="pill" style={{ marginTop: 12 }}>현재 계정: {me.username}</div> : null}
      </main>
    </div>
  );
}
