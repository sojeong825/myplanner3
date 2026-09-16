import { describe, expect, it } from "vitest";
import { ALL_EMOJIS, EMOJI_GROUPS, searchEmojis } from "@/lib/emojiData";

describe("searchEmojis", () => {
  it("한국어로 찾는다", () => {
    // 영어 키워드만 있는 이모지 라이브러리를 쓰지 않은 이유가 이것이다.
    expect(searchEmojis("생일")!.map((i) => i.e)).toContain("🎂");
    expect(searchEmojis("운동")!.map((i) => i.e)).toContain("💪");
    expect(searchEmojis("회의")!.map((i) => i.e)).toContain("💬");
  });

  it("분류를 가로질러 찾는다", () => {
    // '커피'는 '자주 쓰는'에 있고 '음료'는 '음식'에 있다. 탭과 무관하게 나와야 한다.
    expect(searchEmojis("음료")!.length).toBeGreaterThan(0);
  });

  it("이모지를 붙여넣어도 찾는다", () => {
    expect(searchEmojis("🎂")!.map((i) => i.e)).toContain("🎂");
  });

  it("빈 검색어는 null — '전부'와 '없음'을 구분해야 한다", () => {
    expect(searchEmojis("")).toBeNull();
    expect(searchEmojis("   ")).toBeNull();
  });

  it("없는 말은 빈 배열", () => {
    expect(searchEmojis("존재하지않는말")).toEqual([]);
  });
});

describe("EMOJI_GROUPS", () => {
  it("같은 이모지가 두 번 나오지 않는다", () => {
    // 중복이 있으면 격자에 같은 칸이 두 개 보이고 React key도 겹친다.
    const seen = new Set(ALL_EMOJIS.map((i) => i.e));
    expect(seen.size).toBe(ALL_EMOJIS.length);
  });

  it("검색어가 빈 항목이 없다", () => {
    for (const it of ALL_EMOJIS) expect(it.k.trim().length).toBeGreaterThan(0);
  });

  it("DB 제약(8자)에 걸리지 않는 길이다", () => {
    // 0006 마이그레이션의 tasks_icon_len_check와 같은 기준이다.
    for (const it of ALL_EMOJIS) expect([...it.e].length).toBeLessThanOrEqual(8);
  });

  it("그룹 id가 겹치지 않는다", () => {
    const ids = new Set(EMOJI_GROUPS.map((g) => g.id));
    expect(ids.size).toBe(EMOJI_GROUPS.length);
  });
});
