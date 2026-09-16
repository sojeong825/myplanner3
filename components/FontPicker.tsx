"use client";

import { useEffect, useRef, useState } from "react";
import { FONTS, type FontId } from "@/lib/fonts";

type Props = {
  value: FontId;
  onChange: (font: FontId) => void;
};

/** 글꼴 이름을 그 글꼴로 그린다. 폴백을 붙여둬서 CDN이 늦어도 글자가 사라지지 않는다. */
const styleOf = (family: string) => ({
  fontFamily: `"${family}", var(--font-noto-kr), sans-serif`,
});

/**
 * 글꼴 고르기.
 *
 * 열여섯 개를 죽 펼쳐두면 설정 모달을 글꼴 목록이 통째로 차지한다. 자주 바꾸는 값도
 * 아니라서 접어두고, 누를 때만 펼친다.
 *
 * **글꼴 이름을 그 글꼴로 그린다.** 이름만 나열하면 '리디바탕'이 어떻게 생겼는지
 * 알 수 없어서 하나씩 눌러보며 찾게 된다. 접어둔 덕분에 값이 하나 더 붙는다 —
 * 목록을 펼치기 전까지는 고른 글꼴 하나만 내려받는다.
 */
export default function FontPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = FONTS.find((f) => f.id === value) ?? FONTS[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      // 설정 모달도 Esc를 듣고 있다. 여기서 멈추지 않으면 목록을 닫으려다 모달까지 닫힌다.
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    // capture 단계에서 잡아야 모달의 window 리스너보다 먼저 온다.
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2.5 text-left transition hover:border-ink-faint"
      >
        <span style={styleOf(current.family)} className="text-[15px] text-ink">
          {current.label}
        </span>
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
          aria-label="글꼴"
          // 설정 모달 안에 뜨는 목록이라 z-index를 모달보다 높게 둔다.
          className="absolute inset-x-0 top-[calc(100%+4px)] z-[70] max-h-[248px] overflow-y-auto rounded-lg border border-line bg-card py-1 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
        >
          {FONTS.map((font) => {
            const active = font.id === value;
            return (
              <button
                key={font.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(font.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${
                  active ? "bg-soft" : "hover:bg-soft/50"
                }`}
              >
                <span
                  style={styleOf(font.family)}
                  className={`text-[15px] ${active ? "text-ink" : "text-ink-mid"}`}
                >
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
