"use client";

import { useEffect, useState } from "react";
import { getDday, type DateKey } from "@/lib/date";
import { StarMark, TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type TabId = "upcoming" | "overdue";

type Props = {
  /** 미완료 + 마감일 있음 + D-0~D-10. 별표 먼저, 그다음 마감일 오름차순으로 정렬돼 온다. */
  upcoming: Task[];
  /** 미완료 + 마감이 지남. 별표 먼저, 그다음 최근에 지난 순. */
  overdue: Task[];
  today: DateKey;
  onSelect: (task: Task) => void;
};

function Tab({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] transition ${
        active ? "bg-soft text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`min-w-4 rounded-full px-1 text-center text-[10px] leading-4 ${
            active ? "bg-accent text-white" : "bg-soft text-ink-soft"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function ScheduleCard({ upcoming, overdue, today, onSelect }: Props) {
  const [tab, setTab] = useState<TabId>("upcoming");

  // 놓친 일정을 전부 체크해서 비면 보고 있을 이유가 없으므로 돌아온다.
  // (반대로 자동으로 '지난 일정'을 열지는 않는다 — 보고 있던 화면이 멋대로 바뀐다.)
  useEffect(() => {
    if (tab === "overdue" && overdue.length === 0) setTab("upcoming");
  }, [tab, overdue.length]);

  const tasks = tab === "upcoming" ? upcoming : overdue;

  return (
    // 항목이 늘어도 화면 절반을 넘지 않게 카드 높이를 묶고, 넘치면 안에서만 스크롤한다.
    // 그래야 아래 '할 일' 카드 자리가 밀리지 않는다.
    <section className="flex max-h-[50vh] shrink-0 flex-col rounded-card border border-line bg-card p-5 shadow-card">
      <div className="-mx-1 flex items-center gap-1">
        <Tab
          active={tab === "upcoming"}
          count={0}
          onClick={() => setTab("upcoming")}
        >
          다가오는 일정
        </Tab>
        <Tab
          active={tab === "overdue"}
          count={overdue.length}
          onClick={() => setTab("overdue")}
        >
          지난 일정
        </Tab>
      </div>

      {tasks.length === 0 ? (
        <p className="px-1 py-6 text-center text-[12px] text-ink-faint">
          {tab === "upcoming" ? "10일 안에 마감인 일정이 없어요" : "놓친 일정이 없어요"}
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
                  title={task.memo ? `${task.title}\n${task.memo}` : task.title}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2.5 text-left transition hover:bg-canvas ${
                    task.is_starred ? "bg-soft/60" : "bg-card"
                  }`}
                >
                  {task.is_starred && <StarMark />}
                  <TaskIcon icon={task.icon} />
                  <span
                    className={`truncate text-[13px] ${
                      task.is_starred ? "font-medium" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  <span
                    className={`ml-auto shrink-0 text-[12px] ${
                      // 오늘 마감과 지나버린 것만 또렷하게 둔다.
                      dday.today || dday.overdue ? "text-ink" : "text-ink-soft"
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
