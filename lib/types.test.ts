import { describe, expect, it } from "vitest";
import { coerceTask, coerceTasks } from "@/lib/types";

/** v1.3 이전에 게스트 localStorage에 저장돼 있던 모양 — 새 필드가 아예 없다. */
const legacy = {
  id: 1,
  title: "방청소하기",
  due_date: "2026-09-20",
  is_done: false,
  created_at: "2026-09-01T00:00:00.000Z",
  icon: "circle",
  icon_color: "#E5AAB0",
};

describe("coerceTask", () => {
  it("예전 데이터에 빠진 필드를 기본값으로 채운다", () => {
    const t = coerceTask(legacy)!;
    // is_starred가 undefined로 남으면 별표 정렬이 조용히 어긋난다.
    expect(t.is_starred).toBe(false);
    expect(t.category_id).toBeNull();
    expect(t.memo).toBeNull();
    // 원래 있던 값은 그대로 둔다.
    expect(t.title).toBe("방청소하기");
    expect(t.due_date).toBe("2026-09-20");
  });

  it("분류 id는 숫자일 때만 받는다", () => {
    expect(coerceTask({ ...legacy, category_id: 7 })!.category_id).toBe(7);
    // v1.4까지 쓰던 문자열 분류('work' 등)가 남아 있어도 삼키지 않는다.
    expect(coerceTask({ ...legacy, category_id: "work" })!.category_id).toBeNull();
  });

  it("빈 메모는 null로 통일한다", () => {
    // 빈 문자열이 섞이면 '메모 없음' 판정이 두 갈래가 된다.
    expect(coerceTask({ ...legacy, memo: "" })!.memo).toBeNull();
    expect(coerceTask({ ...legacy, memo: "세제 사오기" })!.memo).toBe("세제 사오기");
  });

  it("id나 title이 없는 값은 버린다", () => {
    expect(coerceTask({ title: "제목만" })).toBeNull();
    expect(coerceTask(null)).toBeNull();
    expect(coerceTask("문자열")).toBeNull();
  });
});

describe("coerceTasks", () => {
  it("망가진 항목만 빼고 나머지는 살린다", () => {
    const list = coerceTasks([legacy, null, { id: 2 }, { ...legacy, id: 3 }]);
    expect(list.map((t) => t.id)).toEqual([1, 3]);
  });

  it("배열이 아니면 빈 배열", () => {
    expect(coerceTasks(null)).toEqual([]);
    expect(coerceTasks({ nope: true })).toEqual([]);
  });
});
