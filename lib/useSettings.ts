"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type SaveResult,
  type Settings,
} from "@/lib/settings";

/**
 * localStorage에 붙은 설정 상태.
 * 로드 전에는 null을 돌려주므로, 호출부는 이 값이 준비될 때까지 렌더를 미룬다.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // 테마는 첫 페인트 때 인라인 스크립트가 이미 적용했고, 이후 변경만 여기서 반영한다.
  useEffect(() => {
    if (settings) document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  /** 저장에 성공했을 때만 화면 상태를 바꿔, 표시와 저장 내용이 어긋나지 않게 한다. */
  const update = useCallback(
    (patch: Partial<Settings>): SaveResult => {
      const next = { ...(settings ?? DEFAULT_SETTINGS), ...patch };
      const saved = saveSettings(next);
      if (saved.ok) setSettings(next);
      return saved;
    },
    [settings],
  );

  return { settings, update };
}
