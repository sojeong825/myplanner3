"use client";

import { buildMonthGrid, formatTime, WEEKDAYS, type DateKey } from "@/lib/date";
import { TaskCheck, TaskIcon } from "@/lib/icons";
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
  /** 좁은 화면에서 칸을 눌렀을 때. 제목이 들어가지 않으니 그날 목록을 대신 연다. */
  onOpenDay: (key: DateKey) => void;
};

export default function MonthGrid({
  year,
  month,
  today,
  tasksByDate,
  onAddOn,
  onSelect,
  onToggleDone,
  onOpenDay,
}: Props) {
  const cells = buildMonthGrid(year, month);
  /**
   * 칸을 눌렀을 때 무엇이 열리는가. 이것만은 CSS로 가를 수 없어서 폭을 직접 본다.
   * 넓은 화면은 칸 안에 제목이 다 보이니 곧장 '추가'로 가고, 좁은 화면은 점만
   * 찍혀 있으니 먼저 그날 목록을 보여준다.
   */
  const desktop = useMediaQuery(DESKTOP);

  return (
    <>
      <div className="grid grid-cols-7 border-t border-line px-1 lg:px-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2 text-center text-[12px] lg:py-2.5 lg:text-[13px] ${
              i === 0 ? "text-accent-deep" : "text-ink-soft"
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
      <div className="grid grid-cols-7 grid-rows-6 overflow-hidden rounded-b-card lg:gap-px lg:bg-line-soft">
        {cells.map((cell) => {
          const dayTasks = tasksByDate.get(cell.key) ?? [];
          const isToday = cell.key === today;

          return (
            /*
              칸을 누르면 그 날짜로 '할 일 추가'가 곧장 열린다. 안에 일정 버튼이
              들어가므로 <button>으로 감쌀 수 없다(버튼 중첩) — div + role로 둔다.
            */
            <div
              key={cell.key}
              role="button"
              tabIndex={0}
              aria-label={desktop ? `${cell.day}일에 할 일 추가` : `${cell.day}일 일정 보기`}
              onClick={() => (desktop ? onAddOn(cell.key) : onOpenDay(cell.key))}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                if (desktop) onAddOn(cell.key);
                else onOpenDay(cell.key);
              }}
              className={`group/cell relative flex min-h-[72px] cursor-pointer flex-col gap-1 overflow-hidden border-t border-line-soft px-1 pb-1 pt-1.5 transition hover:bg-canvas lg:min-h-[96px] lg:border-t-0 lg:px-2 lg:pb-1.5 lg:pt-2 ${
                isToday ? "bg-soft/50" : "bg-card"
              } ${cell.inMonth ? "" : "opacity-45"}`}
            >
              <span
                className={
                  isToday
                    ? "grid size-6 shrink-0 place-items-center self-center rounded-full bg-accent text-[12px] font-medium text-white lg:size-6 lg:self-start lg:text-[12px]"
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
              <div className="flex flex-wrap items-center justify-center gap-0.5 lg:hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <TaskIcon
                    key={task.id}
                    icon={task.icon}
                    done={task.is_done}
                    className="text-[12px]"
                  />
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] leading-none text-ink-faint">
                    +{dayTasks.length - 3}
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
