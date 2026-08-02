"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  THEME_CACHE_KEY,
  type SaveResult,
  type Settings,
} from "@/lib/settings";
import type { Store } from "@/lib/store";

/**
 * 설정 상태. 저장 위치(로컬/서버)는 store가 정하고 여기서는 신경 쓰지 않는다.
 * 로드 전에는 null을 돌려주므로, 호출부는 이 값이 준비될 때까지 렌더를 미룬다.
 */
export function useSettings(store: Store, ready: boolean) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    setSettings(null);
    store
      .loadSettings()
      .then((s) => !cancelled && setSettings(s))
      .catch(() => !cancelled && setSettings(DEFAULT_SETTINGS));

    return () => {
      cancelled = true;
    };
  }, [store, ready]);

  // 테마는 첫 페인트 때 인라인 스크립트가 이미 적용했고, 이후 변경만 여기서 반영한다.
  // 서버에서 온 테마도 캐시에 남겨야 다음 새로고침에서 깜빡이지 않는다.
  useEffect(() => {
    if (!settings) return;
    document.documentElement.dataset.theme = settings.theme;
    try {
      window.localStorage.setItem(THEME_CACHE_KEY, settings.theme);
    } catch {
      // 저장에 실패해도 화면에는 이미 적용돼 있으니 넘어간다.
    }
  }, [settings]);

  /** 저장에 성공했을 때만 화면 상태를 바꿔, 표시와 저장 내용이 어긋나지 않게 한다. */
  const update = useCallback(
    async (patch: Partial<Settings>): Promise<SaveResult> => {
      const next = { ...(settings ?? DEFAULT_SETTINGS), ...patch };
      try {
        await store.saveSettings(next);
        setSettings(next);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          message: e instanceof Error ? e.message : "설정을 저장하지 못했어요.",
        };
      }
    },
    [settings, store],
  );

  return { settings, setSettings, update };
}
