"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api";
import type { EventResponse, EventVisibility, GroupResponse } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (e: EventResponse) => void;
  defaultDay: Date;
};

export function NewEventDialog({ open, onClose, onCreated, defaultDay }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<EventVisibility>("ALL_USERS");
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startDefault = useMemo(() => toLocalInput(defaultDay, 9), [defaultDay]);
  const endDefault = useMemo(() => toLocalInput(defaultDay, 10), [defaultDay]);

  const [startLocal, setStartLocal] = useState(startDefault);
  const [endLocal, setEndLocal] = useState(endDefault);

  useEffect(() => {
    if (!open) return;
    setStartLocal(startDefault);
    setEndLocal(endDefault);
    setError(null);
    apiJson<GroupResponse[]>("/api/groups/my")
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [open, startDefault, endDefault]);

  if (!open) return null;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description: description || null,
        startAt: new Date(startLocal).toISOString(),
        endAt: new Date(endLocal).toISOString(),
        visibility,
        targetGroupId: visibility === "SPECIFIC_GROUP" ? Number(targetGroupId) : null
      };
      const created = await apiJson<EventResponse>("/api/events", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onCreated(created);
      onClose();
      setTitle("");
      setDescription("");
      setVisibility("ALL_USERS");
      setTargetGroupId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
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
        zIndex: 50
      }}
    >
      <div className="card" style={{ width: "min(560px, 100%)" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>새 일정</div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="field">
          <div className="label">제목</div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <div className="label">설명</div>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <div className="label">시작</div>
          <input className="input" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
        </div>
        <div className="field">
          <div className="label">종료</div>
          <input className="input" type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
        </div>
        <div className="field">
          <div className="label">공개 범위</div>
          <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value as EventVisibility)}>
            <option value="ALL_USERS">가족 전체</option>
            <option value="SPECIFIC_GROUP">특정 그룹만</option>
          </select>
        </div>
        {visibility === "SPECIFIC_GROUP" ? (
          <div className="field">
            <div className="label">그룹</div>
            <select className="select" value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)}>
              <option value="">선택</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {groups.length === 0 ? <div className="error">내가 속한 그룹이 없습니다. 관리자에게 그룹 배정을 요청하세요.</div> : null}
          </div>
        ) : null}

        {error ? <div className="error">{error}</div> : null}

        <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
          <button className="btn" type="button" onClick={onClose} disabled={saving}>
            취소
          </button>
          <button className="btn btn-primary" type="button" onClick={submit} disabled={saving || !title.trim()}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function toLocalInput(d: Date, hour: number) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = x.getFullYear();
  const mm = pad(x.getMonth() + 1);
  const dd = pad(x.getDate());
  const hh = pad(x.getHours());
  const mi = pad(x.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
