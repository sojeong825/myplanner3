import { describe, expect, it } from "vitest";
import { coerceTask, coerceTasks, coerceTime } from "@/lib/types";

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

describe("coerceTime", () => {
  it("'HH:MM'을 그대로 받는다", () => {
    expect(coerceTime("09:30")).toBe("09:30");
    expect(coerceTime("23:59")).toBe("23:59");
    expect(coerceTime("00:00")).toBe("00:00");
  });

  it("Postgres가 주는 'HH:MM:SS'는 분까지만 남긴다", () => {
    // time 컬럼은 초까지 붙여 돌려준다. 화면은 분 단위만 쓰므로 여기서 잘라둔다.
    expect(coerceTime("14:05:00")).toBe("14:05");
  });

  it("시각이 아닌 값은 시간 없음", () => {
    expect(coerceTime("24:00")).toBeNull();
    expect(coerceTime("9:30")).toBeNull();
    expect(coerceTime("12:60")).toBeNull();
    expect(coerceTime("")).toBeNull();
    expect(coerceTime(null)).toBeNull();
    expect(coerceTime(930)).toBeNull();
  });
});

describe("coerceTask - 시간", () => {
  it("날짜가 없으면 시간도 버린다", () => {
    // 날짜 없는 시간은 언제인지 알 수 없다. DB에도 같은 제약이 걸려 있다.
    const t = coerceTask({ ...legacy, due_date: null, due_time: "09:00" })!;
    expect(t.due_time).toBeNull();
  });

  it("날짜가 있으면 시간을 남긴다", () => {
    expect(coerceTask({ ...legacy, due_time: "09:00:00" })!.due_time).toBe("09:00");
  });

  it("예전 데이터는 시간 없음으로 읽힌다", () => {
    expect(coerceTask(legacy)!.due_time).toBeNull();
  });
});
