"use client";

import { useEffect, useState } from "react";
import {
  addDays,
  addMonthsKey,
  buildMonthGrid,
  formatMonthTitle,
  keyParts,
  WEEKDAYS,
  type DateKey,
} from "@/lib/date";

type Props = {
  /**
   * 고른 날짜들. multiple이 false면 0~1개만 담긴다.
   * 비어 있으면 '마감 없음'이다 — 날짜는 선택 항목이지 필수가 아니다.
   */
  value: DateKey[];
  today: DateKey;
  /** 추가할 때만 여러 날짜를 고를 수 있다. 수정은 이미 있는 한 건을 고치는 것이라 한 개다. */
  multiple: boolean;
  onChange: (next: DateKey[]) => void;
};

/**
 * 달력을 눌러 마감일을 고른다.
 *
 * 네이티브 <input type="date">를 쓰지 않는다. 네이티브 선택기는 달을 넘기는 것만으로도
 * change가 올라와서, 고르지도 않은 날짜가 값으로 들어가는 문제가 있었다. 여기서는
 * **날짜 칸을 직접 누른 것만 값이 된다** — 달을 아무리 넘겨도 아무 일도 일어나지 않는다.
 *
 * 여러 날짜는 누른 만큼 쌓인다. 이미 고른 날짜를 다시 누르면 빠진다. 그래서 '더 추가'
 * 같은 버튼이 따로 필요 없다.
 */
export default function DatePicker({ value, today, multiple, onChange }: Props) {
  /** 보고 있는 달. 고른 날짜가 있으면 그 달에서, 없으면 이번 달에서 시작한다. */
  const [anchor, setAnchor] = useState<DateKey>(value[0] ?? today);

  // 바깥에서 값이 통째로 바뀌면(모달이 다른 할 일로 다시 열리는 등) 그 달로 따라간다.
  useEffect(() => {
    setAnchor(value[0] ?? today);
    // value 전체가 아니라 첫 날짜만 본다 — 날짜를 하나 더 고를 때마다 달이 튀면 곤란하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value[0], today]);

  const { y, m } = keyParts(anchor);
  const cells = buildMonthGrid(y, m);
  const selected = new Set(value);

  const toggle = (key: DateKey) => {
    if (selected.has(key)) {
      onChange(value.filter((d) => d !== key));
    } else if (multiple) {
      onChange([...value, key].sort());
    } else {
      onChange([key]);
    }
  };

  const quick: { label: string; key: DateKey }[] = [
    { label: "오늘", key: today },
    { label: "내일", key: addDays(today, 1) },
    { label: "모레", key: addDays(today, 2) },
  ];

  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <div className="flex gap-1.5">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => toggle(q.key)}
            aria-pressed={selected.has(q.key)}
            className={`flex-1 rounded-lg py-1.5 text-[12px] transition ${
              selected.has(q.key)
                ? "bg-accent text-white"
                : "bg-canvas text-ink-soft hover:text-ink"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center">
        <button
          type="button"
          onClick={() => setAnchor(addMonthsKey(anchor, -1))}
          aria-label="이전 달"
          className="grid size-7 place-items-center rounded-full text-ink-soft transition hover:bg-soft hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="flex-1 text-center text-[13px] font-medium">
          {formatMonthTitle(y, m)}
        </span>

        <button
          type="button"
          onClick={() => setAnchor(addMonthsKey(anchor, 1))}
          aria-label="다음 달"
          className="grid size-7 place-items-center rounded-full text-ink-soft transition hover:bg-soft hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 요일 순서는 본문 달력(MonthGrid)과 똑같이 일요일부터다. 한 앱에서 주 시작이
          두 가지면 날짜를 셀 때마다 헷갈린다. */}
      <div className="mt-1 grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-center text-[11px] ${
              i === 0 ? "text-accent-deep" : "text-ink-faint"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const isSelected = selected.has(cell.key);
          const isToday = cell.key === today;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => toggle(cell.key)}
              aria-pressed={isSelected}
              aria-label={cell.key}
              className={`grid h-8 place-items-center rounded-lg text-[13px] transition ${
                isSelected
                  ? "bg-accent font-medium text-white"
                  : isToday
                    // 오늘은 테두리로만 표시한다. 채우면 고른 날짜와 구분되지 않는다.
                    ? "text-accent-deep ring-1 ring-accent hover:bg-soft"
                    : cell.inMonth
                      ? "text-ink hover:bg-soft"
                      : "text-ink-faint hover:bg-soft"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-line pt-2">
        <p className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">
          {value.length === 0
            ? "마감일 없음"
            : value.length === 1
              ? formatPicked(value[0])
              : `${value.length}개 날짜 · 각각 만들어져요`}
        </p>

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="shrink-0 text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
          >
            비우기
          </button>
        )}
      </div>
    </div>
  );
}

/** '2026-09-20' → '9월 20일' */
function formatPicked(key: DateKey) {
  const { m, d } = keyParts(key);
  return `${m}월 ${d}일`;
}
