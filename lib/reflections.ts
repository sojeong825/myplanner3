import type { DateKey } from "@/lib/date";

/**
 * 하루에 하나씩 쓰는 회고.
 *
 * 할 일과 따로 둔 이유는 성격이 다르기 때문이다. 할 일은 '앞으로 할 것'이고
 * 회고는 '지나고 나서 적는 것'이다. 일정마다 붙이는 메모로도 만들 수 있었지만,
 * 그러면 하루를 통으로 돌아보는 자리가 없어지고 메모와 역할이 겹친다.
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
    // 최근 날짜가 위로. 목록은 늘 '요즘 것'부터 본다.
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function findReflection(list: Reflection[], date: DateKey): string {
  return list.find((r) => r.date === date)?.content ?? "";
}
