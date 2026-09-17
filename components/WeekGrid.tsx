"use client";

import DayAgenda from "@/components/DayAgenda";
import WeekStrip from "@/components/WeekStrip";
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
  /** 좁은 화면에서 요일 줄의 날짜를 눌렀을 때. 고른 날이 곧 anchor가 된다. */
  onSelectDay: (key: DateKey) => void;
};

/**
 * 한 주.
 *
 * **좁은 화면과 넓은 화면이 아예 다른 모양이다.** 일곱 칸을 가로로 늘어놓는 격자는
 * 폰에서 한 칸이 50px이라 제목이 한 글자도 안 들어간다. 그래서 폰에서는 가로 한 줄에
 * 요일과 개수만 늘어놓고(WeekStrip), 고른 날의 제목은 그 아래 목록이 맡는다.
 *
 * 고른 날은 따로 들고 있지 않고 anchor를 그대로 쓴다. 요일 줄에서 날짜를 누르면
 * anchor가 그 날로 옮겨가는데, 같은 주 안이라 화면에 보이는 주는 그대로다.
 *
 * 넓은 화면은 예전 그대로 — 날짜 컬럼 일곱 개에 카드를 쌓는다. 시간축(10 Am 등)이
 * 없는 것은 Task가 날짜 단위라서다. due_date를 시간까지 넓힐 때 함께 검토하면 된다.
 */
export default function WeekGrid({
  anchor,
  today,
  tasksByDate,
  onAddOn,
  onSelect,
  onToggleDone,
  onSelectDay,
}: Props) {
  const days = buildWeek(anchor);

  return (
    <>
    {/* ── 폰 ── */}
    <div className="lg:hidden">
      <div className="border-t border-line">
        <WeekStrip
          anchor={anchor}
          today={today}
          tasksByDate={tasksByDate}
          onSelect={onSelectDay}
        />
      </div>
      <DayAgenda
        dateKey={anchor}
        tasks={tasksByDate.get(anchor) ?? []}
        today={today}
        showTitle
        onSelect={onSelect}
        onToggleDone={onToggleDone}
        onAdd={onAddOn}
      />
    </div>

    {/* ── 넓은 화면 ── */}
    <div className="hidden gap-px overflow-hidden rounded-b-card border-t border-line bg-line-soft lg:grid lg:h-[528px] lg:grid-cols-7">
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
            <div className="flex flex-row items-center gap-2 px-3 pb-1 pt-3 lg:flex-col lg:gap-1 lg:px-0 lg:py-3">
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

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3 lg:px-1.5 lg:pb-2">
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
    </>
  );
}
