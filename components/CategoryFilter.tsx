"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_NAME_MAX,
  validateName,
  type Category,
  type CategoryFilter as Filter,
} from "@/lib/categories";

type Props = {
  categories: Category[];
  value: Filter;
  onChange: (next: Filter) => void;
  onAdd: (name: string) => void;
  onRemove: (category: Category) => void;
};

/**
 * 분류 목록. 고른 값은 달력·할 일·다가오는 일정에 한꺼번에 걸린다.
 *
 * 만들기와 지우기도 여기서 한다. 따로 설정 화면을 두지 않는 이유는, 분류가
 * 몇 개 안 되고 고르는 자리와 관리하는 자리가 같은 편이 찾기 쉬워서다.
 */
export default function CategoryFilter({
  categories,
  value,
  onChange,
  onAdd,
  onRemove,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** 지우기 확인을 기다리는 분류. 한 번 더 눌러야 실제로 지워진다. */
  const [confirming, setConfirming] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const closeAdd = () => {
    setAdding(false);
    setDraft("");
    setError(null);
  };

  const submit = () => {
    const result = validateName(draft, categories);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onAdd(result.name);
    closeAdd();
  };

  return (
    <div>
      <div className="flex items-center px-2 pb-1.5">
        <p className="text-[11px] text-ink-soft">분류</p>
        <button
          type="button"
          onClick={() => (adding ? closeAdd() : setAdding(true))}
          aria-label={adding ? "분류 추가 취소" : "분류 추가"}
          title={adding ? "취소" : "분류 추가"}
          className="ml-auto grid size-4 place-items-center rounded-full text-ink-faint transition hover:bg-soft hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3">
            <path d={adding ? "M6 6l12 12M18 6L6 18" : "M12 5v14M5 12h14"} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] transition ${
            value === null
              ? "bg-soft font-medium text-ink"
              : "text-ink-soft hover:bg-soft/50 hover:text-ink"
          }`}
        >
          전체
        </button>

        {categories.map((c) => {
          const active = value === c.id;
          const pendingDelete = confirming === c.id;

          return (
            // group: 마우스를 올렸을 때만 지우기 버튼을 드러낸다.
            <div
              key={c.id}
              className={`group flex items-center rounded-lg transition ${
                active ? "bg-soft" : "hover:bg-soft/50"
              }`}
            >
              <button
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className={`min-w-0 flex-1 truncate rounded-lg py-1.5 pl-2 text-left text-[13px] ${
                  active ? "font-medium text-ink" : "text-ink-soft group-hover:text-ink"
                }`}
              >
                {c.name}
              </button>

              {/*
                한 번 누르면 휴지통이 '확인'으로 바뀌고, 한 번 더 눌러야 지워진다.
                분류를 지우면 거기 달린 할 일이 전부 미분류로 돌아가므로 확인을 한 번 받는다.
                모달까지 띄우지 않는 건 사이드바에서 자주 하는 작은 조작이라서다.
              */}
              {pendingDelete ? (
                <span className="flex shrink-0 items-center gap-1 pr-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onRemove(c);
                      setConfirming(null);
                    }}
                    className="rounded-full bg-danger px-2 py-0.5 text-[10px] text-white transition hover:bg-danger-deep"
                  >
                    지우기
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    aria-label="취소"
                    className="text-[10px] text-ink-faint transition hover:text-ink-soft"
                  >
                    취소
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(c.id)}
                  aria-label={`${c.name} 분류 지우기`}
                  title="분류 지우기"
                  className="mr-1 grid size-6 shrink-0 place-items-center rounded-full text-ink-faint opacity-0 transition focus-visible:opacity-100 hover:text-danger group-hover:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path
                      d="M4 7h16M9.5 4.5h5M6.5 7l.8 12.2h9.4L17.5 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        {adding && (
          <div className="px-1 pt-1">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                // 한글 조합 중의 Enter는 조합 확정용이라 그대로 받으면 안 된다.
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                } else if (e.key === "Escape") {
                  closeAdd();
                }
              }}
              onBlur={() => {
                // 아무것도 안 적고 바깥을 누르면 그냥 닫는다.
                if (!draft.trim()) closeAdd();
              }}
              placeholder="예) 운동"
              maxLength={CATEGORY_NAME_MAX}
              aria-label="새 분류 이름"
              className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
            />
            {error && <p className="px-1 pt-1 text-[11px] text-danger">{error}</p>}
          </div>
        )}

        {categories.length === 0 && !adding && (
          <p className="px-2 py-1.5 text-[11px] leading-relaxed text-ink-faint">
            + 를 눌러 분류를 만들어보세요
          </p>
        )}
      </div>
    </div>
  );
}
