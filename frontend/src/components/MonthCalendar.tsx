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

function sameLocalDay(iso: string, y: number, m: number, d: number) {
  const dt = new Date(iso);
  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
}

function eventsForDay(events: EventResponse[], y: number, m: number, d: number) {
  return events.filter((e) => sameLocalDay(e.startAt, y, m, d));
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

export function MonthCalendar({ year, monthIndex, events, onPrevMonth, onNextMonth, onToday, onSelectEvent, onSelectDay }: Props) {
  const title = `${year}년 ${monthIndex + 1}월`;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const cells = buildCells(year, monthIndex);

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
      <div className="cal-weekdays">
        {weekdays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((c, idx) => {
          const dayEvents = eventsForDay(events, c.y, c.m, c.d);
          return (
            <div
              key={idx}
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
              <span className="day-num">{c.d}</span>
              <div className="stack">
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={e.id}
                    className="event-chip"
                    type="button"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onSelectEvent(e);
                    }}
                  >
                    {e.title}
                  </button>
                ))}
                {dayEvents.length > 3 ? <div className="pill">+{dayEvents.length - 3}개</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
