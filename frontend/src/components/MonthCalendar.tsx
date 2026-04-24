"use client";

import type { EventResponse } from "@/lib/types";

type Props = {
  year: number;
  monthIndex: number;
  events: EventResponse[];
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

/** Single-day chips only; multi-day events use the in-cell spanning bar overlay. */
function singleDayEventsForCell(events: EventResponse[], y: number, m: number, d: number) {
  return events.filter((e) => eventOverlapsLocalDay(e.startAt, e.endAt, y, m, d) && !spansMultipleLocalDays(e));
}

type WeekCell = { y: number; m: number; d: number; inMonth: boolean };

type WeekSegment = {
  event: EventResponse;
  startCol: number;
  endCol: number;
  lane: number;
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
  return { event: e, startCol, endCol, lane: 0 };
}

function assignLanes(segments: Omit<WeekSegment, "lane">[]): WeekSegment[] {
  const sorted = [...segments].sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);
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

function multiDaySegmentsForWeek(events: EventResponse[], week: WeekCell[]): WeekSegment[] {
  const raw: Omit<WeekSegment, "lane">[] = [];
  for (const e of events) {
    if (!spansMultipleLocalDays(e)) continue;
    const seg = weekSegmentForEvent(e, week);
    if (seg) raw.push({ event: seg.event, startCol: seg.startCol, endCol: seg.endCol });
  }
  if (raw.length === 0) return [];
  return assignLanes(raw);
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

export function MonthCalendar({ year, monthIndex, events, onPrevMonth, onNextMonth, onToday, onSelectEvent, onSelectDay }: Props) {
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
          <button className="btn nav-arrow-btn" type="button" onClick={onPrevMonth} aria-label="이전 달">
            ‹
          </button>
          <button className="btn nav-arrow-btn" type="button" onClick={onNextMonth} aria-label="다음 달">
            ›
          </button>
        </div>
      </div>
      <div className="cal-scroll">
        <div className="cal-weekdays">
          {weekdays.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="cal-grid">
          {weeks.map((week, wIdx) => {
            const segments = multiDaySegmentsForWeek(events, week);
            const laneCount = segments.length === 0 ? 0 : Math.max(...segments.map((s) => s.lane)) + 1;
            const barsStackPx =
              laneCount === 0 ? 0 : laneCount * 23 + Math.max(0, laneCount - 1) * 3;
            const packStyle = {
              "--week-lanes": laneCount,
              "--bars-stack-h": `${barsStackPx}px`
            } as React.CSSProperties;

            return (
              <div key={wIdx} className="cal-week-pack" style={packStyle}>
                {laneCount > 0 ? (
                  <div
                    className="cal-week-bars-layer"
                    style={{ gridTemplateRows: `repeat(${laneCount}, minmax(20px, auto))` }}
                  >
                    {segments.map((seg) => {
                      const gridColumn = `${seg.startCol + 1} / ${seg.endCol + 2}`;
                      const anyInMonth = week.slice(seg.startCol, seg.endCol + 1).some((c) => c.inMonth);
                      return (
                        <button
                          key={`${seg.event.id}-${wIdx}-${seg.startCol}-${seg.lane}`}
                          type="button"
                          className={`event-bar ${!anyInMonth ? "event-bar-muted" : ""}`}
                          style={{ gridColumn, gridRow: seg.lane + 1 }}
                          onClick={(evt) => {
                            evt.stopPropagation();
                            onSelectEvent(seg.event);
                          }}
                        >
                          {truncateBarTitle(seg.event.title, seg.endCol - seg.startCol + 1)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {week.map((c, idx) => {
                  const dayEvents = singleDayEventsForCell(events, c.y, c.m, c.d);
                  return (
                    <div
                      key={`${wIdx}-${idx}`}
                      className={`day-cell ${c.inMonth ? "" : "muted"}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectDay(new Date(c.y, c.m, c.d))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectDay(new Date(c.y, c.m, c.d));
                        }
                      }}
                      aria-label={`${c.y}년 ${c.m + 1}월 ${c.d}일 일정 등록`}
                    >
                      <div className="day-cell-head">
                        <span className="day-num">{c.d}</span>
                      </div>
                      <div className="day-bar-spacer" aria-hidden />
                      <div className="day-inline-bars">
                        {dayEvents.slice(0, 3).map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            className="event-bar event-bar-single"
                            onClick={(evt) => {
                              evt.stopPropagation();
                              onSelectEvent(e);
                            }}
                          >
                            {truncateBarTitle(e.title, 1)}
                          </button>
                        ))}
                        {dayEvents.length > 3 ? <div className="pill">+{dayEvents.length - 3}개</div> : null}
                      </div>
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

function truncateBarTitle(title: string, spanCols: number) {
  const budget = Math.max(spanCols <= 1 ? 16 : 8, spanCols * 6);
  return title.length > budget ? title.slice(0, budget - 1) + "…" : title;
}
