"use client";

import { useSyncExternalStore } from "react";

/**
 * 미디어 쿼리가 맞는지.
 *
 * **보이고 안 보이고는 여기서 정하지 않는다.** 그건 전부 CSS(lg: 접두사)로 한다 —
 * 그쪽이 서버에서 그린 HTML과 어긋날 일이 없고, 창을 줄였다 늘였다 해도 알아서 따라온다.
 *
 * 이건 CSS로는 가를 수 없는 자리, 그러니까 **동작**이 달라지는 자리에만 쓴다.
 * 지금은 한 곳뿐이다 — 달력 칸을 눌렀을 때 넓은 화면에서는 '추가'가 열리고
 * 좁은 화면에서는 '그날 목록'이 올라온다.
 *
 * 서버에서는 늘 false다. 첫 그림은 좁은 화면 기준으로 그려지고, 하이드레이션
 * 직후에 실제 폭으로 맞춰진다.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 데스크톱 3단 레이아웃이 켜지는 폭. Tailwind의 lg(64rem)와 같은 값이어야 한다. */
export const DESKTOP = "(min-width: 64rem)";
