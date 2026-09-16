"use client";

import type { NotifyState } from "@/lib/useNotifications";

/**
 * PC 알림 켜기/끄기. 사이드바 아래쪽, 테마 옆에 둔다.
 *
 * 브라우저가 알림을 지원하지 않으면 아예 그리지 않는다 — 눌러도 아무 일이 없는
 * 스위치를 보여주는 것보다 없는 편이 낫다.
 */
export default function NotifyToggle({ supported, enabled, permission, toggle }: NotifyState) {
  if (!supported) return null;

  // 브라우저 설정에서 막아둔 경우. 여기서는 되돌릴 방법이 없어 안내만 한다.
  const blocked = permission === "denied";

  return (
    <div>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={blocked}
        aria-pressed={enabled}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-soft/50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span className="flex-1 text-[11px] text-ink-soft">PC 알림</span>

        {/* 스위치. 켜짐은 --accent를 따라가서 테마와 함께 바뀐다. */}
        <span
          className={`relative h-4 w-7 shrink-0 rounded-full transition ${
            enabled && !blocked ? "bg-accent" : "bg-soft-deep"
          } ${blocked ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 size-3 rounded-full bg-card transition-all ${
              enabled && !blocked ? "left-3.5" : "left-0.5"
            }`}
          />
        </span>
      </button>

      <p className="px-2 pt-1 text-[10px] leading-snug text-ink-faint">
        {blocked
          ? "브라우저에서 알림이 차단돼 있어요. 주소창 옆 자물쇠에서 허용해주세요"
          : enabled
            ? "이 탭이 열려 있는 동안 마감 시간에 알려드려요"
            : "시간을 정한 일정의 마감 때 알림을 받아요"}
      </p>
    </div>
  );
}
