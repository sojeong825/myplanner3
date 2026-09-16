import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEMES } from "@/lib/settings";

const css = readFileSync("app/globals.css", "utf8");

/**
 * globals.css에서 그 테마 블록의 --accent 값을 꺼낸다.
 *
 * pink만 선택자가 둘이다 — 기본값이라 `:root`에도 같이 걸려 있다.
 */
function accentOf(id: string): string | null {
  const selector =
    id === "pink"
      ? String.raw`:root,\s*:root\[data-theme="pink"\]`
      : String.raw`:root\[data-theme="${id}"\]`;

  const block = new RegExp(selector + String.raw`\s*\{([^}]*)\}`).exec(css);
  if (!block) return null;
  return /--accent:\s*(#[0-9a-fA-F]{6});/.exec(block[1])?.[1].toLowerCase() ?? null;
}

describe("THEMES", () => {
  /*
   * 테마를 더하거나 색을 바꿀 때 고칠 곳이 두 군데(이 배열과 globals.css)라
   * 한쪽만 고치고 지나가기 쉽다. 그러면 설정 모달의 동그라미 색과 실제 화면 색이
   * 달라지는데, 눈으로는 '어? 좀 다른가?' 정도라 알아채기 어렵다.
   */
  it("swatch가 globals.css의 --accent와 같다", () => {
    for (const theme of THEMES) {
      expect(accentOf(theme.id), `${theme.id} 블록이 globals.css에 없음`).not.toBeNull();
      expect(theme.swatch.toLowerCase(), `${theme.id} swatch 불일치`).toBe(accentOf(theme.id));
    }
  });

  it("id와 이름이 겹치지 않는다", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    expect(new Set(THEMES.map((t) => t.label)).size).toBe(THEMES.length);
  });

  it("모든 테마가 DB 제약 목록에 들어 있다", () => {
    // settings_theme_check에 없는 값을 고르면 저장이 실패한다.
    const sql = readFileSync("supabase/RUN-THIS-IN-SUPABASE.sql", "utf8");
    const allowed = /add constraint settings_theme_check\s*check \(theme in \(([^)]*)\)\)/.exec(sql);
    expect(allowed).not.toBeNull();
    for (const theme of THEMES) {
      expect(allowed![1], `${theme.id}가 제약 목록에 없음`).toContain(`'${theme.id}'`);
    }
  });
});
