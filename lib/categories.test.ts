import { describe, expect, it } from "vitest";
import {
  categoryName,
  coerceCategories,
  matchesFilter,
  validateName,
  type Category,
} from "@/lib/categories";

const list: Category[] = [
  { id: 1, name: "일", sort_order: 0 },
  { id: 2, name: "운동", sort_order: 1 },
];

const task = (category_id: number | null) => ({ category_id });

describe("validateName", () => {
  it("앞뒤 공백을 떼고 받아준다", () => {
    expect(validateName("  공부  ", list)).toEqual({ ok: true, name: "공부" });
  });

  it("빈 이름은 막는다", () => {
    expect(validateName("   ", list).ok).toBe(false);
  });

  it("12자를 넘으면 막는다", () => {
    expect(validateName("가".repeat(13), list).ok).toBe(false);
    expect(validateName("가".repeat(12), list).ok).toBe(true);
  });

  it("같은 이름은 막는다", () => {
    // 둘이면 사이드바에서 어느 쪽을 누른 건지 알 수 없다.
    expect(validateName("운동", list).ok).toBe(false);
    // 공백만 다른 것도 같은 이름으로 본다(trim 후 비교).
    expect(validateName(" 운동 ", list).ok).toBe(false);
  });
});

describe("matchesFilter", () => {
  it("전체 보기는 미분류까지 전부 통과시킨다", () => {
    expect(matchesFilter(null, task(null))).toBe(true);
    expect(matchesFilter(null, task(1))).toBe(true);
  });

  it("분류를 고르면 그것만 통과한다", () => {
    expect(matchesFilter(1, task(1))).toBe(true);
    expect(matchesFilter(1, task(2))).toBe(false);
  });

  it("미분류 일정은 분류를 고르는 순간 숨는다", () => {
    // 분류가 없는 일정은 '전체'에서만 보인다 — 어디에도 억지로 넣지 않는다.
    expect(matchesFilter(1, task(null))).toBe(false);
  });
});

describe("coerceCategories", () => {
  it("sort_order 순으로 정렬한다", () => {
    const rows = coerceCategories([
      { id: 3, name: "나중", sort_order: 5 },
      { id: 1, name: "먼저", sort_order: 0 },
    ]);
    expect(rows.map((c) => c.name)).toEqual(["먼저", "나중"]);
  });

  it("이름이 비었거나 id가 없는 줄은 버린다", () => {
    const rows = coerceCategories([
      { id: 1, name: "정상", sort_order: 0 },
      { id: 2, name: "   ", sort_order: 1 },
      { name: "id 없음", sort_order: 2 },
      null,
    ]);
    expect(rows.map((c) => c.id)).toEqual([1]);
  });

  it("배열이 아니면 빈 배열", () => {
    expect(coerceCategories(null)).toEqual([]);
    expect(coerceCategories({ nope: true })).toEqual([]);
  });
});

describe("categoryName", () => {
  it("id로 이름을 찾는다", () => {
    expect(categoryName(list, 2)).toBe("운동");
  });

  it("미분류거나 이미 지워진 분류면 null", () => {
    expect(categoryName(list, null)).toBeNull();
    expect(categoryName(list, 999)).toBeNull();
  });
});
