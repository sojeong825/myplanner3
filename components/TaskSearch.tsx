"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDday, type DateKey } from "@/lib/date";
import { TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  tasks: Task[];
  today: DateKey;
  onSelect: (task: Task) => void;
};

const MAX_RESULTS = 8;

/**
 * 제목으로 할 일을 찾는다. 달력이나 목록을 걸러내지 않고 결과만 띄우는 조회용이라,
 * 검색을 껐다 켜도 화면 상태가 흐트러지지 않는다.
 */
export default function TaskSearch({ tasks, today, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  // 바깥을 누르거나 Esc를 누르면 결과를 닫는다.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (task: Task) => {
    onSelect(task);
    setOpen(false);
    setQuery("");
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2.5 rounded-card border border-line bg-card px-4 py-2.5 shadow-card">
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-ink-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" strokeLinecap="round" />
        </svg>

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits.length > 0) {
              e.preventDefault();
              pick(hits[0]);
            }
          }}
          placeholder="일정 검색"
          aria-label="일정 검색"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="검색어 지우기"
            className="shrink-0 text-ink-faint transition hover:text-ink-soft"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-card border border-line bg-card py-1.5 shadow-card">
          {hits.length === 0 ? (
            <p className="px-4 py-4 text-center text-[12px] text-ink-faint">
              찾는 일정이 없어요
            </p>
          ) : (
            <>
              <ul className="max-h-[320px] overflow-y-auto">
                {hits.slice(0, MAX_RESULTS).map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => pick(task)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition hover:bg-soft"
                    >
                      <TaskIcon
                        icon={task.icon}
                        color={task.icon_color}
                        done={task.is_done}
                      />
                      <span
                        className={`truncate text-[13px] ${
                          task.is_done ? "text-ink-faint line-through" : "text-ink"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-soft">
                        {task.due_date
                          ? `${task.due_date.slice(5).replace("-", "/")} · ${
                              getDday(task.due_date, today).label
                            }`
                          : "마감 없음"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {hits.length > MAX_RESULTS && (
                <p className="border-t border-line px-4 pb-1 pt-2 text-center text-[11px] text-ink-faint">
                  {hits.length - MAX_RESULTS}건 더 있어요
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
