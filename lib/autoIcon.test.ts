import { describe, expect, it } from "vitest";
import { autoIcon, iconFromTitle } from "@/lib/autoIcon";

describe("iconFromTitle", () => {
  it("제목에 들어 있는 말로 이모지를 고른다", () => {
    expect(iconFromTitle("팀 주간회의")).toBe("💬");
    expect(iconFromTitle("헬스장 가기")).toBe("💪");
    expect(iconFromTitle("엄마 생일")).toBe("🎂");
    expect(iconFromTitle("치과 가기")).toBe("🏥");
    expect(iconFromTitle("장보기")).toBe("🛒");
  });

  it("걸리는 말이 없으면 null을 준다", () => {
    expect(iconFromTitle("그냥 메모")).toBeNull();
    expect(iconFromTitle("")).toBeNull();
    expect(iconFromTitle("   ")).toBeNull();
  });

  it("영문 키워드는 대소문자를 가리지 않는다", () => {
    expect(iconFromTitle("Weekly MEETING")).toBe("💬");
    expect(iconFromTitle("GYM")).toBe("💪");
  });

  /*
   * 규칙 순서가 곧 우선순위라서, 아래 세 개는 RULES 배열의 순서를 바꾸면 깨진다.
   * 깨졌다면 순서를 되돌리거나, 새 순서가 의도한 것인지 다시 따져봐야 한다.
   */
  it("키워드가 둘 이상 걸리면 위쪽 규칙이 이긴다", () => {
    // '점심'(🍔)보다 '회의'(💬)가 위에 있다 — 점심 회의는 밥이 아니라 회의다.
    expect(iconFromTitle("점심 회의")).toBe("💬");
    // '치과'(🏥)가 '예약'(🤝)보다 위에 있다.
    expect(iconFromTitle("치과 예약")).toBe("🏥");
    // '생일'(🎂)이 '선물'(🎁)보다 위에 있다.
    expect(iconFromTitle("생일 선물 사기")).toBe("🎂");
  });

  it("가장 넓은 말인 약속·예약은 맨 마지막에 걸린다", () => {
    expect(iconFromTitle("친구랑 약속")).toBe("🤝");
  });
});

describe("autoIcon", () => {
  it("제목이 걸리면 분류 이름보다 제목이 이긴다", () => {
    // 분류는 '운동'이지만 제목이 회의라면 회의로 본다.
    expect(autoIcon("회의 준비", "운동")).toBe("💬");
  });

  it("제목이 안 걸리면 분류 이름을 같은 표에 넣어본다", () => {
    // 분류는 사용자가 지은 이름이라 미리 짝지어둘 수 없다. 대신 이름 자체를
    // 키워드로 훑어서, '운동'·'공부'처럼 흔한 말이면 그대로 맞는다.
    expect(autoIcon("유지씨 보기", "운동")).toBe("💪");
    expect(autoIcon("3장까지", "공부")).toBe("📚");
  });

  it("분류 이름도 안 걸리면 📌으로 떨어진다", () => {
    expect(autoIcon("무언가", "아무이름")).toBe("📌");
    expect(autoIcon("무언가", null)).toBe("📌");
    expect(autoIcon("", null)).toBe("📌");
  });
});
