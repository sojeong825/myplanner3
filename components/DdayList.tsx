"use client";

import { getDday, type DateKey } from "@/lib/date";
import { TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  /** 미완료 + 마감일 있음 + 아직 마감 전 + 마감일 오름차순으로 이미 걸러진 목록 */
  tasks: Task[];
  today: DateKey;
  onSelect: (task: Task) => void;
};

export default function DdayList({ tasks, today, onSelect }: Props) {
  return (
    // 항목이 늘어도 화면 절반을 넘지 않게 카드 높이를 묶고, 넘치면 안에서만 스크롤한다.
    // 그래야 아래 '할 일' 카드 자리가 밀리지 않는다.
    <section className="flex max-h-[50vh] shrink-0 flex-col rounded-card border border-line bg-card p-5 shadow-card">
      <h2 className="px-1 text-[14px] font-medium">얼마 남지 않은 일정</h2>

      {tasks.length === 0 ? (
        <p className="px-1 py-6 text-center text-[12px] text-ink-faint">
          마감일이 있는 할 일이 없어요
        </p>
      ) : (
        <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {tasks.map((task) => {
            const dday = getDday(task.due_date as string, today);

            return (
              <li key={task.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(task)}
                  title={task.title}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] bg-card px-3 py-2.5 text-left transition hover:bg-canvas"
                >
                  <TaskIcon icon={task.icon} color={task.icon_color} />
                  <span className="truncate text-[13px]">{task.title}</span>
                  <span
                    className={`ml-auto shrink-0 font-mono text-[12px] ${
                      dday.today ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {dday.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
