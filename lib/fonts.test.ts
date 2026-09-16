import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_FONT, FONTS, isFontId } from "@/lib/fonts";

const css = readFileSync("app/globals.css", "utf8");
const sql = readFileSync("supabase/RUN-THIS-IN-SUPABASE.sql", "utf8");

describe("FONTS", () => {
  /*
   * 글꼴 하나를 더하려면 네 군데를 고쳐야 한다 — 이 배열, @font-face, data-font 규칙,
   * DB 제약. 한 군데만 빠뜨려도 조용히 어긋난다. 고른 글꼴이 안 바뀌거나
   * (CSS 누락) 저장이 실패한다(DB 누락).
   */
  it("모든 글꼴에 @font-face가 있다", () => {
    for (const font of FONTS) {
      expect(css, `${font.id}의 @font-face`).toContain(`font-family: "${font.family}";`);
    }
  });

  it("모든 글꼴에 data-font 규칙이 있다", () => {
    for (const font of FONTS) {
      expect(css, `${font.id}의 data-font 규칙`).toContain(
        `:root[data-font="${font.id}"] { --app-font: "${font.family}"; }`,
      );
    }
  });

  it("모든 글꼴이 DB 제약 목록에 들어 있다", () => {
    const allowed = /add constraint settings_font_check\s*check \(font in \(([^)]*)\)\)/.exec(sql);
    expect(allowed, "settings_font_check를 SQL에서 찾지 못함").not.toBeNull();
    for (const font of FONTS) {
      expect(allowed![1], `${font.id}가 제약 목록에 없음`).toContain(`'${font.id}'`);
    }
  });

  it("@font-face 주소가 전부 https다", () => {
    // 하나라도 http면 브라우저가 막아서 그 글꼴만 조용히 안 나온다.
    const urls = css.match(/src: url\("([^"]+)"\)/g) ?? [];
    expect(urls.length).toBeGreaterThanOrEqual(FONTS.length);
    for (const u of urls) expect(u).toContain('url("https://');
  });

  it("id와 이름이 겹치지 않는다", () => {
    expect(new Set(FONTS.map((f) => f.id)).size).toBe(FONTS.length);
    expect(new Set(FONTS.map((f) => f.label)).size).toBe(FONTS.length);
    expect(new Set(FONTS.map((f) => f.family)).size).toBe(FONTS.length);
  });

  it("기본 글꼴이 목록에 있다", () => {
    expect(isFontId(DEFAULT_FONT)).toBe(true);
  });
});

describe("isFontId", () => {
  it("모르는 값은 거른다", () => {
    // 손으로 고친 localStorage나 옛 설정이 들어와도 기본값으로 떨어져야 한다.
    expect(isFontId("joseon")).toBe(true);
    expect(isFontId("없는글꼴")).toBe(false);
    expect(isFontId(null)).toBe(false);
    expect(isFontId(3)).toBe(false);
  });
});
