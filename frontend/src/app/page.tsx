"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MonthCalendar } from "@/components/MonthCalendar";
import { NewEventDialog } from "@/components/NewEventDialog";
import { trySilentLogin } from "@/lib/autoLogin";
import { ApiError, apiJson } from "@/lib/api";
import { clearAutoLogin, clearToken, getToken } from "@/lib/storage";
import type { EventResponse, MeResponse } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  /** Always start pending; validate JWT with /api/me before ok (avoids login↔home redirect loop on stale token). */
  const [auth, setAuth] = useState<"pending" | "ok">("pending");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newDay, setNewDay] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] = useState<EventResponse | null>(null);

  const range = useMemo(() => monthRangeIso(year, monthIndex), [year, monthIndex]);

  const load = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<EventResponse[]>(`/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`);
      setEvents(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearAutoLogin();
        setAuth("pending");
        routerRef.current.replace("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [range.end, range.start]);

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
        setAuth("ok");
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

  useEffect(() => {
    if (auth !== "ok") return;
    if (!getToken()) return;
    void load();
  }, [auth, load]);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [menuOpen]);

  function shiftMonth(delta: number) {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  }

  function logout() {
    setMenuOpen(false);
    clearToken();
    clearAutoLogin();
    routerRef.current.replace("/login");
  }

  return (
    <div className="layout-shell">
      <header className="top-bar">
        <div className="brand">FamilyCal</div>
        <div className="nav-actions nav-actions-right">
          <div className="menu-wrap" ref={menuWrapRef}>
            <button
              className="btn menu-toggle"
              type="button"
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="menu-toggle-line" />
              <span className="menu-toggle-line" />
              <span className="menu-toggle-line" />
            </button>
            {menuOpen ? (
              <div className="menu-panel">
                {me ? <div className="menu-user">{me.username}</div> : null}
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    setNewDay(new Date());
                    setNewOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  새 일정
                </button>
                {me?.role === "ADMIN" ? (
                  <Link className="menu-item" href="/admin" onClick={() => setMenuOpen(false)}>
                    관리자 페이지
                  </Link>
                ) : null}
                <button className="menu-item" type="button" onClick={logout}>
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="main-area">
        {auth === "pending" ? <div className="pill">로그인 확인 중…</div> : null}
        {auth === "ok" && loading ? <div className="pill">불러오는 중…</div> : null}
        {error ? <div className="error">{error}</div> : null}

        {auth === "ok" ? (
          <div style={{ marginTop: 10 }}>
            <MonthCalendar
              year={year}
              monthIndex={monthIndex}
              events={events}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
              onToday={() => {
                const today = new Date();
                setYear(today.getFullYear());
                setMonthIndex(today.getMonth());
              }}
              onSelectEvent={(e) => setSelected(e)}
              onSelectDay={(day) => {
                setNewDay(day);
                setNewOpen(true);
              }}
            />
          </div>
        ) : null}
      </main>

      <NewEventDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        defaultDay={newDay}
        onCreated={() => void load()}
      />

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17, 24, 39, 0.35)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 40
          }}
        >
          <div className="card" style={{ width: "min(520px, 100%)" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 800 }}>{selected.title}</div>
              <button className="btn btn-ghost" type="button" onClick={() => setSelected(null)}>
                닫기
              </button>
            </div>
            <div className="pill" style={{ marginBottom: 10 }}>
              {formatDateTimeWithoutSeconds(selected.startAt)} ~ {formatDateTimeWithoutSeconds(selected.endAt)}
            </div>
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="badge">{selected.visibility === "ALL_USERS" ? "가족 전체" : "그룹 한정"}</span>
              {selected.targetGroupName ? <span className="badge">{selected.targetGroupName}</span> : null}
            </div>
            {selected.description ? <div style={{ whiteSpace: "pre-wrap" }}>{selected.description}</div> : <div className="pill">설명 없음</div>}
            <div className="pill" style={{ marginTop: 10 }}>
              등록: {selected.createdByUsername}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function monthRangeIso(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatDateTimeWithoutSeconds(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
