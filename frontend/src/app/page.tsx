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

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const [holidays, setHolidays] = useState<Record<string, string>>({});

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
    const yearsToLoad = [year - 1, year, year + 1];
    let cancelled = false;
    (async () => {
      const entries: Array<[string, string]> = [];
      for (const y of yearsToLoad) {
        try {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/KR`);
          if (!res.ok) continue;
          const list = (await res.json()) as Array<{ date: string; localName: string; name: string }>;
          for (const h of list) {
            const dt = new Date(h.date);
            if (Number.isNaN(dt.getTime())) continue;
            entries.push([`${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`, h.localName || h.name]);
          }
        } catch {
          // Ignore network failures; calendar still works without holiday labels.
        }
      }
      if (cancelled) return;
      setHolidays(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

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

  useEffect(() => {
    if (!sheetDragging) return;
    function onPointerMove(e: PointerEvent) {
      if (dragStartYRef.current == null) return;
      const delta = e.clientY - dragStartYRef.current;
      setSheetDragY(Math.max(0, delta));
    }
    function onPointerUp() {
      if (sheetDragY > 100) {
        setSplitOpen(false);
      }
      setSheetDragging(false);
      dragStartYRef.current = null;
      setSheetDragY(0);
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [sheetDragging, sheetDragY]);

  const selectedDayKey = `${selectedDay.getFullYear()}-${selectedDay.getMonth() + 1}-${selectedDay.getDate()}`;
  const holidayEvents = useMemo<EventResponse[]>(() => {
    return Object.entries(holidays).flatMap(([dayKey, holidayName]) => {
      const [y, m, d] = dayKey.split("-").map(Number);
      if (!y || !m || !d) return [];
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      return [
        {
          id: -(y * 10000 + m * 100 + d),
          title: holidayName,
          description: "공휴일",
          colorHex: "#79C6DD",
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          visibility: "ALL_USERS",
          targetGroupId: null,
          targetGroupName: null,
          createdByUsername: "공휴일"
        }
      ];
    });
  }, [holidays]);

  const calendarEvents = useMemo(() => [...holidayEvents, ...events], [holidayEvents, events]);

  const dayEvents = calendarEvents
    .filter((e) => eventOverlapsLocalDay(e.startAt, e.endAt, selectedDay))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const panelEvents = dayEvents.filter((e) => !isHolidayEvent(e));
  const selectedEvent = panelEvents.find((e) => e.id === selectedEventId) ?? panelEvents[0] ?? null;

  return (
    <div className={`layout-shell ${splitOpen ? "split-open" : ""}`}>
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
              events={calendarEvents}
              holidays={holidays}
              selectedDayKey={selectedDayKey}
              compactMode={splitOpen}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
              onToday={() => {
                const today = new Date();
                setYear(today.getFullYear());
                setMonthIndex(today.getMonth());
                setSelectedDay(today);
                setSplitOpen(true);
              }}
              onSelectEvent={(e) => {
                const d = new Date(e.startAt);
                setSelectedDay(d);
                setSelectedEventId(e.id);
                setSplitOpen(true);
              }}
              onSelectDay={(day) => {
                setSelectedDay(day);
                setSelectedEventId(null);
                setSplitOpen(true);
              }}
            />
          </div>
        ) : null}

        {auth === "ok" && splitOpen ? (
          <div
            className={`card day-panel ${sheetDragging ? "dragging" : ""}`}
            style={{ transform: `translateY(${sheetDragY}px)` }}
          >
            <div
              className="day-panel-drag-zone"
              onPointerDown={(e) => {
                dragStartYRef.current = e.clientY;
                setSheetDragging(true);
              }}
              aria-label="아래로 드래그하여 닫기"
            >
              <span className="day-panel-drag-handle" />
            </div>
            <div className="day-panel-head">
              <div style={{ fontWeight: 800 }}>{formatSelectedDay(selectedDay)}</div>
            </div>
            {panelEvents.length === 0 ? (
              <div className="pill">이 날짜에는 일정이 없습니다.</div>
            ) : (
              <div className="stack">
                {panelEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`day-event-item ${selectedEvent?.id === event.id ? "active" : ""}`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <span className="day-event-color-bar" style={{ backgroundColor: event.colorHex || "#C45C6A" }} aria-hidden />
                    <span className="day-event-content">
                      <span style={{ fontWeight: 700 }}>{event.title}</span>
                      <span className="pill">{formatDateTimeWithoutSeconds(event.startAt)} ~ {formatDateTimeWithoutSeconds(event.endAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedEvent ? (
              <div className="day-event-detail">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{selectedEvent.title}</div>
                <div className="pill" style={{ marginBottom: 10 }}>
                  {formatDateTimeWithoutSeconds(selectedEvent.startAt)} ~ {formatDateTimeWithoutSeconds(selectedEvent.endAt)}
                </div>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="badge">{selectedEvent.visibility === "ALL_USERS" ? "가족 전체" : "그룹 한정"}</span>
                  {selectedEvent.targetGroupName ? <span className="badge">{selectedEvent.targetGroupName}</span> : null}
                </div>
                {selectedEvent.description ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{selectedEvent.description}</div>
                ) : (
                  <div className="pill">설명 없음</div>
                )}
                <div className="pill" style={{ marginTop: 10 }}>
                  등록: {selectedEvent.createdByUsername}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>

      <NewEventDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        defaultDay={newDay}
        onCreated={() => void load()}
      />
      {auth === "ok" ? (
        <button
          type="button"
          className="fab-add"
          aria-label="일정 추가"
          onClick={() => {
            setNewDay(selectedDay);
            setNewOpen(true);
          }}
        >
          +
        </button>
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

function eventOverlapsLocalDay(isoStart: string, isoEnd: string, day: Date) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0).getTime();
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();
  const s = new Date(isoStart).getTime();
  const e = new Date(isoEnd).getTime();
  return s <= dayEnd && e >= dayStart;
}

function formatSelectedDay(day: Date) {
  return day.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function isHolidayEvent(event: EventResponse) {
  return event.createdByUsername === "공휴일";
}
