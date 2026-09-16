"use client";

import { useEffect, useState } from "react";
import { categoryName, type Category } from "@/lib/categories";
import { formatTime, getDday, keyParts, type DateKey } from "@/lib/date";
import { StarButton, TaskIcon, TrashButton } from "@/lib/icons";
import { findReflection, REFLECTION_MAX, type Reflection } from "@/lib/reflections";
import type { Task } from "@/lib/types";

type Props = {
  /** null이면 닫힌 상태 */
  task: Task | null;
  categories: Category[];
  reflections: Reflection[];
  today: DateKey;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onDelete: (task: Task) => void;
  onSaveReflection: (date: DateKey, content: string) => Promise<void>;
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

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-[12px] transition ${
        active ? "bg-soft text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 일정 보기.
 *
 * 달력이나 목록에서 일정을 누르면 곧장 수정 모달이 뜨던 것을 한 단계 앞에 세운 화면이다.
 * 내용만 확인하려고 눌렀다가 모르는 새 값을 건드리는 일을 막는다 — 고치려면
 * '수정'을 한 번 더 눌러야 한다.
 *
 * 여기가 **회고로 들어가는 유일한 길**이다. '회고' 칸으로 옮기면 그 일정의 마감일
 * 하루치만 다룬다. 회고를 모아 보는 화면은 따로 두지 않는다 — 회고는 그날 일정을
 * 보다가 적는 것이지, 목록을 훑으러 오는 것이 아니다.
 */
export default function TaskDetail({
  task,
  categories,
  reflections,
  today,
  onClose,
  onEdit,
  onToggleStar,
  onDelete,
  onSaveReflection,
  saving,
}: Props) {
  /** 삭제 확인 창이 떠 있는지. 수정 모달과 같은 방식이다. */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState<"task" | "reflect">("task");
  const [draft, setDraft] = useState("");
  const [writing, setWriting] = useState(false);

  const date = task?.due_date ?? null;
  const saved = findReflection(reflections, date);

  // 다른 일정을 열면 처음 상태로 되돌린다. 남아 있으면 엉뚱한 일정을 지우거나
  // 남의 회고 위에 덮어쓰게 된다.
  useEffect(() => {
    setConfirmOpen(false);
    setTab("task");
  }, [task?.id]);

  // 날짜가 바뀌거나 바깥에서 회고가 바뀌면 입력칸을 저장된 값으로 맞춘다.
  useEffect(() => {
    setDraft(saved);
  }, [saved, date]);

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
  const dirty = draft !== saved;

  const commit = async () => {
    if (!date || !dirty) return;
    setWriting(true);
    try {
      await onSaveReflection(date, draft);
    } finally {
      setWriting(false);
    }
  };

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
          {/*
            삭제가 왼쪽, 별표가 오른쪽이다. 별표는 자주 누르는 것이라 모서리에 가장
            가까운 자리를 준다 — 삭제는 실수로 누르면 곤란하니 가장자리에서 한 칸 안쪽이다.
          */}
          <TrashButton onClick={() => setConfirmOpen(true)} className="size-9 text-ink-faint" />

          {/* 보기 화면에서도 별표만은 바로 켜고 끌 수 있다 — 수정할 내용이 아니라 표시다. */}
          <StarButton
            starred={task.is_starred}
            onToggle={() => onToggleStar(task)}
            className={`-mr-1 size-9 ${task.is_starred ? "text-accent" : "text-ink-faint"}`}
            iconClassName="size-6"
          />
        </div>

        {/*
          회고 칸은 마감일이 있을 때만 나온다. 날짜가 없으면 '어느 날의 회고'인지
          정할 수 없고, 억지로 오늘에 붙이면 엉뚱한 날에 글이 쌓인다.
        */}
        {date !== null && (
          <div className="-mx-1 mt-4 flex gap-1">
            <Tab active={tab === "task"} onClick={() => setTab("task")}>
              일정
            </Tab>
            <Tab active={tab === "reflect"} onClick={() => setTab("reflect")}>
              {/* 이미 쓴 날은 표시해둔다 — 눌러보기 전에 알 수 있어야 한다. */}
              회고{saved ? " ✓" : ""}
            </Tab>
          </div>
        )}

        {tab === "task" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="mt-4 flex items-baseline gap-2 px-1">
              <span className="text-[12px] text-ink-soft">{longDate(date!)}</span>
              <span className="ml-auto text-[11px] text-ink-faint">
                {writing ? "저장 중…" : dirty ? "저장 안 됨" : saved ? "저장됨" : ""}
              </span>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="이 날은 어땠나요? 잘한 것, 아쉬운 것, 다음에 할 것…"
              maxLength={REFLECTION_MAX}
              autoFocus
              // resize-none: 사용자가 늘리면 모달 밖으로 삐져나온다. 넘치면 안에서 스크롤된다.
              className="mt-2 h-[160px] w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => void commit()}
                disabled={!dirty || writing}
                className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {/* 내용을 비우고 저장하면 그 날짜의 회고가 지워진다. 버튼이 그걸 미리 알려준다. */}
                {saved && !draft.trim() ? "회고 지우기" : "저장"}
              </button>
            </div>
          </>
        )}
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
