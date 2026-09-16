"use client";

import { useEffect, useState } from "react";
import { categoryName, type Category } from "@/lib/categories";
import { formatTime, getDday, keyParts, type DateKey } from "@/lib/date";
import { StarButton, TaskIcon, TrashButton } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  /** null이면 닫힌 상태 */
  task: Task | null;
  categories: Category[];
  today: DateKey;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** 삭제 요청이 서버를 오가는 동안 버튼을 잠근다. */
  saving: boolean;
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
  onDelete,
  saving,
}: Props) {
  /** 삭제 확인 창이 떠 있는지. 수정 모달과 같은 방식이다. */
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 다른 일정을 열면 확인 창은 닫는다. 남아 있으면 엉뚱한 일정을 지우게 된다.
  useEffect(() => {
    setConfirmOpen(false);
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 확인 창이 떠 있으면 그것만 닫는다.
      if (confirmOpen) setConfirmOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, confirmOpen, onClose]);

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
            {/* 형광펜은 글자에만 그어야 해서 제목 전체가 아니라 안쪽 span에 건다. */}
            <span className={task.is_starred && !task.is_done ? "marker" : ""}>
              {task.title}
            </span>
          </h2>
          {/* 보기 화면에서도 별표만은 바로 켜고 끌 수 있다 — 수정할 내용이 아니라 표시다. */}
          <StarButton
            starred={task.is_starred}
            onToggle={() => onToggleStar(task)}
            className={`size-9 ${task.is_starred ? "text-accent" : "text-ink-faint"}`}
            iconClassName="size-6"
          />

          {/* 삭제는 별 바로 옆. 수정 모달을 거치지 않고 여기서 바로 지울 수 있다. */}
          <TrashButton onClick={() => setConfirmOpen(true)} className="-mr-1 size-9" />
        </div>

        <div className="mt-5 space-y-3">
          <Field label="마감일">
            {task.due_date ? (
              <span className="flex flex-wrap items-baseline gap-2">
                {longDate(task.due_date)}
                {task.due_time && (
                  <span className="text-ink-mid">{formatTime(task.due_time)}</span>
                )}
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

      {confirmOpen && (
        // 보기 모달 위에 겹쳐 띄운다. 바깥을 누르거나 Esc를 누르면 이것만 닫힌다.
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/25 p-4"
          onMouseDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="task-detail-delete-title"
            className="w-full max-w-[300px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
          >
            <p id="task-detail-delete-title" className="text-center text-[15px] font-medium">
              삭제할까요?
            </p>
            <p className="mt-2 break-keep text-center text-[12px] leading-relaxed text-ink-soft">
              &lsquo;{task.title}&rsquo; 은(는) 되돌릴 수 없어요.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={saving}
                className="flex-1 rounded-full bg-danger py-2.5 text-[13px] font-medium text-white transition hover:bg-danger-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
