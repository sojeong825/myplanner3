"use client";

import {
  buildMonthGrid,
  formatTime,
  keyParts,
  WEEKDAYS,
  weekdayOf,
  type DateKey,
} from "@/lib/date";
import { TaskCheck } from "@/lib/icons";
import { chipColor } from "@/lib/taskChip";
import { DESKTOP, useMediaQuery } from "@/lib/useMediaQuery";
import type { Task } from "@/lib/types";

type Props = {
  year: number;
  month: number;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
  /** 빈 칸을 누르면 그 날짜로 '할 일 추가'가 바로 열린다(노션 달력과 같은 동작). */
  onAddOn: (key: DateKey) => void;
  onSelect: (task: Task) => void;
  /** 아이콘 자리의 체크박스. 모달을 열지 않고 완료를 뒤집는다. */
  onToggleDone: (task: Task) => void;
  /**
   * 좁은 화면에서 칸을 눌렀을 때. 그 날짜를 고르기만 하고, 그날 목록은 달력 바로
   * 아래에 이어서 나온다 — 화면을 덮지 않아서 다른 날짜를 계속 눌러볼 수 있다.
   */
  onSelectDay: (key: DateKey) => void;
  /** 지금 고른 날. 좁은 화면에서 그 칸을 채워 표시한다. */
  selected: DateKey;
};

export default function MonthGrid({
  year,
  month,
  today,
  tasksByDate,
  onAddOn,
  onSelect,
  onToggleDone,
  onSelectDay,
  selected,
}: Props) {
  const cells = buildMonthGrid(year, month);
  /**
   * 칸을 눌렀을 때 무엇이 일어나는가. 이것만은 CSS로 가를 수 없어서 폭을 직접 본다.
   * 넓은 화면은 칸 안에 제목이 다 보이니 곧장 '추가'로 가고, 좁은 화면은 그 날짜를
   * 고르기만 한다(목록은 달력 아래에 이어진다).
   */
  const desktop = useMediaQuery(DESKTOP);

  /** 오늘이 무슨 요일인지. 요일 머리글에서 그 칸만 또렷하게 둔다(애플 캘린더와 같다). */
  const todayWeekday = weekdayOf(today);

  return (
    <>
      <div className="grid grid-cols-7 border-t border-line px-1 lg:px-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1.5 text-center text-[12px] lg:py-2.5 lg:text-[13px] ${
              i === todayWeekday
                ? "font-medium text-accent-deep"
                : i === 0
                  ? "text-accent-deep/70"
                  : "text-ink-soft"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/*
        좁은 화면에서는 세로 칸막이를 지운다. 가로 일곱 칸에 칸막이까지 그으면 글자보다
        선이 먼저 보인다 — 애플 캘린더도 가로줄만 긋는다. 넓은 화면은 칸마다 일정 제목이
        여러 줄 들어가므로 격자가 있는 편이 낫다.
      */}
      <div className="grid grid-cols-7 overflow-hidden rounded-b-card lg:grid-rows-6 lg:gap-px lg:bg-line-soft">
        {cells.map((cell) => {
          const dayTasks = tasksByDate.get(cell.key) ?? [];
          const isToday = cell.key === today;
          // 넓은 화면에는 '고른 날'이라는 것이 없다 — 칸마다 내용이 다 보인다.
          const picked = !desktop && cell.key === selected;

          return (
            /*
              칸을 누르면 그 날짜로 '할 일 추가'가 곧장 열린다. 안에 일정 버튼이
              들어가므로 <button>으로 감쌀 수 없다(버튼 중첩) — div + role로 둔다.
            */
            <div
              key={cell.key}
              role="button"
              tabIndex={0}
              aria-label={desktop ? `${cell.day}일에 할 일 추가` : `${cell.day}일 고르기`}
              aria-pressed={picked || undefined}
              onClick={() => (desktop ? onAddOn(cell.key) : onSelectDay(cell.key))}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                if (desktop) onAddOn(cell.key);
                else onSelectDay(cell.key);
              }}
              className={`group/cell relative flex min-h-[100px] cursor-pointer flex-col gap-1 overflow-hidden border-t border-line-soft px-0.5 pb-1.5 pt-1.5 transition hover:bg-canvas lg:min-h-[96px] lg:gap-1 lg:border-t-0 lg:px-2 lg:pb-1.5 lg:pt-2 ${
                picked ? "bg-soft" : isToday ? "bg-soft/50" : "bg-card"
              } ${cell.inMonth ? "" : "opacity-45"}`}
            >
              {/*
                고른 날은 채운 동그라미, 오늘은 색 글씨. 좁은 화면에서는 고른 날이
                따로 있어서 둘을 나눠야 하고, 넓은 화면에는 고른 날이 없으니
                오늘이 그대로 채운 동그라미를 가져간다.
              */}
              <span
                className={
                  picked || (isToday && desktop)
                    ? "grid size-6 shrink-0 place-items-center self-center rounded-full bg-accent text-[12px] font-medium text-white lg:size-6 lg:self-start lg:text-[12px]"
                    : isToday
                      ? "self-center px-0.5 text-[13px] font-medium text-accent-deep lg:self-start"
                      : `self-center px-0.5 text-[13px] lg:self-start lg:text-[13px] ${
                        cell.weekday === 0
                          ? "text-accent-deep"
                          : cell.inMonth
                              ? "text-ink-mid"
                              : "text-ink-soft"
                        }`
                }
              >
                {cell.day}
              </span>

              {/*
                누를 수 있다는 걸 알려주는 표시. 칸 전체가 버튼이라 이건 장식일 뿐이라
                pointer-events-none으로 두고 클릭은 칸이 받는다.
              */}
              <span className="pointer-events-none absolute right-1.5 top-1.5 hidden text-[13px] leading-none text-ink-faint opacity-0 transition group-hover/cell:opacity-100 lg:block">
                +
              </span>

              {/*
                좁은 화면에서는 제목을 넣을 자리가 없다(칸 하나가 가로 50px 남짓).
                이모지만 점처럼 찍어두고, 읽고 누르는 일은 칸을 눌러 여는 그날 목록에 맡긴다.
              */}
              {/*
                좁은 화면에서도 **제목**을 보여준다. 이모지만 찍어두면 그날 무슨 일이
                있는지 알 수 없어서, 결국 칸을 하나씩 눌러봐야 한다.

                이모지는 칩에 넣지 않는다 — 칸 하나가 가로 50px 남짓이라 이모지가
                두세 글자를 먹는다. 이모지는 그날 목록과 할 일 쪽에 그대로 있다.

                네 개까지 눕힌다. 칸이 그만큼 세로로 길어지지만, 가려서 +n으로 접어두면 결국 눌러봐야 안다.
                다섯 개 이상인 날만 +n을 붙인다 — 말없이 잘라버리면 없는 일정처럼 보인다.
                폰에서는 줄 높이를 고정하지 않는다(grid-rows-6은 넓은 화면만). 고정하면 바쁜 날 하나 때문에
                여섯 줄이 전부 그 높이로 늘어난다.
              */}
              <div className="flex flex-col gap-px lg:hidden">
                {dayTasks.slice(0, 4).map((task) => (
                  <span
                    key={task.id}
                    className={`truncate rounded-[3px] px-1 text-[10px] leading-[15px] ${chipColor(
                      task.category_id,
                      task.is_done,
                    )} ${task.is_starred && !task.is_done ? "font-medium" : ""}`}
                  >
                    {task.title}
                  </span>
                ))}
                {dayTasks.length > 4 && (
                  <span className="px-1 text-[9px] leading-[13px] text-ink-faint">
                    +{dayTasks.length - 4}
                  </span>
                )}
              </div>

              <div className="hidden min-h-0 flex-col gap-0.5 overflow-hidden lg:flex">
                {dayTasks.map((task) => (
                  // 안에 체크박스 버튼이 들어가므로 항목 자체는 버튼이 될 수 없다.
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    // 일정을 눌렀을 때 칸 선택까지 함께 일어나면 무엇을 눌렀는지 모호해진다.
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(task);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect(task);
                    }}
                    title={task.title}
                    className={`group/task flex cursor-pointer items-center gap-1 rounded px-0.5 text-left text-[12px] leading-5 transition hover:bg-soft ${
                      task.is_done ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    <TaskCheck
                      icon={task.icon}
                      done={task.is_done}
                      onToggle={() => onToggleDone(task)}
                      iconClassName="text-[12px]"
                      boxClassName="size-3.5"
                    />
                    {/* 시간은 제목보다 앞에 둔다. 달력에서는 '몇 시에'가 먼저 읽혀야 한다. */}
                    {task.due_time && !task.is_done && (
                      <span className="shrink-0 text-ink-soft">{formatTime(task.due_time)}</span>
                    )}
                    {/* 특별 일정은 제목에 형광펜을 긋는다. 완료된 건 이미 흐려서 긋지 않는다. */}
                    <span
                      className={`truncate ${
                        task.is_starred && !task.is_done ? "marker" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
