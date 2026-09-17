"use client";

import DayAgenda from "@/components/DayAgenda";
import MonthGrid from "@/components/MonthGrid";
import WeekGrid from "@/components/WeekGrid";
import {
  formatDayTitle,
  formatMonthTitle,
  formatWeekTitle,
  keyParts,
  type DateKey,
} from "@/lib/date";
import type { CalendarView } from "@/lib/settings";
import type { Task } from "@/lib/types";

type Props = {
  /**
   * 보고 있는 기준 날짜. 월간이면 이 날짜의 달, 주간이면 이 날짜가 속한 주,
   * 일간이면 이 날짜 하루. 주간에서는 '고른 날'을 겸한다.
   */
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
  /** 주간에서 요일 줄의 날짜를 눌렀을 때. anchor가 그 날로 옮겨간다. */
  onSelectDay: (key: DateKey) => void;
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

const VIEW_LABEL: Record<CalendarView, string> = {
  day: "일간",
  week: "주간",
  month: "월간",
};

function ViewToggle({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  return (
    // 좁은 것부터 넓은 것 순서로 — 일간 · 주간 · 월간.
    <div className="flex rounded-full border border-line p-0.5">
      {(["day", "week", "month"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-3 py-1 text-[12px] transition ${
            value === v ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {VIEW_LABEL[v]}
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
  onSelectDay,
}: Props) {
  const { y, m } = keyParts(anchor);
  const title =
    view === "month"
      ? formatMonthTitle(y, m)
      : view === "week"
        ? formatWeekTitle(anchor)
        : formatDayTitle(anchor);

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
            {/*
              '오늘'은 넓은 화면에만 둔다. 폰에서는 달을 넘겨봐야 한두 칸이고, 머리줄에
              자리가 빠듯해서 제목과 화살표가 먼저다.
            */}
            <button
              type="button"
              onClick={onToday}
              className="hidden rounded-full border border-line px-3 py-1 text-[12px] text-ink-soft transition hover:bg-soft hover:text-ink lg:block"
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

          {/*
            일정 추가 버튼은 여기 없다. 날짜를 먼저 고르고 나서 추가하는 편이
            자연스러워서, 추가는 날짜를 누르면 나오는 그날 목록에서만 연다
            (월간은 시트, 주간·일간은 목록 머리의 '+ 추가').
          */}
          <div className="order-3 flex w-full items-center lg:ml-auto lg:w-auto">
            <ViewToggle value={view} onChange={onViewChange} />
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
      ) : view === "week" ? (
        <WeekGrid
          anchor={anchor}
          today={today}
          tasksByDate={tasksByDate}
          onAddOn={onAddOn}
          onSelect={onSelect}
          onToggleDone={onToggleDone}
          onSelectDay={onSelectDay}
        />
      ) : (
        <DayAgenda
          dateKey={anchor}
          tasks={tasksByDate.get(anchor) ?? []}
          today={today}
          onSelect={onSelect}
          onToggleDone={onToggleDone}
          onAdd={onAddOn}
        />
      )}
    </section>
  );
}
