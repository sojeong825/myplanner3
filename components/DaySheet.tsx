"use client";

import { useEffect } from "react";
import { formatTime, keyParts, WEEKDAYS, type DateKey } from "@/lib/date";
import { TaskCheck } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  /** null이면 닫힌 상태. */
  dateKey: DateKey | null;
  tasks: Task[];
  today: DateKey;
  onClose: () => void;
  onSelect: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onAdd: (key: DateKey) => void;
};

/** '9월 17일 (수)'. 시트 제목은 연도까지 갈 필요가 없다 — 위에 달력이 열려 있다. */
function dayTitle(key: DateKey): string {
  const { y, m, d } = keyParts(key);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

/**
 * 좁은 화면에서 달력 칸을 눌렀을 때 아래에서 올라오는 그날 목록.
 *
 * 폰에서 달력 한 칸은 가로 50px 남짓이라 제목이 들어가지 않는다. 칸에는 이모지만
 * 점처럼 찍고, 실제로 읽고 누르는 일은 전부 여기서 한다. 넓은 화면에는 이 시트가
 * 아예 없다 — 거기서는 칸 안에 제목이 그대로 보인다.
 */
export default function DaySheet({
  dateKey,
  tasks,
  today,
  onClose,
  onSelect,
  onToggleDone,
  onAdd,
}: Props) {
  useEffect(() => {
    if (!dateKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dateKey, onClose]);

  if (!dateKey) return null;

  const isToday = dateKey === today;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* 뒤를 눌러도 닫힌다. 시트가 화면 아래쪽만 덮으므로 위쪽은 늘 비어 있다. */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex-1 bg-ink/20 backdrop-blur-[2px]"
      />

      <section className="max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-line bg-card px-5 pb-6 pt-3 shadow-[0_-18px_50px_-20px_rgba(92,74,71,0.35)]">
        {/* 손가락으로 끌어내릴 것 같은 손잡이. 실제로 끌리지는 않지만 어디를 눌러야 할지 알려준다. */}
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />

        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-medium text-ink">{dayTitle(dateKey)}</h2>
          {isToday && (
            <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] text-accent-deep">오늘</span>
          )}
          <button
            type="button"
            onClick={() => onAdd(dateKey)}
            className="ml-auto shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-accent-deep"
          >
            + 추가
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-faint">이날은 아직 비어 있어요</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1">
            {tasks.map((task) => (
              <li key={task.id}>
                {/* 안에 체크박스 버튼이 들어가므로 항목 자체는 버튼이 될 수 없다. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(task)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    onSelect(task);
                  }}
                  className={`group/task flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-1 py-2.5 text-left transition active:bg-soft/60 ${
                    task.is_done ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  <TaskCheck
                    icon={task.icon}
                    done={task.is_done}
                    onToggle={() => onToggleDone(task)}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-[14px] ${
                      task.is_starred && !task.is_done ? "marker" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.due_time && (
                    <span className="shrink-0 text-[12px] text-ink-soft">
                      {formatTime(task.due_time)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
