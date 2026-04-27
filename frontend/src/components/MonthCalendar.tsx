"use client";

import { useRef } from "react";
import type { EventResponse } from "@/lib/types";

type Props = {
  year: number;
  monthIndex: number;
  events: EventResponse[];
  holidays: Record<string, string>;
  selectedDayKey: string | null;
  compactMode: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectEvent: (event: EventResponse) => void;
  onSelectDay: (day: Date) => void;
};

/** Calendar day [y,m,d] overlaps event interval in local time. */
function eventOverlapsLocalDay(isoStart: string, isoEnd: string, y: number, m: number, d: number) {
  const dayStart = new Date(y, m, d, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(y, m, d, 23, 59, 59, 999).getTime();
  const s = new Date(isoStart).getTime();
  const e = new Date(isoEnd).getTime();
  return s <= dayEnd && e >= dayStart;
}

/** More than one local calendar day (e.g. 23rd 09:00 → 25th 10:00). */
function spansMultipleLocalDays(e: EventResponse) {
  const s = new Date(e.startAt);
  const t = new Date(e.endAt);
  return s.getFullYear() !== t.getFullYear() || s.getMonth() !== t.getMonth() || s.getDate() !== t.getDate();
}

type WeekCell = { y: number; m: number; d: number; inMonth: boolean };

type WeekSegment = {
  event: EventResponse;
  startCol: number;
  endCol: number;
  lane: number;
  isMultiDay: boolean;
};

function weekSegmentForEvent(e: EventResponse, week: WeekCell[]): WeekSegment | null {
  let startCol = -1;
  let endCol = -1;
  for (let col = 0; col < 7; col++) {
    const c = week[col];
    if (eventOverlapsLocalDay(e.startAt, e.endAt, c.y, c.m, c.d)) {
      if (startCol === -1) startCol = col;
      endCol = col;
    }
  }
  if (startCol === -1) return null;
  return { event: e, startCol, endCol, lane: 0, isMultiDay: spansMultipleLocalDays(e) };
}

function assignLanes(segments: Omit<WeekSegment, "lane">[]): WeekSegment[] {
  const sorted = [...segments].sort((a, b) => {
    if (a.isMultiDay !== b.isMultiDay) {
      return a.isMultiDay ? -1 : 1;
    }
    return a.startCol - b.startCol || a.endCol - b.endCol;
  });
  const laneRightExclusive: number[] = [];
  return sorted.map((seg) => {
    let lane = 0;
    while (lane < laneRightExclusive.length && seg.startCol < laneRightExclusive[lane]) {
      lane++;
    }
    const rightEx = seg.endCol + 1;
    if (lane === laneRightExclusive.length) laneRightExclusive.push(rightEx);
    else laneRightExclusive[lane] = Math.max(laneRightExclusive[lane], rightEx);
    return { ...seg, lane };
  });
}

function weekSegmentsForWeek(events: EventResponse[], week: WeekCell[]): WeekSegment[] {
  const raw: Omit<WeekSegment, "lane">[] = [];
  for (const e of events) {
    const seg = weekSegmentForEvent(e, week);
    if (seg) raw.push({ event: seg.event, startCol: seg.startCol, endCol: seg.endCol, isMultiDay: seg.isMultiDay });
  }
  if (raw.length === 0) return [];
  return assignLanes(raw);
}

function hiddenCountForCell(segments: WeekSegment[], dayCol: number, maxVisibleRows: number) {
  let hidden = 0;
  for (const seg of segments) {
    const coversDay = seg.startCol <= dayCol && seg.endCol >= dayCol;
    if (!coversDay) continue;
    if (seg.lane >= maxVisibleRows) hidden++;
  }
  return hidden;
}

function buildCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: { y: number; m: number; d: number; inMonth: boolean }[] = [];

  const prevMonthLast = new Date(year, monthIndex, 0).getDate();
  for (let i = 0; i < startOffset; i++) {
    const d = prevMonthLast - startOffset + i + 1;
    const dt = new Date(year, monthIndex - 1, d);
    cells.push({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y: year, m: monthIndex, d, inMonth: true });
  }

  const totalVisibleDays = startOffset + daysInMonth;
  const weekRows = Math.ceil(totalVisibleDays / 7);
  const targetCells = weekRows * 7;

  let cursor = new Date(year, monthIndex, daysInMonth);
  while (cells.length < targetCells) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    cells.push({ y: cursor.getFullYear(), m: cursor.getMonth(), d: cursor.getDate(), inMonth: false });
  }
  return cells;
}

function chunkWeeks(cells: WeekCell[]): WeekCell[][] {
  const weeks: WeekCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function MonthCalendar({
  year,
  monthIndex,
  events,
  holidays,
  selectedDayKey,
  compactMode,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectEvent,
  onSelectDay
}: Props) {
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const MAX_VISIBLE_EVENT_ROWS = 3;
  const title = `${year}년 ${monthIndex + 1}월`;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const cells = buildCells(year, monthIndex);
  const weeks = chunkWeeks(cells);

  return (
    <div className="card">
      <div className="cal-header">
        <div className="cal-title">{title}</div>
        <div className="cal-controls">
          <button className="btn today-btn" type="button" onClick={onToday}>
            Today
          </button>
        </div>
      </div>
      <div
        className="cal-scroll"
        onPointerDown={(e) => {
          swipeStartRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (!swipeStartRef.current) return;
          const dx = e.clientX - swipeStartRef.current.x;
          const dy = e.clientY - swipeStartRef.current.y;
          swipeStartRef.current = null;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          // Horizontal swipe only: enough distance and stronger than vertical movement.
          if (absDx < 50 || absDx < absDy * 1.2) return;
          if (dx < 0) onNextMonth();
          else onPrevMonth();
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          touchStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStartRef.current) return;
          const t = e.changedTouches[0];
          if (!t) return;
          const dx = t.clientX - touchStartRef.current.x;
          const dy = t.clientY - touchStartRef.current.y;
          touchStartRef.current = null;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx < 40 || absDx < absDy * 1.15) return;
          if (dx < 0) onNextMonth();
          else onPrevMonth();
        }}
      >
        <div className="cal-weekdays">
          {weekdays.map((w, idx) => (
            <div key={w} className={idx === 0 || idx === 6 ? "holiday-red" : ""}>
              {w}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {weeks.map((week, wIdx) => {
            const segments = weekSegmentsForWeek(events, week);
            const laneCount = segments.length === 0 ? 0 : Math.max(...segments.map((s) => s.lane)) + 1;
            const visibleLaneCount = Math.min(laneCount, MAX_VISIBLE_EVENT_ROWS);
            const visibleSegments = segments.filter((s) => s.lane < MAX_VISIBLE_EVENT_ROWS);
            const barsStackPx = compactMode
              ? 0
              :
              visibleLaneCount === 0 ? 0 : visibleLaneCount * 18 + Math.max(0, visibleLaneCount - 1) * 2;
            const packStyle = {
              "--week-lanes": visibleLaneCount,
              "--bars-stack-h": `${barsStackPx}px`
            } as React.CSSProperties;

            return (
              <div key={wIdx} className="cal-week-pack" style={packStyle}>
                {visibleLaneCount > 0 && !compactMode ? (
                  <div
                    className="cal-week-bars-layer"
                    style={{ gridTemplateRows: `repeat(${visibleLaneCount}, minmax(16px, auto))` }}
                  >
                    {visibleSegments.map((seg) => {
                      const gridColumn = `${seg.startCol + 1} / ${seg.endCol + 2}`;
                      const anyInMonth = week.slice(seg.startCol, seg.endCol + 1).some((c) => c.inMonth);
                      return (
                        <button
                          key={`${seg.event.id}-${wIdx}-${seg.startCol}-${seg.lane}`}
                          type="button"
                          className={`event-bar ${isHolidayEvent(seg.event) ? "event-bar-holiday" : ""} ${!anyInMonth ? "event-bar-muted" : ""}`}
                          style={{
                            gridColumn,
                            gridRow: seg.lane + 1,
                            backgroundColor: isHolidayEvent(seg.event) ? undefined : withAlpha(seg.event.colorHex || "#C45C6A", 0.24),
                            borderColor: isHolidayEvent(seg.event) ? undefined : withAlpha(seg.event.colorHex || "#C45C6A", 0.45)
                          }}
                          onClick={(evt) => {
                            evt.stopPropagation();
                            onSelectEvent(seg.event);
                          }}
                        >
                          {truncateBarTitle(isHolidayEvent(seg.event) ? `★ ${seg.event.title}` : seg.event.title, seg.endCol - seg.startCol + 1)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {week.map((c, idx) => {
                  const dotColors = Array.from(
                    new Set(
                      events
                        .filter((e) => eventOverlapsLocalDay(e.startAt, e.endAt, c.y, c.m, c.d))
                        .map((e) => e.colorHex || "#C45C6A")
                    )
                  ).slice(0, 4);
                  const dayKey = `${c.y}-${c.m + 1}-${c.d}`;
                  const isSelectedDay = selectedDayKey === dayKey;
                  const holidayName = holidays[dayKey];
                  const isWeekend = idx === 0 || idx === 6;
                  const hiddenCount = hiddenCountForCell(segments, idx, MAX_VISIBLE_EVENT_ROWS);
                  return (
                    <div
                      key={`${wIdx}-${idx}`}
                      className={`day-cell ${c.inMonth ? "" : "muted"} ${isSelectedDay ? "selected" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectDay(new Date(c.y, c.m, c.d))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectDay(new Date(c.y, c.m, c.d));
                        }
                      }}
                      aria-label={`${c.y}년 ${c.m + 1}월 ${c.d}일 일정 보기`}
                    >
                      <div className="day-cell-head">
                        <span className={`day-num ${isWeekend || holidayName ? "holiday-red" : ""}`}>{c.d}</span>
                      </div>
                      <div className="day-bar-spacer" aria-hidden />
                      {compactMode ? (
                        <div className="day-dots">
                          {dotColors.map((color) => (
                            <span key={color} className="day-dot" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      ) : null}
                      {!compactMode && hiddenCount > 0 ? <div className="day-hidden-count">+{hiddenCount}</div> : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "rgba(196,92,106,0.25)";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function truncateBarTitle(title: string, spanCols: number) {
  // Keep visible text conservative so glyphs are not visually cut mid-character.
  const budget = Math.max(spanCols <= 1 ? 12 : 6, spanCols * 5);
  if (title.length <= budget) return title;
  return title.slice(0, Math.max(1, budget - 2));
}

function isHolidayEvent(event: EventResponse) {
  return event.createdByUsername === "공휴일";
}
