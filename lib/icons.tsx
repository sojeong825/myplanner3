/**
 * 할 일 아이콘.
 *
 * 유니코드 문자(★♥▲)는 OS·브라우저마다 모양과 크기가 달라 정렬이 흔들려서
 * 인라인 SVG로 그린다. 모두 같은 24 뷰박스에 면 채움(솔리드)으로 맞췄다.
 */

export const TASK_ICONS = {
  circle: "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
  star: "M12 3.4l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.7l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z",
  heart: "M12 20.6S3.2 14.7 3.2 9.1A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.8 2.2c0 5.6-8.8 11.5-8.8 11.5z",
  triangle: "M12 4.2l8.4 15.1H3.6z",
  square: "M8 5.4h8a2.6 2.6 0 0 1 2.6 2.6v8a2.6 2.6 0 0 1-2.6 2.6H8A2.6 2.6 0 0 1 5.4 16V8A2.6 2.6 0 0 1 8 5.4z",
} as const;

export type TaskIconName = keyof typeof TASK_ICONS;

export const ICON_ORDER: TaskIconName[] = [
  "circle",
  "star",
  "heart",
  "triangle",
  "square",
];

export const ICON_LABELS: Record<TaskIconName, string> = {
  circle: "원",
  star: "별",
  heart: "하트",
  triangle: "삼각형",
  square: "사각형",
};

export const DEFAULT_ICON: TaskIconName = "circle";

/** 색상 프리셋. null은 '테마 기본' — 저장 시점의 --accent 값으로 굳는다. */
export const ICON_COLORS: { label: string; value: string }[] = [
  { label: "핑크", value: "#E5AAB0" },
  { label: "라벤더", value: "#ADA0D9" },
  { label: "민트", value: "#7CC4AB" },
  { label: "옐로우", value: "#E8C46B" },
  { label: "블루", value: "#8FB8DE" },
  { label: "그레이", value: "#A3A3AD" },
];

function toRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * '같은 색'으로 볼 RGB 거리. 값이 정확히 같지 않아도 눈으로 구분되지 않는 쌍이 있어서,
 * 정확히 일치하는 것만 걸러내면 cream·gray 테마에서 똑같아 보이는 동그라미가 남는다.
 *
 * 테마 accent ↔ 프리셋 거리를 전부 재보면 이렇게 갈린다.
 *
 *   pink·lavender·mint ↔ 같은 이름 프리셋      →  0    (값이 정확히 같음)
 *   gray   #9797A4     ↔ 그레이 #A3A3AD        → 19.2
 *   cream  #DDB673     ↔ 옐로우 #E8C46B        → 19.5
 *   ────────────── 여기까지가 중복 ──────────────
 *   lavender #ADA0D9   ↔ 블루 #8FB8DE          → 38.7  (보라 vs 하늘색 — 남겨야 한다)
 *   lavender #ADA0D9   ↔ 그레이 #A3A3AD        → 45.2
 *
 * 그래서 30이면 위 셋만 빠지고 구분되는 색은 전부 남는다.
 * 프리셋이나 테마 색을 새로 넣을 때는 이 표를 다시 확인할 것.
 */
const SAME_COLOR_DISTANCE = 30;

/**
 * 팔레트에서 지금 테마의 --accent와 같아 보이는 색은 뺀다.
 * 맨 앞 '테마 기본' 동그라미가 이미 그 색이라, 두면 같은 색이 두 번 나온다.
 */
export function paletteFor(accent: string) {
  const target = toRgb(accent);
  if (!target) return ICON_COLORS;

  return ICON_COLORS.filter((c) => {
    const rgb = toRgb(c.value);
    if (!rgb) return true;
    const d = Math.hypot(rgb[0] - target[0], rgb[1] - target[1], rgb[2] - target[2]);
    return d >= SAME_COLOR_DISTANCE;
  });
}

export function toIconName(value: string | null | undefined): TaskIconName {
  return value && value in TASK_ICONS ? (value as TaskIconName) : DEFAULT_ICON;
}

/** 지금 적용된 테마의 --accent 실제 값. 색을 고르지 않았을 때 저장용. */
export function currentAccent(): string {
  if (typeof window === "undefined") return ICON_COLORS[0].value;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : ICON_COLORS[0].value;
}

type Props = {
  icon: string | null;
  color: string | null;
  /** 완료된 항목은 색을 버리고 주변 텍스트 색(흐린 톤)을 따라간다. */
  done?: boolean;
  className?: string;
};

export function TaskIcon({ icon, color, done = false, className = "size-3.5" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      // 완료 항목은 부모 텍스트 색을 상속하지 않고 직접 흐린 톤을 지정한다.
      className={`${className} shrink-0${done ? " text-ink-faint" : ""}`}
      // 색이 없으면 테마 포인트 색을 따라가서, 테마를 바꾸면 함께 바뀐다.
      fill={done ? "currentColor" : (color ?? "var(--accent)")}
    >
      <path d={TASK_ICONS[toIconName(icon)]} />
    </svg>
  );
}
