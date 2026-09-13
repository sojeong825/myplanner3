"use client";

import { StarButton, TaskIcon } from "@/lib/icons";
import type { Task } from "@/lib/types";

/**
 * 완료 목록에 한 번에 띄울 최대 개수.
 * 다 쌓아두면 남은 할 일이 밀려나기만 해서 최근 것만 남기고, 전체 개수는 라벨에 적는다.
 */
const DONE_LIMIT = 10;

type Props = {
  pending: Task[];
  done: Task[];
  onToggle: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onSelect: (task: Task) => void;
  onAdd: () => void;
};

function Row({
  task,
  onToggle,
  onToggleStar,
  onSelect,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onToggleStar: (t: Task) => void;
  onSelect: (t: Task) => void;
}) {
  return (
    // 보더·그림자 없이 여백만으로 구분한다. hover 때만 아주 옅게 톤이 바뀐다.
    // 체크박스는 완료 토글, 이름 영역은 수정 모달 — 클릭 영역을 나눠둔다.
    // 별표가 켜진 행만 배경으로 들어올린다.
    <li
      className={`group flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition hover:bg-canvas ${
        task.is_starred && !task.is_done ? "bg-soft/60" : "bg-card"
      }`}
    >
      <label className="flex cursor-pointer items-center" title="완료 표시">
        <input
          type="checkbox"
          checked={task.is_done}
          onChange={() => onToggle(task)}
          className="peer sr-only"
        />
        <span
          className={`grid size-4 shrink-0 place-items-center rounded-[5px] border transition ${
            task.is_done ? "border-accent bg-accent" : "border-soft-deep bg-card"
          }`}
        >
          {task.is_done && (
            <svg viewBox="0 0 24 24" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="3.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </label>

      <button
        type="button"
        onClick={() => onSelect(task)}
        // 메모는 목록에 펼치면 줄이 길어져서, 확인만 되도록 hover 툴팁으로 붙인다.
        title={task.memo ? `${task.title}\n${task.memo}` : task.title}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
      >
        <TaskIcon icon={task.icon} done={task.is_done} />

        <span
          className={`truncate text-[13px] ${
            task.is_done
              ? "text-ink-faint line-through"
              : task.is_starred
                ? "font-medium text-ink"
                : "text-ink"
          }`}
        >
          {task.title}
        </span>

        {task.due_date && (
          <span
            className={`ml-auto shrink-0 text-[11px] ${
              task.is_done ? "text-ink-faint" : "text-ink-soft"
            }`}
          >
            {task.due_date.slice(5).replace("-", "/")}
          </span>
        )}
      </button>

      {/*
        켜져 있으면 항상 보이고, 꺼져 있으면 hover·키보드 포커스에서만 드러난다.
        display가 아니라 opacity로 숨기는 이유는 자리를 늘 차지하게 두기 위해서다 —
        hover할 때마다 버튼이 생기면 옆 글자가 밀려 목록이 들썩인다.
      */}
      <StarButton
        starred={task.is_starred}
        onToggle={() => onToggleStar(task)}
        className={
          task.is_starred
            ? "text-accent"
            : "text-ink-faint opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
        }
      />
    </li>
  );
}

export default function TaskList({
  pending,
  done,
  onToggle,
  onToggleStar,
  onSelect,
  onAdd,
}: Props) {
  const empty = pending.length === 0 && done.length === 0;

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-card border border-line bg-card p-5 shadow-card">
      <div className="flex items-center px-1">
        <h2 className="text-[14px] font-medium">할 일</h2>
        <button
          type="button"
          onClick={onAdd}
          aria-label="할 일 추가"
          className="ml-auto grid size-6 place-items-center rounded-full bg-accent text-white transition hover:bg-accent-deep"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {empty ? (
        <p className="px-1 py-8 text-center text-[12px] text-ink-faint">
          아직 할 일이 없어요. + 를 눌러 추가해보세요.
        </p>
      ) : (
        <div className="mt-3 -mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
          {pending.length > 0 && (
            <ul className="flex flex-col gap-2">
              {pending.map((task) => (
                <Row
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onToggleStar={onToggleStar}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          )}

          {done.length > 0 && (
            <div>
              <p className="px-1 pb-1.5 text-[11px] text-ink-faint">
                완료 {done.length}
                {done.length > DONE_LIMIT && ` · 최근 ${DONE_LIMIT}개`}
              </p>
              <ul className="flex flex-col gap-2">
                {done.slice(0, DONE_LIMIT).map((task) => (
                  <Row
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onToggleStar={onToggleStar}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
