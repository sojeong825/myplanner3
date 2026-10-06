import { describe, expect, it } from "vitest";
import { clockSkewMs, clockWarning, explainAuthError, tokenIssuedAt } from "@/lib/clockSkew";

/** iat만 들어 있는 가짜 JWT. 서명은 보지 않으므로 아무 값이나 붙여도 된다. */
function fakeToken(iat: number): string {
  const body = Buffer.from(JSON.stringify({ iat, sub: "u1" })).toString("base64url");
  return `header.${body}.signature`;
}

describe("clockSkew", () => {
  it("토큰에서 발급 시각을 읽는다", () => {
    expect(tokenIssuedAt(fakeToken(1_700_000_000))).toBe(1_700_000_000);
  });

  it("토큰이 아니면 null — 모르는 것은 모른다고 둔다", () => {
    expect(tokenIssuedAt("not-a-token")).toBeNull();
    expect(tokenIssuedAt("")).toBeNull();
    expect(clockSkewMs("쓰레기값")).toBeNull();
  });

  it("기기가 뒤처지면 음수가 나온다", () => {
    const iat = 1_700_000_000;
    // 기기는 발급 시각보다 8일 이르다고 믿는다.
    const now = (iat - 8 * 86_400) * 1000;
    expect(clockSkewMs(fakeToken(iat), now)).toBe(-8 * 86_400_000);
  });

  it("한 시간쯤 앞선 것은 정상이다 — 토큰은 한 시간을 살며 그동안 계속 쓰인다", () => {
    expect(clockWarning(55 * 60_000)).toBeNull();
  });

  it("뒤처짐은 1분만 넘어도 알린다", () => {
    expect(clockWarning(-90_000)).toContain("뒤처져");
  });

  it("어긋난 정도를 일·시간·분으로 적는다", () => {
    expect(clockWarning(-8 * 86_400_000)).toContain("8일");
    expect(clockWarning(3 * 3_600_000)).toContain("3시간");
    expect(clockWarning(-5 * 60_000)).toContain("5분");
  });

  it("모르면 아무 말도 하지 않는다", () => {
    expect(clockWarning(null)).toBeNull();
  });

  it("영어 오류를 한국어로 바꾼다", () => {
    expect(explainAuthError("JWT issued at future")).toContain("날짜·시간");
    expect(explainAuthError("JWT expired")).toContain("로그인이 만료");
    // 모르는 오류는 그대로 둔다 — 멋대로 바꾸면 원인을 찾을 길이 사라진다.
    expect(explainAuthError("permission denied for table tasks")).toBe(
      "permission denied for table tasks",
    );
  });
});
