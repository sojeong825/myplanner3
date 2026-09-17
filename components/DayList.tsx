"use client";

import { formatTime } from "@/lib/date";
import { TaskCheck } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  /** 비었을 때 할 말. 자리마다 말투가 달라서 밖에서 정한다. */
  emptyText?: string;
};

/**
 * 하루치 일정 목록.
 *
 * 일간 화면, 주간 화면(좁은 화면), 월간에서 날짜를 눌러 여는 시트 — 셋이 같은 줄을
 * 그린다. 세 곳에서 각자 그리면 한 곳만 고치고 나머지를 잊는다.
 */
export default function DayList({
  tasks,
  onSelect,
  onToggleDone,
  emptyText = "이날은 아직 비어 있어요",
}: Props) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-[13px] text-ink-faint">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
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
            className={`group/task flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-1 py-2.5 text-left transition active:bg-soft/60 lg:hover:bg-soft/50 ${
              task.is_done ? "text-ink-faint line-through" : "text-ink"
            }`}
          >
            <TaskCheck icon={task.icon} done={task.is_done} onToggle={() => onToggleDone(task)} />
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
  );
}
