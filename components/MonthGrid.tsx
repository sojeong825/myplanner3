"use client";

import { buildMonthGrid, WEEKDAYS, type DateKey } from "@/lib/date";
import { StarMark, TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

/**
 * 월간은 칸이 넉넉해서 자간을 살짝 벌린다. 조선굴림체는 글자 사이가 촘촘한 편이라
 * 작은 크기(11~12px)에서 붙어 보이는데, 여기서 한 번만 풀어준다.
 * 주간은 반대로 칸이 좁아서 WeekGrid에서 자간을 좁힌다.
 */
const MONTH_TRACKING = "tracking-[0.025em]";

type Props = {
  year: number;
  month: number;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
  selectedDate: DateKey | null;
  onSelectDate: (key: DateKey) => void;
  onSelect: (task: Task) => void;
};

export default function MonthGrid({
  year,
  month,
  today,
  tasksByDate,
  selectedDate,
  onSelectDate,
  onSelect,
}: Props) {
  const cells = buildMonthGrid(year, month);

  return (
    <>
      <div className="grid grid-cols-7 border-t border-line px-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2.5 text-center text-[12px] ${MONTH_TRACKING} ${
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
          const isSelected = cell.key === selectedDate;

          return (
            /*
              칸 자체가 '이 날짜를 고른다' 버튼이다. 안에 일정 버튼이 들어가므로
              <button>으로 감싸면 버튼 중첩이 되어 HTML이 깨진다 — div + role로 둔다.
              고른 표시는 ring-inset이다. 바깥으로 나가는 링은 gap-px 격자에서 옆 칸을 덮는다.
            */
            <div
              key={cell.key}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${cell.day}일 선택`}
              onClick={() => onSelectDate(cell.key)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                onSelectDate(cell.key);
              }}
              className={`flex min-h-[88px] cursor-pointer flex-col gap-1 overflow-hidden px-2 pb-1.5 pt-2 transition ${
                isToday ? "bg-soft/50" : "bg-card"
              } ${cell.inMonth ? "" : "opacity-45"} ${
                isSelected ? "ring-2 ring-accent ring-inset" : "hover:bg-canvas"
              }`}
            >
              <span
                className={
                  isToday
                    ? "grid size-5 shrink-0 place-items-center self-start rounded-full bg-accent text-[11px] font-medium text-white"
                    : `self-start px-0.5 text-[12px] ${MONTH_TRACKING} ${
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
                    className={`flex cursor-pointer items-center gap-1 rounded px-0.5 text-left text-[11px] leading-4 ${MONTH_TRACKING} transition hover:bg-soft ${
                      task.is_done
                        ? "text-ink-faint line-through"
                        : task.is_starred
                          ? "font-medium text-ink"
                          : "text-ink"
                    }`}
                  >
                    {task.is_starred && !task.is_done && <StarMark className="size-2.5" />}
                    <TaskIcon icon={task.icon} done={task.is_done} className="text-[11px]" />
                    <span className="truncate">{task.title}</span>
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
