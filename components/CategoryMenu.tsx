"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, CategoryFilter } from "@/lib/categories";

type Props = {
  categories: Category[];
  value: CategoryFilter;
  onChange: (next: CategoryFilter) => void;
};

/**
 * 폰 머리줄에서 보고 있는 분류를 바꾸는 드롭다운.
 *
 * 넓은 화면에서는 분류가 사이드바에 죽 펼쳐져 있지만, 폰에서 사이드바는 서랍이라
 * 분류를 바꾸려면 서랍을 열고 고르고 닫아야 했다. 달력을 보면서 가장 자주 하는
 * 일인데 세 동작이 든다. 머리줄에는 늘 자리가 있으니 여기서 곧장 바꾼다.
 *
 * 분류를 만들고 지우는 일은 여기 없다 — 그건 가끔 하는 일이라 서랍에 그대로 둔다.
 */
export default function CategoryMenu({ categories, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = value === null ? null : categories.find((c) => c.id === value);
  // 고르고 있던 분류를 서랍에서 지우면 value만 남는다. 그때는 전체로 읽는다.
  const label = current ? current.name : "전체";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const pick = (next: CategoryFilter) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-w-0 max-w-full items-center gap-1 rounded-full px-2 py-1 text-left transition active:bg-soft/60"
      >
        <span className="min-w-0 truncate text-[15px] font-medium text-ink">{label}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-3.5 shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="분류"
          className="absolute left-0 top-[calc(100%+6px)] z-[60] max-h-[280px] w-[180px] overflow-y-auto rounded-xl border border-line bg-card py-1 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
        >
          {[null, ...categories.map((c) => c.id)].map((id) => {
            const active = value === id;
            const name = id === null ? "전체" : (categories.find((c) => c.id === id)?.name ?? "");

            return (
              <button
                key={id ?? "all"}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(id)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition ${
                  active ? "bg-soft" : "hover:bg-soft/50"
                }`}
              >
                <span
                  className={`min-w-0 flex-1 truncate text-[14px] ${
                    active ? "text-ink" : "text-ink-mid"
                  }`}
                >
                  {name}
                </span>
                {active && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-accent-deep"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}

          {categories.length === 0 && (
            <p className="px-3 py-2.5 text-[12px] leading-relaxed text-ink-faint">
              아직 만든 분류가 없어요.
              <br />
              왼쪽 메뉴에서 만들 수 있어요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
