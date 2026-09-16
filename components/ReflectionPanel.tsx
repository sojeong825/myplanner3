"use client";

import { useEffect, useState } from "react";
import { addDays, keyParts, type DateKey } from "@/lib/date";
import { findReflection, REFLECTION_MAX, type Reflection } from "@/lib/reflections";

type Props = {
  reflections: Reflection[];
  today: DateKey;
  onSave: (date: DateKey, content: string) => Promise<void>;
};

/** '2026-09-16' → '9월 16일' */
function shortDate(key: DateKey) {
  const { m, d } = keyParts(key);
  return `${m}월 ${d}일`;
}

/** 오늘·어제만 이름으로 부른다. 그 위로는 날짜가 더 분명하다. */
function dateLabel(key: DateKey, today: DateKey) {
  if (key === today) return `${shortDate(key)} (오늘)`;
  if (key === addDays(today, -1)) return `${shortDate(key)} (어제)`;
  return shortDate(key);
}

/**
 * 날짜별 회고.
 *
 * 기본은 오늘이고, 아래 목록에서 지난 날짜를 누르면 그 날로 옮겨간다.
 * 저장은 자동이 아니라 버튼이다 — 타이핑하는 동안 계속 서버로 보내면 느리고,
 * 어디까지 저장됐는지도 알 수 없다.
 */
export default function ReflectionPanel({ reflections, today, onSave }: Props) {
  /** 지금 쓰고 있는 날짜. 오늘에서 시작한다. */
  const [date, setDate] = useState<DateKey>(today);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const saved = findReflection(reflections, date);

  // 날짜를 옮기거나 바깥에서 내용이 바뀌면 입력칸을 저장된 값으로 맞춘다.
  useEffect(() => {
    setDraft(saved);
  }, [saved, date]);

  const dirty = draft !== saved;

  const commit = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await onSave(date, draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[12px] font-medium text-ink">{dateLabel(date, today)}</span>
        {date !== today && (
          <button
            type="button"
            onClick={() => setDate(today)}
            className="text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
          >
            오늘로
          </button>
        )}
        <span className="ml-auto text-[11px] text-ink-faint">
          {saving ? "저장 중…" : dirty ? "저장 안 됨" : saved ? "저장됨" : ""}
        </span>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="오늘 어땠나요? 잘한 것, 아쉬운 것, 내일 할 것…"
        maxLength={REFLECTION_MAX}
        // resize-none: 사용자가 늘리면 카드 밖으로 삐져나온다. 넘치면 안에서 스크롤된다.
        className="mt-2 h-[112px] w-full shrink-0 resize-none rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent"
      />

      <button
        type="button"
        onClick={() => void commit()}
        disabled={!dirty || saving}
        className="mt-2 shrink-0 rounded-full bg-accent py-2 text-[12px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        {/* 내용을 비우고 저장하면 그 날짜의 회고가 지워진다. 버튼이 그걸 미리 알려준다. */}
        {saved && !draft.trim() ? "회고 지우기" : "저장"}
      </button>

      {reflections.length > 0 && (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <p className="px-1 pb-1.5 text-[11px] text-ink-faint">지난 회고 {reflections.length}</p>
          <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {reflections.map((r) => (
              <li key={r.date} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setDate(r.date)}
                  aria-pressed={r.date === date}
                  className={`w-full rounded-[10px] px-3 py-2 text-left transition hover:bg-canvas ${
                    r.date === date ? "bg-soft" : ""
                  }`}
                >
                  <span className="block text-[11px] text-ink-soft">
                    {dateLabel(r.date, today)}
                  </span>
                  {/* 목록은 훑어보는 용도라 한 줄만. 누르면 위 칸에 전부 펼쳐진다. */}
                  <span className="block truncate text-[12px] text-ink">{r.content}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
