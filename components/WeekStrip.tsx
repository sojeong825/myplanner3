"use client";

import { buildWeek, WEEKDAYS, type DateKey } from "@/lib/date";
import type { Task } from "@/lib/types";

type Props = {
  /** 이 날짜가 속한 주를 그리고, 이 날짜가 곧 '고른 날'이다. */
  anchor: DateKey;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
  onSelect: (key: DateKey) => void;
};

/**
 * 가로 한 줄짜리 일주일. 요일 · 일정 개수 · 날짜를 세로로 쌓아 일곱 칸을 늘어놓는다.
 *
 * 좁은 화면에서 일주일을 일곱 칸으로 쪼개 제목까지 넣으려 하면 한 칸이 50px이라
 * 아무것도 못 읽는다. 여기서는 **개수만** 보여주고, 고른 날의 제목은 아래 목록이 맡는다.
 * 한 주에 어느 날이 바쁜지는 이 줄만 봐도 알 수 있다.
 */
export default function WeekStrip({ anchor, today, tasksByDate, onSelect }: Props) {
  const days = buildWeek(anchor);

  return (
    <div className="grid grid-cols-7 gap-1 px-2 py-3">
      {days.map((day) => {
        const all = tasksByDate.get(day.key) ?? [];
        const count = all.filter((t) => !t.is_done).length;
        // 일정이 있었고 그걸 다 끝낸 날. 0으로 비워두면 처음부터 없던 날과 똑같아 보인다.
        const cleared = all.length > 0 && count === 0;
        const picked = day.key === anchor;
        const isToday = day.key === today;

        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect(day.key)}
            aria-pressed={picked}
            className="flex flex-col items-center gap-1.5 rounded-xl py-1 transition active:bg-soft/60"
          >
            <span
              className={`text-[11px] ${
                day.weekday === 0 ? "text-accent-deep/70" : "text-ink-faint"
              }`}
            >
              {WEEKDAYS[day.weekday]}
            </span>

            {/*
              동그라미 안은 그날 남은 일정 개수다. 고른 날은 채워서, 나머지는 옅게.
              할 일이 없는 날도 자리를 비워두지 않는다 — 칸이 들쭉날쭉하면 줄이 흔들린다.
            */}
            <span
              className={`grid size-8 place-items-center rounded-full text-[13px] font-medium transition ${
                picked
                  ? "bg-accent text-white"
                  : count > 0
                    ? "bg-soft-deep text-ink"
                    : cleared
                      ? "bg-soft text-accent-deep"
                      : "bg-soft/60 text-ink-faint"
              }`}
            >
              {count > 0 ? (
                count
              ) : cleared ? (
                <svg
                  viewBox="0 0 24 24"
                  aria-label="다 끝냈어요"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                ""
              )}
            </span>

            <span
              className={`text-[12px] ${
                picked
                  ? "font-medium text-ink"
                  : isToday
                    ? "text-accent-deep"
                    : "text-ink-soft"
              } ${isToday ? "underline underline-offset-2" : ""}`}
            >
              {day.day}
            </span>
          </button>
        );
      })}
    </div>
  );
}
