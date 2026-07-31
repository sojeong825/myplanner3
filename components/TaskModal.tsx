"use client";

import { useEffect, useRef, useState } from "react";
import type { NewTask } from "@/lib/types";

type Props = {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (task: NewTask) => void;
};

export default function TaskModal({ open, saving, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // 열릴 때마다 빈 상태로 시작하고 이름 칸에 포커스를 준다.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDueDate("");
    titleRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    // 마감일은 선택 항목 — 비어 있으면 null로 저장한다.
    onSubmit({ title: title.trim(), due_date: dueDate || null });
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
        <h2 id="task-modal-title" className="text-[16px] font-medium">
          할 일 추가
        </h2>

        <label className="mt-5 block">
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

        <label className="mt-4 block">
          <span className="text-[12px] text-ink-soft">마감일 (선택)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-[14px] outline-none focus:border-accent"
          />
        </label>

        <div className="mt-6 flex gap-2">
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
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
