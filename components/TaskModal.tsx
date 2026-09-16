"use client";

import { useEffect, useRef, useState } from "react";
import DatePicker from "@/components/DatePicker";
import EmojiPicker from "@/components/EmojiPicker";
import { autoIcon } from "@/lib/autoIcon";
import { categoryName, type Category } from "@/lib/categories";
import type { DateKey } from "@/lib/date";
import { StarButton, TaskIcon, toIcon, TrashButton } from "@/lib/icons";
import type { NewTask, Task } from "@/lib/types";

type Props = {
  open: boolean;
  /** null이면 추가, Task가 오면 그 할 일을 수정한다. */
  task: Task | null;
  /** 추가 모드에서 미리 고를 날짜. 달력에서 고른 칸이 여기로 온다. */
  initialDate: string | null;
  today: DateKey;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  /** 마감일을 여러 개 고르면 날짜 수만큼 넘어온다. */
  onSubmit: (drafts: NewTask[]) => void;
  onDelete: (task: Task) => void;
};

export default function TaskModal({
  open,
  task,
  initialDate,
  today,
  categories,
  saving,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  /**
   * 고른 마감일들. 비어 있으면 마감 없음.
   *
   * 달력 칸을 직접 누른 것만 여기 들어온다. 네이티브 <input type="date">를 쓸 때는
   * 달을 넘기는 것만으로도 change가 올라와서 고르지도 않은 날짜가 값이 됐다.
   * 추가할 때는 누른 만큼 쌓이고(날짜 수만큼 할 일이 만들어진다), 수정할 때는 한 개다.
   */
  const [dates, setDates] = useState<DateKey[]>([]);
  /**
   * 마감 시간 'HH:MM'. 빈 문자열이면 시간 없음.
   *
   * 날짜가 없으면 저장할 때 같이 버린다 — 날짜 없는 시간은 언제인지 알 수 없다.
   * 날짜를 여러 개 고르면 그 날짜들이 전부 같은 시간을 갖는다.
   */
  const [time, setTime] = useState("");
  /**
   * 사용자가 고른 이모지. null이면 '자동' — 제목·분류를 따라 실시간으로 바뀐다.
   *
   * 자동을 기본으로 두되 잠그지는 않는다. 자동이 늘 맞을 수는 없어서, 고르면
   * 그때부터 그 값이 그대로 저장되고 '자동으로'를 누르면 다시 자동으로 돌아간다.
   */
  const [pickedIcon, setPickedIcon] = useState<string | null>(null);
  /** 이모지 고르는 칸이 펼쳐져 있는지. 평소에는 접어둬서 모달이 길어지지 않게 한다. */
  const [iconOpen, setIconOpen] = useState(false);
  /** 공백만 남으면 저장할 때 null로 바꾼다. */
  const [memo, setMemo] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  /** 삭제 확인 모달이 떠 있는지 */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const editing = task !== null;

  // 열릴 때마다 상태를 초기화한다. 수정이면 저장된 값으로 채운다.
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    // 추가 모드에서는 달력에서 고른 칸이 있으면 그 날짜가 미리 골라진 채로 열린다.
    const start = task?.due_date ?? initialDate;
    setDates(start ? [start] : []);
    setTime(task?.due_time ?? "");
    // 수정은 이미 정해진 이모지가 있으므로 그걸 고른 값으로 삼는다. 추가는 자동에서 시작.
    setPickedIcon(task ? toIcon(task.icon) : null);
    setIconOpen(false);
    setMemo(task?.memo ?? "");
    setCategoryId(task?.category_id ?? null);
    setStarred(task?.is_starred ?? false);
    setConfirmOpen(false);
    titleRef.current?.focus();
  }, [open, task, initialDate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 확인 모달이 떠 있으면 그것만 닫는다.
      if (confirmOpen) setConfirmOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmOpen, onClose]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && !saving;

  /** 고른 게 있으면 그것, 없으면 제목·분류로 자동 결정된 이모지. */
  const suggested = autoIcon(title, categoryName(categories, categoryId));
  const icon = pickedIcon ?? suggested;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const base = {
      title: title.trim(),
      icon,
      // 이모지는 색을 입힐 수 없어서 색상 선택을 없앴다(v1.4). 컬럼만 남아 있다.
      icon_color: null,
      // 공백만 남은 메모는 '메모 없음'과 같으므로 null로 통일한다.
      memo: memo.trim() || null,
      category_id: categoryId,
      is_starred: starred,
    };

    // 마감일은 선택 항목 — 하나도 없으면 마감 없는 할 일 한 건으로 저장한다.
    // 날짜가 없으면 시간도 함께 버린다.
    onSubmit(
      dates.length === 0
        ? [{ ...base, due_date: null, due_time: null }]
        : dates.map((due_date) => ({ ...base, due_date, due_time: time || null })),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/20 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="my-auto w-full max-w-[380px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
      >
        <div className="flex items-center gap-1">
          <h2 id="task-modal-title" className="mr-auto text-[16px] font-medium">
            {editing ? "할 일 수정" : "할 일 추가"}
          </h2>

          {/* 보기 모달과 같은 순서 — 삭제가 왼쪽, 별표가 오른쪽이다. */}
          {editing && (
            <TrashButton onClick={() => setConfirmOpen(true)} className="size-9 text-ink-faint" />
          )}

          {/*
            특별 일정은 라벨 없이 별 하나로만 둔다 — 켜짐/꺼짐이 모양으로 바로 읽힌다.
            라벨이 없는 만큼 별을 크게 그려야 눈에 들어온다.
          */}
          <StarButton
            starred={starred}
            onToggle={() => setStarred((v) => !v)}
            className={`-mr-1 size-9 ${starred ? "text-accent" : "text-ink-faint"}`}
            iconClassName="size-6"
          />
        </div>

        {/*
          섹션 간격은 여기 space-y 한 곳에서만 준다.
          각 섹션에 margin을 따로 붙이면 필드를 추가할 때 간격이 어긋난다.
        */}
        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-[12px] text-ink-soft">
              할 일 이름 <span className="text-accent-deep">*</span>
            </span>
            {/*
              앞쪽 이모지는 저장될 아이콘이자 버튼이다. 누르면 아래 고르는 칸이 펼쳐진다.
              입력칸 안에 둔 이유는 제목과 함께 읽히기 때문 — 따로 떼어놓으면 이게
              이 일정의 아이콘이라는 게 덜 분명하다.
            */}
            {/* relative: 이모지 팝오버가 이 칸을 기준으로 아래에 붙는다. */}
            <div className="relative mt-1.5 flex items-center gap-1 rounded-lg border border-line bg-canvas pr-3 focus-within:border-accent">
              <button
                type="button"
                onClick={() => setIconOpen((v) => !v)}
                aria-expanded={iconOpen}
                aria-label="아이콘 바꾸기"
                title="아이콘 바꾸기"
                className="my-1 ml-1 grid size-8 shrink-0 place-items-center rounded-md transition hover:bg-soft"
              >
                <TaskIcon icon={icon} className="text-[17px]" />
              </button>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 방청소하기"
                maxLength={120}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] outline-none placeholder:text-ink-faint"
              />

              {iconOpen && (
                <EmojiPicker
                  value={icon}
                  isAuto={pickedIcon === null}
                  onPick={(e) => setPickedIcon(e)}
                  onAuto={() => {
                    setPickedIcon(null);
                    setIconOpen(false);
                  }}
                  onClose={() => setIconOpen(false)}
                />
              )}
            </div>

          </label>

          <div>
            <span className="text-[12px] text-ink-soft">마감일</span>
            <div className="mt-1.5">
              {/*
                수정할 때도 날짜를 더 고를 수 있다. 이 일정은 첫 날짜로 옮겨가고,
                나머지 날짜에는 같은 내용의 일정이 새로 만들어진다(page.tsx의 submitTask).
              */}
              <DatePicker value={dates} today={today} multiple onChange={setDates} />
            </div>

            {/* 시간은 날짜를 고른 뒤에만 의미가 있다. 날짜 없는 시간은 언제인지 알 수 없다. */}
            {dates.length > 0 && (
              <label className="mt-2 flex items-center gap-2">
                <span className="shrink-0 text-[12px] text-ink-soft">시간</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                />
                {time && (
                  <button
                    type="button"
                    onClick={() => setTime("")}
                    className="text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
                  >
                    시간 없애기
                  </button>
                )}
              </label>
            )}
          </div>

          <div>
            <span className="text-[12px] text-ink-soft">분류</span>

            {categories.length === 0 ? (
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                아직 만든 분류가 없어요. 왼쪽 사이드바에서 만들 수 있어요.
              </p>
            ) : (
              <div role="radiogroup" aria-label="분류" className="mt-1.5 flex flex-wrap gap-1.5">
                {[null, ...categories.map((c) => c.id)].map((id) => (
                  <button
                    key={id ?? "none"}
                    type="button"
                    role="radio"
                    aria-checked={categoryId === id}
                    onClick={() => setCategoryId(id)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                      categoryId === id
                        ? "border-accent-deep bg-soft text-ink"
                        : "border-line text-ink-soft hover:border-ink-faint"
                    }`}
                  >
                    {id === null ? "미분류" : categories.find((c) => c.id === id)!.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-[12px] text-ink-soft">메모</span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예) 세제랑 수세미 사오기"
              maxLength={500}
              rows={2}
              // resize-none: 사용자가 늘리면 모달 바깥으로 삐져나온다. 넘치면 안에서 스크롤된다.
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {/* 수정에서 날짜를 더 고르면 이 일정 말고 나머지가 새로 만들어진다. */}
              {saving
                ? "저장 중…"
                : dates.length > 1
                  ? editing
                    ? `저장 + ${dates.length - 1}개 추가`
                    : `${dates.length}개 저장`
                  : "저장"}
            </button>
          </div>
        </div>
      </form>

      {confirmOpen && task && (
        // 수정 모달 위에 겹쳐 띄운다. 바깥을 누르거나 Esc를 누르면 이것만 닫힌다.
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/25 p-4"
          onMouseDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="task-delete-title"
            className="w-full max-w-[300px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
          >
            <p id="task-delete-title" className="text-center text-[15px] font-medium">
              삭제할까요?
            </p>
            <p className="mt-2 break-keep text-center text-[12px] leading-relaxed text-ink-soft">
              &lsquo;{task.title}&rsquo; 은(는) 되돌릴 수 없어요.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={saving}
                className="flex-1 rounded-full bg-danger py-2.5 text-[13px] font-medium text-white transition hover:bg-danger-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
