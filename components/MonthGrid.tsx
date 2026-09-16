"use client";

import { buildMonthGrid, formatTime, WEEKDAYS, type DateKey } from "@/lib/date";
import { TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  year: number;
  month: number;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
  /** 빈 칸을 누르면 그 날짜로 '할 일 추가'가 바로 열린다(노션 달력과 같은 동작). */
  onAddOn: (key: DateKey) => void;
  onSelect: (task: Task) => void;
};

export default function MonthGrid({
  year,
  month,
  today,
  tasksByDate,
  onAddOn,
  onSelect,
}: Props) {
  const cells = buildMonthGrid(year, month);

  return (
    <>
      <div className="grid grid-cols-7 border-t border-line px-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2.5 text-center text-[13px] ${
              i === 0 ? "text-accent-deep" : "text-ink-soft"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-b-card bg-line-soft">
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
              aria-label={`${cell.day}일에 할 일 추가`}
              onClick={() => onAddOn(cell.key)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                onAddOn(cell.key);
              }}
              className={`group/cell relative flex min-h-[96px] cursor-pointer flex-col gap-1 overflow-hidden px-2 pb-1.5 pt-2 transition hover:bg-canvas ${
                isToday ? "bg-soft/50" : "bg-card"
              } ${cell.inMonth ? "" : "opacity-45"}`}
            >
              <span
                className={
                  isToday
                    ? "grid size-6 shrink-0 place-items-center self-start rounded-full bg-accent text-[12px] font-medium text-white"
                    : `self-start px-0.5 text-[13px] ${
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
              <span className="pointer-events-none absolute right-1.5 top-1.5 text-[13px] leading-none text-ink-faint opacity-0 transition group-hover/cell:opacity-100">
                +
              </span>

              <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    // 일정을 눌렀을 때 칸 선택까지 함께 일어나면 무엇을 눌렀는지 모호해진다.
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(task);
                    }}
                    title={task.title}
                    className={`flex cursor-pointer items-center gap-1 rounded px-0.5 text-left text-[12px] leading-5 transition hover:bg-soft ${
                      task.is_done ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    <TaskIcon icon={task.icon} done={task.is_done} className="text-[12px]" />
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
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
