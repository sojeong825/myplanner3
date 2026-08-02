"use client";

import { useEffect, useState } from "react";
import { diffDays, type DateKey } from "@/lib/date";
import { COUNTER_LABEL_MAX } from "@/lib/settings";

type Props = {
  label: string;
  date: DateKey | null;
  today: DateKey;
  onSave: (label: string, date: DateKey | null) => void;
};

/** 기준일부터 오늘까지 지난 날. 미래면 D-N으로 보여준다. */
function counterLabel(date: DateKey, today: DateKey) {
  const days = diffDays(today, date);
  if (days === 0) return "D-Day";
  return days > 0 ? `D+${days}` : `D-${-days}`;
}

export default function CounterCard({ label, date, today, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftDate, setDraftDate] = useState(date ?? "");

  useEffect(() => {
    if (!editing) {
      setDraftLabel(label);
      setDraftDate(date ?? "");
    }
  }, [editing, label, date]);

  if (editing) {
    return (
      <section className="rounded-card border border-line bg-card p-5 shadow-card">
        <label className="block">
          <span className="text-[11px] text-ink-soft">이름</span>
          <input
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            maxLength={COUNTER_LABEL_MAX}
            placeholder="시작한 날"
            className="mt-1 w-full rounded-lg border border-line bg-canvas px-2.5 py-2 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-[11px] text-ink-soft">기준 날짜</span>
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-canvas px-2.5 py-2 text-[13px] outline-none focus:border-accent"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-full border border-line py-2 text-[12px] text-ink-soft transition hover:bg-soft"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draftLabel.trim() || "시작한 날", draftDate || null);
              setEditing(false);
            }}
            className="flex-1 rounded-full bg-accent py-2 text-[12px] font-medium text-white transition hover:bg-accent-deep"
          >
            저장
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="group relative flex h-[180px] flex-col justify-between rounded-card border border-line bg-card p-5 shadow-card">
      <div className="flex items-center gap-1.5 text-accent">
        <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
          <path d="M12 3.8l2.45 4.96 5.47.8-3.96 3.86.94 5.45L12 16.3l-4.9 2.57.94-5.45-3.96-3.86 5.47-.8z" />
        </svg>
        <span className="truncate text-[12px] text-ink-soft">{label}</span>
      </div>

      {date ? (
        <p className="mt-4 text-[32px] leading-none tracking-tight text-ink">
          {counterLabel(date, today)}
        </p>
      ) : (
        <p className="mt-4 text-[13px] text-ink-faint">기준 날짜를 정해보세요</p>
      )}

      {date && <p className="mt-2 text-[11px] text-ink-faint">{date}</p>}

      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="카운터 설정"
        className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-card/85 text-ink-soft opacity-0 transition group-hover:opacity-100 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
