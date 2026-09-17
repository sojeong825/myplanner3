"use client";

import { buildWeek, formatTime, WEEKDAYS, type DateKey } from "@/lib/date";
import { TaskCheck } from "@/lib/icons";
import type { Task } from "@/lib/types";

type Props = {
  anchor: DateKey;
  today: DateKey;
  tasksByDate: Map<DateKey, Task[]>;
  /** 빈 칸을 누르면 그 날짜로 '할 일 추가'가 바로 열린다. */
  onAddOn: (key: DateKey) => void;
  onSelect: (task: Task) => void;
  /** 아이콘 자리의 체크박스. 모달을 열지 않고 완료를 뒤집는다. */
  onToggleDone: (task: Task) => void;
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
  onAddOn,
  onSelect,
  onToggleDone,
}: Props) {
  const days = buildWeek(anchor);

  return (
    <div className="grid h-[528px] grid-cols-7 gap-px overflow-hidden rounded-b-card border-t border-line bg-line-soft">
      {days.map((day) => {
        const dayTasks = tasksByDate.get(day.key) ?? [];
        const isToday = day.key === today;

        return (
          // 월간과 같은 규칙 — 컬럼을 누르면 그 날짜로 추가가 열린다(버튼 중첩을 피해 div).
          <div
            key={day.key}
            role="button"
            tabIndex={0}
            aria-label={`${day.day}일에 할 일 추가`}
            onClick={() => onAddOn(day.key)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              onAddOn(day.key);
            }}
            className={`flex min-h-0 cursor-pointer flex-col transition hover:bg-canvas ${
              isToday ? "bg-soft/50" : "bg-card"
            }`}
          >
            <div className="flex flex-col items-center gap-1 py-3">
              <span
                className={`text-[13px] ${
                  day.weekday === 0 ? "text-accent-deep" : "text-ink-soft"
                }`}
              >
                {WEEKDAYS[day.weekday]}
              </span>
              <span
                className={
                  isToday
                    ? "grid size-8 place-items-center rounded-full bg-accent text-[15px] font-medium text-white"
                    : "grid size-8 place-items-center text-[15px] text-ink-mid"
                }
              >
                {day.day}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
              {dayTasks.map((task) => (
                // 안에 체크박스 버튼이 들어가므로 항목 자체는 버튼이 될 수 없다.
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(task);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(task);
                  }}
                  title={task.title}
                  // 항목은 흰 배경 + 여백만으로 구분한다. 완료는 텍스트만 흐리게.
                  className={`group/task flex cursor-pointer items-start gap-1.5 rounded-[10px] bg-card px-2 py-1.5 text-left text-[13px] leading-snug transition hover:bg-soft ${
                    task.is_done ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  {/* 여러 줄로 넘어가도 첫 줄에 맞춰 정렬 */}
                  <TaskCheck
                    icon={task.icon}
                    done={task.is_done}
                    onToggle={() => onToggleDone(task)}
                    iconClassName="mt-px text-[13px]"
                  />
                  {/* 형광펜은 box-decoration-break: clone이라 줄이 넘어가도 줄마다 그어진다. */}
                  <span className="min-w-0">
                    {task.due_time && !task.is_done && (
                      <span className="block text-ink-soft">{formatTime(task.due_time)}</span>
                    )}
                    <span
                      className={`line-clamp-3 ${
                        task.is_starred && !task.is_done ? "marker" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
