"use client";

import MonthGrid from "@/components/MonthGrid";
import WeekGrid from "@/components/WeekGrid";
import { formatMonthTitle, formatWeekTitle, keyParts, type DateKey } from "@/lib/date";
import type { CalendarView } from "@/lib/settings";
import type { Task } from "@/lib/types";

type Props = {
  /** 보고 있는 기준 날짜. 월간이면 이 날짜의 달, 주간이면 이 날짜가 속한 주. */
  anchor: DateKey;
  view: CalendarView;
  today: DateKey;
  /** 마감일 기준으로 묶은 Task. 달력은 저장된 데이터가 아니라 이 파생 뷰를 그린다. */
  tasksByDate: Map<DateKey, Task[]>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onAdd: () => void;
};

function ArrowButton({
  dir,
  onClick,
  label,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-7 place-items-center rounded-full border border-line text-ink-soft transition hover:bg-soft hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path
          d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  return (
    <div className="flex rounded-full border border-line p-0.5">
      {(["month", "week"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-3 py-1 text-[12px] transition ${
            value === v ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {v === "month" ? "월간" : "주간"}
        </button>
      ))}
    </div>
  );
}

export default function Calendar({
  anchor,
  view,
  today,
  tasksByDate,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onAdd,
}: Props) {
  const { y, m } = keyParts(anchor);
  const title = view === "month" ? formatMonthTitle(y, m) : formatWeekTitle(anchor);

  return (
    <section className="flex flex-col rounded-card border border-line bg-card shadow-card">
      <header className="flex items-center gap-3 px-6 py-5">
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-line px-3 py-1 text-[12px] text-ink-soft transition hover:bg-soft hover:text-ink"
        >
          오늘
        </button>
        <ArrowButton
          dir="prev"
          onClick={onPrev}
          label={view === "month" ? "이전 달" : "이전 주"}
        />
        <ArrowButton
          dir="next"
          onClick={onNext}
          label={view === "month" ? "다음 달" : "다음 주"}
        />

        <h2 className="ml-1 whitespace-nowrap text-[19px] font-medium tracking-tight">{title}</h2>

        <div className="ml-auto flex items-center gap-2">
          <ViewToggle value={view} onChange={onViewChange} />
          <button
            type="button"
            onClick={onAdd}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accent-deep"
          >
            + 일정 추가
          </button>
        </div>
      </header>

      {view === "month" ? (
        <MonthGrid year={y} month={m} today={today} tasksByDate={tasksByDate} />
      ) : (
        <WeekGrid anchor={anchor} today={today} tasksByDate={tasksByDate} />
      )}
    </section>
  );
}
