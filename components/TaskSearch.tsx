"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTime, getDday, type DateKey } from "@/lib/date";
import { TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  /**
   * 전체 할 일. 일부러 일/일상 필터를 거치지 않은 목록을 받는다 —
   * 찾는 일정이 지금 필터 밖에 있다는 이유로 안 나오면 그게 더 헷갈린다.
   */
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
  /** 방향키로 고르고 있는 항목. 목록이 바뀌면 항상 첫 번째로 되돌아간다. */
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  const visible = hits.slice(0, MAX_RESULTS);

  // 검색어를 고치면 이전에 고르고 있던 자리는 의미가 없다.
  useEffect(() => {
    setActive(0);
  }, [query]);

  // 방향키로 목록 밖까지 내려가면 따라 스크롤한다. 'nearest'라 이미 보이면 가만히 둔다.
  useEffect(() => {
    itemRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // 바깥을 누르면 결과를 닫는다. (Esc는 입력칸에서 직접 받는다 — 아래 onKeyDown)
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const pick = (task: Task) => {
    onSelect(task);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    /*
     * 한글 입력 중에는 키를 그대로 받으면 안 된다.
     *
     * IME가 글자를 조합하는 동안 Enter는 '조합을 확정한다'는 뜻이고, 그 확정 키가
     * keydown으로도 한 번 올라온다. 가드가 없으면 '치과'를 치고 Enter를 누른 순간
     * 조합 확정용 Enter가 곧바로 첫 결과를 열어버린다 — 사용자는 아직 검색어를
     * 다 입력하지도 않았는데 엉뚱한 일정이 뜨는 것으로 보인다.
     * 방향키도 조합 중에는 IME가 후보를 고르는 데 쓰므로 함께 막는다.
     */
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (visible.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i - 1 + visible.length) % visible.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // active가 목록 밖으로 벗어난 순간(결과가 줄어든 직후 등)에는 첫 항목으로 떨어진다.
      pick(visible[active] ?? visible[0]);
    }
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
          onKeyDown={onKeyDown}
          placeholder="일정 검색"
          aria-label="일정 검색"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="task-search-results"
          aria-activedescendant={
            showPanel && visible.length > 0 ? `task-search-hit-${active}` : undefined
          }
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
              <ul id="task-search-results" role="listbox" className="max-h-[320px] overflow-y-auto">
                {visible.map((task, i) => (
                  <li
                    key={task.id}
                    id={`task-search-hit-${i}`}
                    role="option"
                    aria-selected={i === active}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => pick(task)}
                      // 마우스를 올린 항목이 곧 방향키가 가리키는 항목이 되게 맞춘다.
                      // 둘이 따로 놀면 강조가 두 군데 생겨서 어느 쪽이 열릴지 알 수 없다.
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition ${
                        i === active ? "bg-soft" : ""
                      }`}
                    >
                      <TaskIcon icon={task.icon} done={task.is_done} />
                      <span
                        className={`truncate text-[13px] ${
                          task.is_done ? "text-ink-faint line-through" : "text-ink"
                        } ${task.is_starred && !task.is_done ? "marker" : ""}`}
                      >
                        {task.title}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-ink-soft">
                        {task.due_date
                          ? `${task.due_date.slice(5).replace("-", "/")}${
                              task.due_time ? " " + formatTime(task.due_time) : ""
                            } · ${getDday(task.due_date, today).label}`
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
