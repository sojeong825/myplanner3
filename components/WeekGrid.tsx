"use client";

import { buildWeek, WEEKDAYS, type DateKey } from "@/lib/date";
import { TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

/**
 * 주간은 한 칸이 7분의 1로 좁아서 자간을 죈다. 같은 폭에 한두 글자가 더 들어가고,
 * line-clamp-3에 걸려 잘리는 제목이 그만큼 줄어든다.
 * 월간은 반대로 MonthGrid에서 자간을 벌린다.
 */
const WEEK_TRACKING = "tracking-[-0.02em]";

type Props = {
  anchor: DateKey;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
  selectedDate: DateKey | null;
  onSelectDate: (key: DateKey) => void;
  onSelect: (task: Task) => void;
};

/**
 * 참고 레퍼런스는 시간대(10 Am 등) 세로축이 있는 event 캘린더지만,
 * 현재 Task에는 시간 정보가 없다(due_date는 날짜 단위). 그래서 시간축 없이
 * '날짜 컬럼 + 카드 목록' 형태로 만든다. due_date를 날짜+시간으로 넓힐 때
 * 시간축을 함께 검토하면 된다.
 */
export default function WeekGrid({
  anchor,
  today,
  tasksByDate,
  selectedDate,
  onSelectDate,
  onSelect,
}: Props) {
  const days = buildWeek(anchor);

  return (
    <div className="grid h-[528px] grid-cols-7 gap-px overflow-hidden rounded-b-card border-t border-line bg-line-soft">
      {days.map((day) => {
        const dayTasks = tasksByDate.get(day.key) ?? [];
        const isToday = day.key === today;
        const isSelected = day.key === selectedDate;

        return (
          // 월간과 같은 규칙 — 컬럼 전체가 '이 날짜를 고른다' 버튼이다(버튼 중첩을 피해 div).
          <div
            key={day.key}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${day.day}일 선택`}
            onClick={() => onSelectDate(day.key)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              onSelectDate(day.key);
            }}
            className={`flex min-h-0 cursor-pointer flex-col transition ${
              isToday ? "bg-soft/50" : "bg-card"
            } ${isSelected ? "ring-2 ring-accent ring-inset" : "hover:bg-canvas"}`}
          >
            <div className="flex flex-col items-center gap-1 py-3">
              <span
                className={`text-[12px] ${WEEK_TRACKING} ${
                  day.weekday === 0 ? "text-accent-deep" : "text-ink-soft"
                }`}
              >
                {WEEKDAYS[day.weekday]}
              </span>
              <span
                className={
                  isToday
                    ? "grid size-7 place-items-center rounded-full bg-accent text-[13px] font-medium text-white"
                    : "grid size-7 place-items-center text-[13px] text-ink-mid"
                }
              >
                {day.day}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
              {dayTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(task);
                  }}
                  title={task.title}
                  // 항목은 흰 배경 + 여백만으로 구분한다. 완료는 텍스트만 흐리게.
                  className={`flex cursor-pointer items-start gap-1.5 rounded-[10px] bg-card px-2 py-1.5 text-left text-[11px] leading-snug ${WEEK_TRACKING} transition hover:bg-soft ${
                    task.is_done ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  {/* 여러 줄로 넘어가도 첫 줄에 맞춰 정렬 */}
                  <TaskIcon icon={task.icon} done={task.is_done} className="mt-px text-[11px]" />
                  {/* 형광펜은 box-decoration-break: clone이라 줄이 넘어가도 줄마다 그어진다. */}
                  <span
                    className={`line-clamp-3 ${
                      task.is_starred && !task.is_done ? "marker" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
