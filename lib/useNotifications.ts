"use client";

import { useCallback, useEffect, useState } from "react";
import { formatTime, type DateKey } from "@/lib/date";
import { toIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

/**
 * 마감 시간에 맞춰 PC 알림을 띄운다.
 *
 * **이 탭이 열려 있는 동안에만 온다.** 브라우저를 닫아도 오게 하려면 서비스 워커와
 * 푸시 서버가 필요한데, 그건 이 앱이 짊어질 만한 무게가 아니다. 대신 켜져 있는 동안은
 * 확실히 오게 하고, 화면에도 그 한계를 그대로 적어둔다.
 *
 * 켜짐/꺼짐은 **settings가 아니라 localStorage**에 둔다. 알림 권한 자체가
 * 브라우저·기기마다 따로 붙는 것이라, 회사 PC에서 켠 게 휴대폰에서도 켜지면 곤란하다.
 */
const ENABLED_KEY = "my-planner:notify";

/**
 * 미리 예약해두는 범위. setTimeout은 약 24.8일이 넘으면 즉시 터지는 버그가 있고,
 * 어차피 먼 일정까지 타이머로 들고 있을 이유도 없다.
 */
const HORIZON_MS = 24 * 60 * 60 * 1000;

export type NotifyState = {
  /** 이 브라우저가 알림을 지원하는지. 지원하지 않으면 UI 자체를 감춘다. */
  supported: boolean;
  /** 사용자가 켜둔 상태인지(권한과는 별개). */
  enabled: boolean;
  permission: NotificationPermission | null;
  toggle: () => Promise<void>;
};

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(ENABLED_KEY) === "on";
  } catch {
    return false;
  }
}

/** 'YYYY-MM-DD' + 'HH:MM' → 그 시각의 밀리초. 내 시계 기준이다(시간대 변환 없음). */
function timeOf(date: DateKey, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

export function useNotifications(tasks: Task[]): NotifyState {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  // 서버 렌더에는 window가 없다. 첫 페인트 뒤에 확인한다.
  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    setEnabled(readEnabled());
  }, []);

  const toggle = useCallback(async () => {
    if (!supported) return;

    if (enabled) {
      setEnabled(false);
      try {
        window.localStorage.setItem(ENABLED_KEY, "off");
      } catch {
        // 저장에 실패해도 이번 세션에는 꺼진 상태로 동작한다.
      }
      return;
    }

    // 권한은 사용자 조작에서 곧바로 요청해야 브라우저가 창을 띄워준다.
    const next =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    setPermission(next);
    if (next !== "granted") return;

    setEnabled(true);
    try {
      window.localStorage.setItem(ENABLED_KEY, "on");
    } catch {
      // 위와 같다.
    }
  }, [supported, enabled]);

  /**
   * 할 일이 바뀔 때마다 타이머를 전부 새로 건다.
   *
   * 하나하나 맞춰 갱신하는 것보다 통째로 다시 거는 편이 단순하고 틀릴 일이 없다.
   * 예약 대상이 많아야 하루치라 비용도 무시할 만하다.
   */
  useEffect(() => {
    if (!supported || !enabled || permission !== "granted") return;

    const now = Date.now();
    const timers: number[] = [];

    for (const task of tasks) {
      if (task.is_done || !task.due_date || !task.due_time) continue;

      const delay = timeOf(task.due_date, task.due_time) - now;
      // 이미 지난 것은 알리지 않는다. 지금 켠 순간 옛 알림이 우르르 쏟아지면 곤란하다.
      if (delay <= 0 || delay > HORIZON_MS) continue;

      timers.push(
        window.setTimeout(() => {
          try {
            new Notification(`${toIcon(task.icon)} ${task.title}`, {
              body: `${formatTime(task.due_time as string)} 마감이에요`,
              // 같은 일정이 두 번 뜨지 않게 태그로 묶는다(브라우저가 알아서 합친다).
              tag: `task-${task.id}`,
            });
          } catch {
            // 알림이 막혀 있어도 앱은 그대로 돌아가야 한다.
          }
        }, delay),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [tasks, supported, enabled, permission]);

  return { supported, enabled, permission, toggle };
}
