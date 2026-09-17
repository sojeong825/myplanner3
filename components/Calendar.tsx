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
  /** 날짜 칸을 누르면 그 날짜로 '할 일 추가'가 열린다. */
  onAddOn: (key: DateKey) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onSelect: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  /** 좁은 화면에서 월간 칸을 눌렀을 때 여는 그날 목록. */
  onOpenDay: (key: DateKey) => void;
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
  onAddOn,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onSelect,
  onToggleDone,
  onOpenDay,
  onAdd,
}: Props) {
  const { y, m } = keyParts(anchor);
  const title = view === "month" ? formatMonthTitle(y, m) : formatWeekTitle(anchor);

  return (
    <section className="flex flex-col rounded-card border border-line bg-card shadow-card">
      <header className="px-4 py-4 lg:px-6 lg:py-5">
        {/*
          폰에서는 '지금 어느 달인지'가 맨 먼저 읽혀야 해서 제목을 왼쪽 맨 앞에 두고,
          오늘·화살표를 오른쪽으로 보낸다. 보기 전환과 추가는 아랫줄로 내려간다.
          넓은 화면에서는 order로 예전 순서(오늘·화살표 → 제목 → 전환·추가)를 되돌린다.
        */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <h2 className="order-1 whitespace-nowrap text-[18px] font-medium lg:order-2 lg:ml-1 lg:text-[19px]">
            {title}
          </h2>

          <div className="order-2 ml-auto flex items-center gap-1.5 lg:order-1 lg:ml-0 lg:gap-3">
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
          </div>

          <div className="order-3 flex w-full items-center gap-2 lg:ml-auto lg:w-auto">
            <ViewToggle value={view} onChange={onViewChange} />
            <button
              type="button"
              onClick={onAdd}
              className="ml-auto whitespace-nowrap rounded-full bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-accent-deep lg:ml-0 lg:px-4"
            >
              + 일정 추가
            </button>
          </div>
        </div>
      </header>

      {view === "month" ? (
        <MonthGrid
          year={y}
          month={m}
          today={today}
          tasksByDate={tasksByDate}
          onAddOn={onAddOn}
          onSelect={onSelect}
          onToggleDone={onToggleDone}
          onOpenDay={onOpenDay}
        />
      ) : (
        <WeekGrid
          anchor={anchor}
          today={today}
          tasksByDate={tasksByDate}
          onAddOn={onAddOn}
          onSelect={onSelect}
          onToggleDone={onToggleDone}
        />
      )}
    </section>
  );
}
