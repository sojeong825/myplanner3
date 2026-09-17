"use client";

import { useState } from "react";

/**
 * 마감 시간 고르기. 'HH:MM' 문자열 하나를 오전·오후 / 시 / 분 세 칸으로 나눠 다룬다.
 *
 * 24시간(13시, 21시…)이 아니라 읽는 대로 고르게 둔다. 화면 다른 곳에서도 '오후 3:00'
 * 으로 보여주고 있어서(formatTime), 고를 때만 24시간이면 머릿속에서 한 번 옮겨야 한다.
 *
 * 분은 10분 단위 여섯 개만 준다. 네이티브 <input type="time">은 1분 단위라 고를 것이
 * 예순 개였는데, 실제로 쓰는 값은 정각 아니면 30분 언저리다.
 *
 * 단위를 좁히기 전에 저장해둔 값(예: 15:37)은 그대로 살려둔다 — 이제 고를 수 없는
 * 값이라고 해서 이미 정해둔 시간을 말없이 옮길 이유는 없다. 그 값만 목록에 끼워 넣는다.
 */

const STEP = 10;
const MINUTES = Array.from({ length: 60 / STEP }, (_, i) => i * STEP);

/** 1시부터 12시까지. 0시가 아니라 12시로 읽는 자리다. */
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  /** 'HH:MM'(24시간), 또는 빈 문자열이면 시간 없음. */
  value: string;
  onChange: (value: string) => void;
};

export default function TimePicker({ value, onChange }: Props) {
  const h24 = value ? Number(value.slice(0, 2)) : null;
  const mm = value ? value.slice(3, 5) : "00";

  /**
   * 시간이 아직 없을 때도 오전/오후는 골라둘 수 있어야 해서 따로 기억한다.
   * 시간이 정해져 있으면 그 값이 답이므로 이건 쓰이지 않는다.
   */
  const [ampmDraft, setAmpmDraft] = useState<"am" | "pm">("am");
  const pm = h24 === null ? ampmDraft === "pm" : h24 >= 12;
  const h12 = h24 === null ? "" : String(((h24 + 11) % 12) + 1);

  const minutes =
    !MINUTES.includes(Number(mm)) ? [...MINUTES, Number(mm)].sort((a, b) => a - b) : MINUTES;

  /** 오전 12시는 0시, 오후 12시는 12시. 그 밖에는 오후에만 12를 더한다. */
  const emit = (isPm: boolean, hour12: string, minute: string) => {
    if (!hour12) {
      onChange("");
      return;
    }
    const base = Number(hour12) % 12;
    onChange(`${pad(isPm ? base + 12 : base)}:${minute}`);
  };

  const box =
    "cursor-pointer rounded-lg border border-line bg-canvas px-2 py-1.5 text-[13px] text-ink outline-none transition focus:border-accent";

  return (
    <span className="flex items-center gap-1.5">
      <select
        aria-label="오전 오후"
        value={pm ? "pm" : "am"}
        onChange={(e) => {
          const isPm = e.target.value === "pm";
          setAmpmDraft(isPm ? "pm" : "am");
          // 시를 아직 안 골랐으면 기억만 해둔다. 시간 없음인 채로 오후만 정해질 수는 없다.
          if (h12) emit(isPm, h12, mm);
        }}
        className={box}
      >
        <option value="am">오전</option>
        <option value="pm">오후</option>
      </select>

      <select
        aria-label="시"
        value={h12}
        onChange={(e) => emit(pm, e.target.value, mm)}
        className={box}
      >
        <option value="">시간 없음</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>

      <select
        aria-label="분"
        // 시가 없으면 분만 있어봐야 쓸 데가 없다.
        value={mm}
        disabled={!h12}
        onChange={(e) => emit(pm, h12, e.target.value)}
        className={`${box} disabled:cursor-default disabled:opacity-40`}
      >
        {minutes.map((m) => (
          <option key={m} value={pad(m)}>
            {pad(m)}분
          </option>
        ))}
      </select>
    </span>
  );
}
