import type { DateKey } from "@/lib/date";

/**
 * 하루에 하나씩 쓰는 회고.
 *
 * 들어가는 길은 일정 보기 모달이다. 일정을 열면 '일정 / 회고' 두 칸이 있고,
 * 회고 쪽은 **그 일정의 마감일 하루치만** 다룬다. 회고를 모아 보는 화면은 따로 두지
 * 않는다 — 회고는 그날 일정을 보다가 적는 것이지, 목록을 훑으러 오는 것이 아니다.
 *
 * 날짜가 곧 열쇠다(사용자당 하루 한 건). id를 쓰지 않는 이유는 화면이 늘 날짜로
 * 찾기 때문이다 — '9월 16일 회고'는 있거나 없거나 둘 중 하나다.
 */
export type Reflection = {
  date: DateKey;
  content: string;
};

export const REFLECTION_MAX = 2000;

export function coerceReflection(raw: unknown): Reflection | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;

  if (typeof v.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return null;

  const content = typeof v.content === "string" ? v.content.slice(0, REFLECTION_MAX) : "";
  // 빈 회고는 '없는 것'과 같다. 저장할 때도 지우므로 읽을 때도 남기지 않는다.
  if (!content.trim()) return null;

  return { date: v.date, content };
}

export function coerceReflections(raw: unknown): Reflection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(coerceReflection)
    .filter((r): r is Reflection => r !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function findReflection(list: Reflection[], date: DateKey | null): string {
  if (date === null) return "";
  return list.find((r) => r.date === date)?.content ?? "";
}
