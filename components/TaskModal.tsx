"use client";

import { useEffect, useRef, useState } from "react";
import {
  currentAccent,
  DEFAULT_ICON,
  ICON_COLORS,
  ICON_LABELS,
  ICON_ORDER,
  TaskIcon,
  toIconName,
  type TaskIconName,
} from "@/lib/icons";
import type { NewTask, Task } from "@/lib/types";

type Props = {
  open: boolean;
  /** null이면 추가, Task가 오면 그 할 일을 수정한다. */
  task: Task | null;
  saving: boolean;
  onClose: () => void;
  /** 마감일을 여러 개 고르면 날짜 수만큼 넘어온다. */
  onSubmit: (drafts: NewTask[]) => void;
  onDelete: (task: Task) => void;
};

/** '2026-08-04' → '08/04' */
const shortDate = (key: string) => key.slice(5).replace("-", "/");

export default function TaskModal({
  open,
  task,
  saving,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  /**
   * 추가할 때는 여러 날짜를 골라 한 번에 여러 건을 만든다.
   * 수정은 이미 있는 한 건을 고치는 거라 항상 0~1개만 담는다.
   */
  const [dates, setDates] = useState<string[]>([]);
  const [icon, setIcon] = useState<TaskIconName>(DEFAULT_ICON);
  /** null이면 '테마 기본' — 저장할 때 현재 --accent 값으로 굳는다. */
  const [color, setColor] = useState<string | null>(null);
  /** 삭제 확인 모달이 떠 있는지 */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const editing = task !== null;

  // 열릴 때마다 상태를 초기화한다. 수정이면 저장된 값으로 채운다.
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDates(task?.due_date ? [task.due_date] : []);
    setIcon(toIconName(task?.icon));
    setColor(task?.icon_color ?? null);
    setConfirmOpen(false);
    titleRef.current?.focus();
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 확인 모달이 떠 있으면 그것만 닫는다.
      if (confirmOpen) setConfirmOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmOpen, onClose]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && !saving;

  const addDate = (value: string) => {
    if (!value) return;
    // 수정은 한 건짜리라 날짜도 하나만 유지한다.
    if (editing) setDates([value]);
    else setDates((prev) => (prev.includes(value) ? prev : [...prev, value].sort()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    // 색을 고르지 않았으면 지금 테마의 --accent 값을 굳혀서 저장한다.
    const base = {
      title: title.trim(),
      icon,
      icon_color: color ?? currentAccent(),
    };

    // 마감일은 선택 항목 — 하나도 없으면 마감 없는 할 일 한 건으로 저장한다.
    onSubmit(
      dates.length === 0
        ? [{ ...base, due_date: null }]
        : dates.map((due_date) => ({ ...base, due_date })),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-[380px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
      >
        <div className="flex items-center">
          <h2 id="task-modal-title" className="text-[16px] font-medium">
            {editing ? "할 일 수정" : "할 일 추가"}
          </h2>

          {editing && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              aria-label="할 일 삭제"
              title="삭제"
              className="-mr-1 ml-auto grid size-8 place-items-center rounded-full text-ink-faint transition hover:bg-soft hover:text-accent-deep"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  d="M4 7h16M9.5 4.5h5M6.5 7l.8 12.2h9.4L17.5 7M10 10.5v6M14 10.5v6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/*
          섹션 간격은 여기 space-y 한 곳에서만 준다.
          각 섹션에 margin을 따로 붙이면 필드를 추가할 때 간격이 어긋난다.
        */}
        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-[12px] text-ink-soft">
              할 일 이름 <span className="text-accent-deep">*</span>
            </span>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 방청소하기"
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-[14px] outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </label>

          <div>
            <label className="block">
              <span className="text-[12px] text-ink-soft">
                마감일 (선택){!editing && " · 여러 날짜를 고르면 각각 만들어져요"}
              </span>
              <input
                type="date"
                // 추가할 때는 고른 날짜를 아래 목록으로 옮기고 칸을 비워, 이어서 또 고를 수 있게 한다.
                value={editing ? (dates[0] ?? "") : ""}
                onChange={(e) => addDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-[14px] outline-none focus:border-accent"
              />
            </label>

            {!editing && dates.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {dates.map((d) => (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => setDates((prev) => prev.filter((x) => x !== d))}
                      aria-label={`${shortDate(d)} 빼기`}
                      className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1 text-[12px] text-ink transition hover:bg-soft-deep"
                    >
                      {shortDate(d)}
                      <svg viewBox="0 0 24 24" className="size-3 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <span className="text-[12px] text-ink-soft">아이콘</span>
            <div role="radiogroup" aria-label="아이콘" className="mt-1.5 flex gap-2">
              {ICON_ORDER.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={icon === name}
                  aria-label={ICON_LABELS[name]}
                  title={ICON_LABELS[name]}
                  onClick={() => setIcon(name)}
                  className={`grid size-9 place-items-center rounded-[10px] border bg-card transition ${
                    icon === name
                      ? "border-accent-deep ring-2 ring-soft-deep"
                      : "border-line hover:border-ink-faint"
                  }`}
                >
                  <TaskIcon icon={name} color={color} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[12px] text-ink-soft">색상</span>
            <div role="radiogroup" aria-label="색상" className="mt-2 flex items-center gap-2.5">
              <button
                type="button"
                role="radio"
                aria-checked={color === null}
                aria-label="테마 기본"
                title="테마 기본"
                onClick={() => setColor(null)}
                className={`size-6 rounded-full bg-accent transition ${
                  color === null ? "ring-2 ring-ink-soft ring-offset-2 ring-offset-card" : ""
                }`}
              />
              {ICON_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={`size-6 rounded-full transition ${
                    color === c.value ? "ring-2 ring-ink-soft ring-offset-2 ring-offset-card" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "저장 중…"
                : !editing && dates.length > 1
                  ? `${dates.length}개 저장`
                  : "저장"}
            </button>
          </div>
        </div>
      </form>

      {confirmOpen && task && (
        // 수정 모달 위에 겹쳐 띄운다. 바깥을 누르거나 Esc를 누르면 이것만 닫힌다.
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
            aria-labelledby="task-delete-title"
            className="w-full max-w-[300px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
          >
            <p id="task-delete-title" className="text-center text-[15px] font-medium">
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
                className="flex-1 rounded-full bg-accent-deep py-2.5 text-[13px] font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
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
