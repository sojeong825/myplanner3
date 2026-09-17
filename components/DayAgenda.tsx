"use client";

import DayList from "@/components/DayList";
import { formatDayTitle, type DateKey } from "@/lib/date";
import type { Task } from "@/lib/types";

type Props = {
  dateKey: DateKey;
  tasks: Task[];
  today: DateKey;
  /**
   * 날짜를 머리에 적을지. 일간 화면에서는 달력 머리줄이 이미 날짜를 말하고 있어서
   * 끄고, 주간 화면에서는 머리줄이 '한 주'를 말하므로 켠다.
   */
  showTitle?: boolean;
  onSelect: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onAdd: (key: DateKey) => void;
};

/**
 * 하루치 화면 한 덩어리 — 날짜 머리 + 추가 버튼 + 그날 목록.
 *
 * 일간 화면이 그대로 쓰고, 좁은 화면의 주간도 위에 요일 줄만 얹고 이걸 쓴다.
 */
export default function DayAgenda({
  dateKey,
  tasks,
  today,
  showTitle = false,
  onSelect,
  onToggleDone,
  onAdd,
}: Props) {
  return (
    <div className="border-t border-line px-4 pb-5 pt-3">
      <div className="flex items-center gap-2">
        {showTitle && (
          <h3 className="text-[15px] font-medium text-ink">{formatDayTitle(dateKey)}</h3>
        )}
        {dateKey === today && (
          <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] text-accent-deep">
            오늘
          </span>
        )}

        {/*
          일정 추가는 여기서만 연다. 달력 머리줄에 버튼을 두면 '어느 날'인지 정하지
          않은 채로 열려서, 모달에서 날짜를 다시 골라야 한다.
        */}
        <button
          type="button"
          onClick={() => onAdd(dateKey)}
          className="ml-auto shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-accent-deep"
        >
          + 추가
        </button>
      </div>

      <div className="mt-2">
        <DayList tasks={tasks} onSelect={onSelect} onToggleDone={onToggleDone} />
      </div>
    </div>
  );
}
