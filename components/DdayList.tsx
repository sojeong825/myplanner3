"use client";

import { getDday, type DateKey } from "@/lib/date";
import type { Task } from "@/lib/types";

type Props = {
  /** 미완료 + 마감일 있음 + 마감일 오름차순으로 이미 정렬된 목록 */
  tasks: Task[];
  today: DateKey;
};

export default function DdayList({ tasks, today }: Props) {
  return (
    <section className="rounded-card border border-line bg-card p-5 shadow-card">
      <h2 className="px-1 text-[14px] font-medium">얼마 남지 않은 일정</h2>

      {tasks.length === 0 ? (
        <p className="px-1 py-6 text-center text-[12px] text-ink-faint">
          마감일이 있는 할 일이 없어요
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {tasks.map((task) => {
            const dday = getDday(task.due_date as string, today);

            return (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-[10px] bg-card px-3 py-2.5"
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    dday.overdue ? "bg-accent-deep" : "bg-accent"
                  }`}
                />
                <span className="truncate text-[13px]" title={task.title}>
                  {task.title}
                </span>
                <span
                  className={`ml-auto shrink-0 font-mono text-[12px] ${
                    dday.overdue
                      ? "text-accent-deep"
                      : dday.today
                        ? "text-ink"
                        : "text-ink-soft"
                  }`}
                >
                  {dday.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
