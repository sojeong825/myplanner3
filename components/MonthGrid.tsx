"use client";

import { buildMonthGrid, WEEKDAYS, type DateKey } from "@/lib/date";
import { TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  year: number;
  month: number;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
};

export default function MonthGrid({ year, month, today, tasksByDate }: Props) {
  const cells = buildMonthGrid(year, month);

  return (
    <>
      <div className="grid grid-cols-7 border-t border-line px-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2.5 text-center text-[12px] ${
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
            <div
              key={cell.key}
              className={`flex min-h-[88px] flex-col gap-1 overflow-hidden px-2 pb-1.5 pt-2 ${
                isToday ? "bg-soft/50" : "bg-card"
              } ${cell.inMonth ? "" : "opacity-45"}`}
            >
              <span
                className={
                  isToday
                    ? "grid size-5 shrink-0 place-items-center self-start rounded-full bg-accent text-[11px] font-medium text-white"
                    : `self-start px-0.5 text-[12px] ${
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
                  <div
                    key={task.id}
                    title={task.title}
                    className={`flex items-center gap-1 rounded px-0.5 text-[11px] leading-4 ${
                      task.is_done ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    <TaskIcon
                      icon={task.icon}
                      color={task.icon_color}
                      done={task.is_done}
                      className="size-3"
                    />
                    <span className="truncate">{task.title}</span>
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
