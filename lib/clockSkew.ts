/**
 * 기기 시계가 실제 시각과 얼마나 어긋났는지.
 *
 * 로그인 토큰(JWT)은 **서버가** 만들고, 그 안에 발급 시각(iat)이 박혀 있다. 그러니
 * iat는 '진짜 시각'에 가깝다. 기기 시계를 그것과 견주면 어긋난 정도가 바로 나온다.
 *
 * 왜 필요한가: 기기 시계가 뒤처져 있으면 서버가 방금 준 토큰이 기기 입장에서는
 * '미래에 발급된 토큰'이 된다. 그러면 요청이 `JWT issued at future`로 거절되고,
 * 토큰 갱신도 실패해서 로그인이 자꾸 풀린다. 달력의 '오늘'도 당연히 틀린 날에 찍힌다.
 * 앱이 고칠 수 있는 문제가 아니라서, 무슨 일인지 알려주는 것까지가 할 일이다.
 */

/** 토큰 안의 발급 시각(초). 못 읽으면 null. */
export function tokenIssuedAt(accessToken: string): number | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const iat: unknown = JSON.parse(json).iat;
    return typeof iat === "number" && Number.isFinite(iat) ? iat : null;
  } catch {
    // 토큰 모양이 아니거나 base64가 깨졌으면 그냥 모르는 것으로 둔다.
    return null;
  }
}

/** 양수면 기기가 앞서 있고, 음수면 뒤처져 있다(밀리초). */
export function clockSkewMs(accessToken: string, now: number = Date.now()): number | null {
  const iat = tokenIssuedAt(accessToken);
  return iat === null ? null : now - iat * 1000;
}

/**
 * 뒤처짐은 1분만 넘어도 이상하다 — 토큰은 서버가 **방금** 만든 것이라 기기 시각이
 * 그보다 이를 수가 없다.
 *
 * 앞섬은 기준이 느슨해야 한다. 토큰은 한 시간을 살고 그동안 계속 쓰이므로, 발급
 * 시각보다 기기가 한 시간쯤 앞서 있는 것은 지극히 정상이다.
 */
export const BEHIND_LIMIT_MS = -60_000;
export const AHEAD_LIMIT_MS = 2 * 60 * 60 * 1000;

function gapText(ms: number): string {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86_400_000);
  if (days >= 1) return `${days}일`;
  const hours = Math.floor(abs / 3_600_000);
  if (hours >= 1) return `${hours}시간`;
  return `${Math.max(1, Math.round(abs / 60_000))}분`;
}

/** 시계가 어긋났을 때 띄울 안내. 멀쩡하면 null. */
export function clockWarning(skewMs: number | null): string | null {
  if (skewMs === null) return null;
  if (skewMs >= BEHIND_LIMIT_MS && skewMs <= AHEAD_LIMIT_MS) return null;

  const direction = skewMs < 0 ? "뒤처져" : "앞서";
  return (
    `이 기기의 시계가 실제 시각보다 약 ${gapText(skewMs)} ${direction} 있어요. ` +
    `그래서 로그인이 자꾸 풀리고 달력의 '오늘'도 틀린 날에 찍혀요. ` +
    `휴대폰 설정에서 날짜·시간을 '자동으로 설정'으로 켜주세요.`
  );
}

/** Supabase가 영어로 돌려주는 시계 관련 사고를 한국어로 바꾼다. */
export function explainAuthError(raw: string): string {
  if (/issued (at|in the) future/i.test(raw)) {
    return "기기 시계가 실제 시각보다 뒤처져 있어요. 휴대폰 설정에서 날짜·시간을 '자동으로 설정'으로 켜주세요.";
  }
  if (/jwt expired|token (is )?expired/i.test(raw)) {
    return "로그인이 만료됐어요. 새로고침하거나 다시 로그인해주세요.";
  }
  return raw;
}
