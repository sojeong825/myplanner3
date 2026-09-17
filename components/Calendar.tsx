"use client";

import { useRef } from "react";
import DayAgenda from "@/components/DayAgenda";
import MonthGrid from "@/components/MonthGrid";
import WeekGrid from "@/components/WeekGrid";
import { formatMonthTitle, formatWeekTitle, keyParts, type DateKey } from "@/lib/date";
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
  /**
   * 좁은 화면에서 날짜를 골랐을 때 — 월간의 칸이든 주간의 요일 줄이든.
   * anchor가 그 날로 옮겨가고, 달력 아래 목록이 그날 것으로 바뀐다.
   */
  onSelectDay: (key: DateKey) => void;
  /** 날짜 없이 여는 추가. 넓은 화면에만 있는 버튼이다. */
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

export const VIEW_LABEL: Record<CalendarView, string> = {
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
    <div className="flex rounded-full border border-line p-0.5">
      {(["week", "month"] as const).map((v) => (
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
  onSelectDay,
  onAdd,
}: Props) {
  const { y, m } = keyParts(anchor);
  const title = view === "month" ? formatMonthTitle(y, m) : formatWeekTitle(anchor);

  const agendaRef = useRef<HTMLDivElement>(null);

  /**
   * 날짜를 고르고, 그날 목록이 화면 밖이면 보이는 데까지만 끌어올린다.
   *
   * 폰에서 달력 여섯 줄은 화면 높이를 거의 다 쓴다. 목록은 그 아래에 있어서,
   * 날짜를 눌러도 목록이 바뀌는 것을 못 본다 — 아무 일도 안 일어난 것처럼 보인다.
   *
   * 목록을 화면 맨 위로 올려버리면 달력이 밀려나서 다음 날짜를 못 고른다.
   * 그래서 목록 첫 줄이 화면 55% 지점에 오는 만큼만 움직인다 — 달력 아랫줄은
   * 그대로 보이고 목록도 보인다. 이미 보이고 있으면 건드리지 않는다.
   */
  const selectDay = (key: DateKey) => {
    onSelectDay(key);

    const el = agendaRef.current;
    if (!el) return;
    const target = window.innerHeight * 0.55;
    const gap = el.getBoundingClientRect().top - target;
    if (gap > 0) window.scrollBy({ top: gap, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col rounded-card border border-line bg-card shadow-card">
      <header className="px-4 py-3 lg:px-6 lg:py-5">
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
            이 줄은 통째로 넓은 화면 전용이다.

            폰에서는 달력 윗부분에 버튼이 늘어날수록 정작 달력이 안 보여서, 보기 전환은
            앱 머리줄로 올리고 추가는 달력 아래 그날 목록의 '+ 추가'에 맡겼다.
            넓은 화면은 자리가 남으니 둘 다 여기 그대로 둔다.
          */}
          <div className="order-3 hidden w-full items-center gap-2 lg:ml-auto lg:flex lg:w-auto">
            <ViewToggle value={view} onChange={onViewChange} />
            <button
              type="button"
              onClick={onAdd}
              className="whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accent-deep"
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
          onSelectDay={selectDay}
          selected={anchor}
        />
      ) : (
        <WeekGrid
          anchor={anchor}
          today={today}
          tasksByDate={tasksByDate}
          onAddOn={onAddOn}
          onSelect={onSelect}
          onToggleDone={onToggleDone}
          onSelectDay={onSelectDay}
        />
      )}

      {/*
        폰에서 월간일 때 고른 날의 목록. 달력을 덮지 않고 아래에 이어 붙는다 —
        덮어버리면 목록을 보는 동안 다른 날짜를 눌러볼 수가 없다.
        (주간은 WeekGrid가 요일 줄 아래에 같은 목록을 이미 달고 있다.)
      */}
      {view === "month" && (
        <div ref={agendaRef} className="lg:hidden">
          <DayAgenda
            dateKey={anchor}
            tasks={tasksByDate.get(anchor) ?? []}
            today={today}
            showTitle
            onSelect={onSelect}
            onToggleDone={onToggleDone}
            onAdd={onAddOn}
          />
        </div>
      )}
    </section>
  );
}
