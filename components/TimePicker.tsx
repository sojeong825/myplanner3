"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 마감 시간 고르기. 'HH:MM' 문자열 하나를 시·분 두 칸으로 나눠 다룬다.
 *
 * 24시간으로 고른다. 오전/오후를 따로 고르게 두면 칸이 셋이 되는데, 그러느니
 * '15시'를 한 번에 누르는 편이 빠르다.
 *
 * 분은 10분 단위 여섯 개만 준다. 네이티브 <input type="time">은 1분 단위라 고를 것이
 * 예순 개였는데, 실제로 쓰는 값은 정각 아니면 30분 언저리다.
 *
 * 단위를 좁히기 전에 저장해둔 값(예: 15:37)은 그대로 살려둔다 — 이제 고를 수 없는
 * 값이라고 해서 이미 정해둔 시간을 말없이 옮길 이유는 없다. 그 값만 목록에 끼워 넣는다.
 */

const STEP = 10;
const MINUTES = Array.from({ length: 60 / STEP }, (_, i) => i * STEP);
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const pad = (n: number) => String(n).padStart(2, "0");

type Option = { value: string; label: string };

/**
 * 스크롤되는 드롭다운.
 *
 * 네이티브 <select>는 스물네 개를 한 번에 펼쳐서 화면을 다 덮는다. 여기서는 높이를
 * 묶어두고 안에서 굴린다 — 글꼴 고르는 자리(FontPicker)와 같은 방식이다.
 */
function Picker({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // 지금 고른 값이 목록 한가운데 오도록 — 21시를 고르고 다시 열면 맨 위부터 찾아야 한다.
    // scrollIntoView를 쓰지 않는 이유: 그건 바깥 스크롤(모달 본문)까지 같이 움직인다.
    const list = listRef.current;
    const picked = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (list && picked) {
      list.scrollTop = picked.offsetTop - list.clientHeight / 2 + picked.offsetHeight / 2;
    }

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      // 모달도 Esc를 듣고 있다. 여기서 멈추지 않으면 목록을 닫으려다 모달까지 닫힌다.
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

  const current = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center gap-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[13px] text-ink outline-none transition focus:border-accent disabled:cursor-default disabled:opacity-40"
      >
        <span className="whitespace-nowrap">{current?.label ?? ""}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-3 shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+4px)] z-[70] max-h-[184px] min-w-full overflow-y-auto rounded-lg border border-line bg-card py-1 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                data-active={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`block w-full whitespace-nowrap px-3 py-2 text-left text-[13px] transition ${
                  active ? "bg-soft text-ink" : "text-ink-mid hover:bg-soft/50"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Props = {
  /** 'HH:MM', 또는 빈 문자열이면 시간 없음. */
  value: string;
  onChange: (value: string) => void;
};

export default function TimePicker({ value, onChange }: Props) {
  const hh = value ? value.slice(0, 2) : "";
  const mm = value ? value.slice(3, 5) : "00";

  const minutes = MINUTES.includes(Number(mm))
    ? MINUTES
    : [...MINUTES, Number(mm)].sort((a, b) => a - b);

  return (
    <span className="flex items-center gap-1.5">
      <Picker
        label="시"
        value={hh}
        // 시를 처음 고르면 분은 정각에서 시작한다. 비우면 시간 자체가 없어진다.
        onChange={(next) => onChange(next ? `${next}:${mm}` : "")}
        options={[
          { value: "", label: "시간 없음" },
          ...HOURS.map((h) => ({ value: pad(h), label: `${pad(h)}시` })),
        ]}
      />

      <Picker
        label="분"
        value={mm}
        // 시가 없으면 분만 있어봐야 쓸 데가 없다.
        disabled={!hh}
        onChange={(next) => onChange(`${hh}:${next}`)}
        options={minutes.map((m) => ({ value: pad(m), label: `${pad(m)}분` }))}
      />
    </span>
  );
}
