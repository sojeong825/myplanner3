/**
 * 일정 분류.
 *
 * v1.5부터 사용자가 직접 만들고 지운다. 그 전까지는 '일 → 업무·회의…' 2단계 고정
 * 목록이었는데, 쓰지도 않는 하위 항목이 화면만 차지했다. 지금은 한 단계뿐이고
 * 이름도 사용자가 정한다 — 코드에 박힌 분류는 하나도 없다.
 */

export const CATEGORY_NAME_MAX = 12;

export type Category = {
  id: number;
  name: string;
  /** 사이드바에 보이는 순서. 만든 순서를 그대로 쓴다. */
  sort_order: number;
};

/** 새로 만들 때 사용자가 채우는 값. 나머지는 저장소가 정한다. */
export type NewCategory = { name: string; sort_order: number };

/**
 * 목록·달력·다가오는 일정에 함께 거는 필터.
 * null이면 전체 보기 — 분류를 정하지 않은 일정은 이때만 보인다.
 */
export type CategoryFilter = number | null;

export function coerceCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;

  if (typeof v.id !== "number") return null;
  const name = typeof v.name === "string" ? v.name.trim().slice(0, CATEGORY_NAME_MAX) : "";
  if (!name) return null;

  return {
    id: v.id,
    name,
    sort_order: typeof v.sort_order === "number" ? v.sort_order : 0,
  };
}

export function coerceCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(coerceCategory)
    .filter((c): c is Category => c !== null)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

/**
 * 입력한 이름을 저장 가능한 형태로 다듬는다. 쓸 수 없으면 사유를 돌려준다.
 * 화면과 저장소가 같은 판정을 쓰도록 여기 한 곳에만 둔다.
 */
export function validateName(
  raw: string,
  existing: Category[],
): { ok: true; name: string } | { ok: false; message: string } {
  const name = raw.trim();
  if (!name) return { ok: false, message: "이름을 입력해주세요." };
  if (name.length > CATEGORY_NAME_MAX) {
    return { ok: false, message: `${CATEGORY_NAME_MAX}자까지 쓸 수 있어요.` };
  }
  // 같은 이름이 둘이면 사이드바에서 어느 쪽을 누른 건지 알 수 없다.
  if (existing.some((c) => c.name === name)) {
    return { ok: false, message: "이미 있는 분류예요." };
  }
  return { ok: true, name };
}

/** 필터 한 건이 통과시키는지. 분류가 없는 일정은 '전체'에서만 보인다. */
export function matchesFilter(
  filter: CategoryFilter,
  task: { category_id: number | null },
): boolean {
  if (filter === null) return true;
  return task.category_id === filter;
}

export function categoryName(categories: Category[], id: number | null): string | null {
  if (id === null) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}
