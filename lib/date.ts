/**
 * 날짜는 전부 'YYYY-MM-DD' 문자열(dateKey)로 다룬다.
 * Supabase의 date 컬럼이 이 형태로 오고, Date 객체로 왕복시키면
 * UTC 파싱 때문에 하루가 밀릴 수 있어서 키 단위로만 계산한다.
 */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): DateKey {
  return toKey(new Date());
}

export function keyParts(key: DateKey) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

const parts = keyParts;

/** a - b 를 일 수로. 서머타임 영향을 받지 않도록 UTC 기준으로 뺀다. */
export function diffDays(a: DateKey, b: DateKey): number {
  const A = parts(a);
  const B = parts(b);
  return Math.round(
    (Date.UTC(A.y, A.m - 1, A.d) - Date.UTC(B.y, B.m - 1, B.d)) / 86_400_000,
  );
}

export type Dday = {
  /** 남은 일수. 0이면 당일, 음수면 마감이 지난 것. */
  days: number;
  label: string;
  overdue: boolean;
  today: boolean;
};

/** D-day는 저장 값이 아니라 '마감일 − 오늘'로 매번 계산하는 파생 값이다. */
export function getDday(dueDate: DateKey, from: DateKey = todayKey()): Dday {
  const days = diffDays(dueDate, from);
  return {
    days,
    label: days === 0 ? "D-Day" : days > 0 ? `D-${days}` : `D+${-days}`,
    overdue: days < 0,
    today: days === 0,
  };
}

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type MonthCell = {
  key: DateKey;
  day: number;
  /** 이번 달 날짜인지(앞뒤로 채워진 이웃 달 날짜와 구분) */
  inMonth: boolean;
  weekday: number;
};

/**
 * 일요일 시작 6주(42칸) 고정 그리드.
 * 달마다 줄 수가 바뀌면 레이아웃이 출렁여서 항상 6줄로 만든다.
 */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const startOffset = new Date(year, month - 1, 1).getDay();
  const cells: MonthCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const d = new Date(year, month - 1, 1 - startOffset + i);
    cells.push({
      key: toKey(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
      weekday: d.getDay(),
    });
  }

  return cells;
}

/** 주간 뷰: 일요일 시작 7칸. 월간 그리드와 같은 셀 모양을 쓴다. */
export function buildWeek(anchor: DateKey): MonthCell[] {
  const start = startOfWeek(anchor);
  const { y, m, d } = parts(start);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(y, m - 1, d + i);
    return {
      key: toKey(date),
      day: date.getDate(),
      inMonth: true,
      weekday: date.getDay(),
    };
  });
}

export function startOfWeek(key: DateKey): DateKey {
  const { y, m, d } = parts(key);
  const date = new Date(y, m - 1, d);
  return toKey(new Date(y, m - 1, d - date.getDay()));
}

export function addDays(key: DateKey, delta: number): DateKey {
  const { y, m, d } = parts(key);
  return toKey(new Date(y, m - 1, d + delta));
}

/** 달 이동은 말일 넘침을 피하려고 항상 해당 달 1일로 맞춘다. */
export function addMonthsKey(key: DateKey, delta: number): DateKey {
  const { y, m } = parts(key);
  return toKey(new Date(y, m - 1 + delta, 1));
}

export function formatMonthTitle(year: number, month: number) {
  return `${year}년 ${month}월`;
}

export function formatWeekTitle(anchor: DateKey) {
  const start = parts(startOfWeek(anchor));
  const end = parts(addDays(startOfWeek(anchor), 6));

  return start.m === end.m
    ? `${start.y}년 ${start.m}월 ${start.d}일 – ${end.d}일`
    : `${start.y}년 ${start.m}월 ${start.d}일 – ${end.m}월 ${end.d}일`;
}

