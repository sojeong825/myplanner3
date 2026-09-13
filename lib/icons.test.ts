import { describe, expect, it } from "vitest";
import { DEFAULT_ICON, toIcon } from "@/lib/icons";

describe("toIcon", () => {
  it("v1.3 이전 프리셋 이름을 이모지로 옮긴다", () => {
    // 게스트 localStorage에는 마이그레이션을 걸 곳이 없어서 읽을 때 옮겨야 한다.
    expect(toIcon("circle")).toBe("📌");
    expect(toIcon("star")).toBe("⭐");
    expect(toIcon("dumbbell")).toBe("💪");
    expect(toIcon("cake")).toBe("🎂");
  });

  it("이모지는 그대로 통과시킨다", () => {
    expect(toIcon("💼")).toBe("💼");
    // 규칙 표에 없는 이모지가 들어와도 막지 않는다.
    expect(toIcon("🦊")).toBe("🦊");
  });

  it("비어 있으면 기본 이모지", () => {
    expect(toIcon(null)).toBe(DEFAULT_ICON);
    expect(toIcon(undefined)).toBe(DEFAULT_ICON);
    expect(toIcon("")).toBe(DEFAULT_ICON);
  });
});
