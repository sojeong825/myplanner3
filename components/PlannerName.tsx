"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PLANNER_NAME, PLANNER_NAME_MAX } from "@/lib/settings";

type Props = {
  name: string;
  onSave: (name: string) => void;
};

export default function PlannerName({ name, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  // Esc로 빠져나갈 때 뒤이어 오는 blur가 저장하지 않도록 표시해둔다.
  const cancelled = useRef(false);

  useEffect(() => {
    if (!editing) {
      setDraft(name);
      return;
    }
    const el = inputRef.current;
    el?.focus();
    el?.select();
  }, [editing, name]);

  const commit = () => {
    // 빈 값으로 저장하려 하면 기본 이름으로 되돌린다.
    onSave(draft.trim() || DEFAULT_PLANNER_NAME);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={PLANNER_NAME_MAX}
        aria-label="플래너 이름"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        onBlur={() => {
          // Enter와 바깥 클릭은 저장, Esc는 취소.
          if (cancelled.current) {
            cancelled.current = false;
            setDraft(name);
            setEditing(false);
            return;
          }
          commit();
        }}
        className="w-full rounded-lg border border-line bg-card px-2 py-1 text-center text-[15px] font-medium tracking-tight outline-none focus:border-accent"
      />
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <p className="truncate text-[15px] font-medium tracking-tight" title={name}>
        {name}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="플래너 이름 수정"
        className="shrink-0 text-ink-faint transition hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
