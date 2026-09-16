import { describe, expect, it } from "vitest";
import { coerceReflections, findReflection } from "@/lib/reflections";

describe("coerceReflections", () => {
  it("최근 날짜가 위로 온다", () => {
    const rows = coerceReflections([
      { date: "2026-09-10", content: "먼저" },
      { date: "2026-09-16", content: "나중" },
    ]);
    expect(rows.map((r) => r.date)).toEqual(["2026-09-16", "2026-09-10"]);
  });

  it("빈 회고는 없는 것으로 친다", () => {
    // 저장할 때도 지우므로 읽을 때도 남기지 않는다.
    expect(coerceReflections([{ date: "2026-09-16", content: "   " }])).toEqual([]);
    expect(coerceReflections([{ date: "2026-09-16", content: "" }])).toEqual([]);
  });

  it("날짜 꼴이 아니면 버린다", () => {
    expect(coerceReflections([{ date: "2026-9-16", content: "x" }])).toEqual([]);
    expect(coerceReflections([{ content: "날짜 없음" }])).toEqual([]);
  });

  it("배열이 아니면 빈 배열", () => {
    expect(coerceReflections(null)).toEqual([]);
  });
});

describe("findReflection", () => {
  const list = coerceReflections([{ date: "2026-09-16", content: "오늘 회고" }]);

  it("날짜로 찾는다", () => {
    expect(findReflection(list, "2026-09-16")).toBe("오늘 회고");
  });

  it("없는 날짜는 빈 문자열 — 입력칸에 그대로 넣을 수 있어야 한다", () => {
    expect(findReflection(list, "2026-09-15")).toBe("");
  });
});
