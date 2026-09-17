"use client";

/**
 * 마감 시간 고르기. 'HH:MM' 문자열 하나를 시·분 두 칸으로 나눠 다룬다.
 *
 * 분은 10분 단위 여섯 개만 준다. 네이티브 <input type="time">은 1분 단위라
 * 고를 것이 예순 개였는데, 실제로 쓰는 값은 정각 아니면 30분 언저리다.
 *
 * 단위를 좁히기 전에 저장해둔 값(예: 15:37)은 그대로 살려둔다 — 이제 고를 수 없는
 * 값이라고 해서 이미 정해둔 시간을 말없이 옮길 이유는 없다. 그 값만 목록에 끼워 넣는다.
 */

const STEP = 10;
const MINUTES = Array.from({ length: 60 / STEP }, (_, i) => i * STEP);

const pad = (n: number) => String(n).padStart(2, "0");

/** 0 → '오전 12시', 15 → '오후 3시'. 화면 다른 곳(formatTime)과 같은 말투로 맞춘다. */
const hourLabel = (h: number) => `${h < 12 ? "오전" : "오후"} ${((h + 11) % 12) + 1}시`;

type Props = {
  /** 'HH:MM', 또는 빈 문자열이면 시간 없음. */
  value: string;
  onChange: (value: string) => void;
};

export default function TimePicker({ value, onChange }: Props) {
  const [hh, mm] = value ? value.split(":") : ["", ""];

  const minutes =
    mm && !MINUTES.includes(Number(mm)) ? [...MINUTES, Number(mm)].sort((a, b) => a - b) : MINUTES;

  const box =
    "cursor-pointer rounded-lg border border-line bg-canvas px-2 py-1.5 text-[13px] text-ink outline-none transition focus:border-accent";

  return (
    <span className="flex items-center gap-1.5">
      <select
        aria-label="시"
        value={hh}
        // 시를 처음 고르면 분은 정각에서 시작한다. 시를 비우면 시간 자체가 없어진다.
        onChange={(e) => onChange(e.target.value ? `${e.target.value}:${mm || "00"}` : "")}
        className={box}
      >
        <option value="">시간 없음</option>
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={pad(h)}>
            {hourLabel(h)}
          </option>
        ))}
      </select>

      <select
        aria-label="분"
        // 시가 없으면 분만 있어봐야 쓸 데가 없다.
        value={mm || "00"}
        disabled={!hh}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
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
