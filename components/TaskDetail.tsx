"use client";

import { useEffect } from "react";
import { categoryName, type Category } from "@/lib/categories";
import { getDday, keyParts, type DateKey } from "@/lib/date";
import { StarButton, TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  /** null이면 닫힌 상태 */
  task: Task | null;
  categories: Category[];
  today: DateKey;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleStar: (task: Task) => void;
};

/** '2026-09-20' → '2026년 9월 20일' */
function longDate(key: DateKey) {
  const { y, m, d } = keyParts(key);
  return `${y}년 ${m}월 ${d}일`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-12 shrink-0 pt-px text-[12px] text-ink-faint">{label}</span>
      <div className="min-w-0 flex-1 text-[13px] text-ink">{children}</div>
    </div>
  );
}

/**
 * 일정 보기.
 *
 * 달력이나 목록에서 일정을 누르면 곧장 수정 모달이 뜨던 것을 한 단계 앞에 세운 화면이다.
 * 내용만 확인하려고 눌렀다가 모르는 새 값을 건드리는 일을 막는다 — 고치려면
 * '수정'을 한 번 더 눌러야 한다.
 */
export default function TaskDetail({
  task,
  categories,
  today,
  onClose,
  onEdit,
  onToggleStar,
}: Props) {
  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;

  const dday = task.due_date ? getDday(task.due_date, today) : null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="w-full max-w-[380px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
      >
        <div className="flex items-start gap-2.5">
          <TaskIcon icon={task.icon} done={task.is_done} className="mt-0.5 text-[20px]" />
          <h2
            id="task-detail-title"
            className={`min-w-0 flex-1 break-keep text-[17px] font-medium leading-snug ${
              task.is_done ? "text-ink-faint line-through" : "text-ink"
            }`}
          >
            {task.title}
          </h2>
          {/* 보기 화면에서도 별표만은 바로 켜고 끌 수 있다 — 수정할 내용이 아니라 표시다. */}
          <StarButton
            starred={task.is_starred}
            onToggle={() => onToggleStar(task)}
            className={`size-9 ${task.is_starred ? "text-accent" : "text-ink-faint"}`}
            iconClassName="size-6"
          />
        </div>

        <div className="mt-5 space-y-3">
          <Field label="마감일">
            {task.due_date ? (
              <span className="flex flex-wrap items-baseline gap-2">
                {longDate(task.due_date)}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    dday!.overdue || dday!.today
                      ? "bg-soft text-ink"
                      : "bg-canvas text-ink-soft"
                  }`}
                >
                  {dday!.label}
                </span>
              </span>
            ) : (
              <span className="text-ink-faint">마감 없음</span>
            )}
          </Field>

          <Field label="분류">
            {/* 분류를 지우면 category_id가 null이 되므로 여기도 자연히 '미분류'가 된다. */}
            {categoryName(categories, task.category_id) ?? (
              <span className="text-ink-faint">미분류</span>
            )}
          </Field>

          <Field label="상태">
            {task.is_done ? "완료" : <span className="text-ink-soft">진행 중</span>}
          </Field>

          {task.memo && (
            <Field label="메모">
              {/* 줄바꿈을 그대로 살린다 — 메모는 사용자가 적은 모양 그대로 보여야 한다. */}
              <p className="whitespace-pre-wrap break-keep leading-relaxed">{task.memo}</p>
            </Field>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
}
