"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_GROUPS, searchEmojis, type EmojiItem } from "@/lib/emojiData";
import { firstGrapheme, TaskIcon } from "@/lib/icons";

type Props = {
  /** 지금 붙어 있는 이모지. 격자에서 이게 강조된다. */
  value: string;
  /** 자동으로 정해진 상태인지. 그럴 때만 '자동으로 되돌리기'가 필요 없다. */
  isAuto: boolean;
  onPick: (emoji: string) => void;
  onAuto: () => void;
  onClose: () => void;
};

/**
 * 이모지 선택기. OS 이모지 판(Win + .)과 같은 꼴 — 위에 검색, 아래에 분류별 격자다.
 *
 * 외부 패키지를 쓰지 않는다. 이모지 라이브러리는 수천 개 항목과 영어 키워드를 함께
 * 싣고 오는데, 정작 '생일'로 검색하면 아무것도 안 나온다. 목록은 lib/emojiData.ts에
 * 직접 들고 있고 검색어도 한국어다.
 *
 * 목록에 없는 이모지는 맨 아래 칸에 직접 넣는다 — 238개로 세상 모든 이모지를 덮을 수는 없다.
 */
export default function EmojiPicker({ value, isAuto, onPick, onAuto, onClose }: Props) {
  const [query, setQuery] = useState("");
  /** 탭으로 고른 분류. 검색 중에는 무시된다(검색은 분류를 가로질러 찾는다). */
  const [groupId, setGroupId] = useState(EMOJI_GROUPS[0].id);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // 열리면 바로 칠 수 있게 검색칸에 커서를 둔다.
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // 바깥을 누르거나 Esc를 누르면 닫는다.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      // 모달 전체가 Esc를 듣고 있어서, 여기서 멈추지 않으면 모달까지 같이 닫힌다.
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    // capture 단계에서 잡아야 모달의 window 리스너보다 먼저 온다.
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  const hits = searchEmojis(query);
  const shown: EmojiItem[] =
    hits ?? EMOJI_GROUPS.find((g) => g.id === groupId)!.items;

  return (
    <div
      ref={wrapRef}
      role="dialog"
      aria-label="아이콘 고르기"
      // 모달 안에 뜨는 팝오버라 z-index를 모달보다 높게 둔다.
      className="absolute left-0 top-[calc(100%+6px)] z-[70] w-[300px] rounded-xl border border-line bg-card p-2.5 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
    >
      <div className="flex items-center gap-2">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // 한글 조합 중 Enter는 조합 확정용이라 그대로 받으면 안 된다.
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              // 검색 결과가 하나라도 있으면 Enter로 첫 번째를 고른다.
              if (shown.length > 0) onPick(shown[0].e);
            }
          }}
          placeholder="이모지 검색 (예: 생일, 운동)"
          aria-label="이모지 검색"
          className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[12px] outline-none placeholder:text-ink-faint focus:border-accent"
        />
        {!isAuto && (
          <button
            type="button"
            onClick={onAuto}
            title="제목과 분류에 맞춰 자동으로 정하게 되돌립니다"
            className="shrink-0 whitespace-nowrap text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
          >
            자동
          </button>
        )}
      </div>

      {/* 검색 중에는 분류 탭을 숨긴다 — 검색은 분류를 가로질러 찾으므로 탭이 무의미하다. */}
      {hits === null && (
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {EMOJI_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(g.id)}
              aria-pressed={groupId === g.id}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] transition ${
                groupId === g.id
                  ? "bg-accent text-white"
                  : "bg-canvas text-ink-soft hover:text-ink"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-1.5 h-[176px] overflow-y-auto">
        {shown.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-ink-faint">
            찾는 이모지가 없어요. 아래에 직접 넣어보세요
          </p>
        ) : (
          <div role="listbox" aria-label="이모지" className="grid grid-cols-7 gap-0.5">
            {shown.map((it) => (
              <button
                key={it.e}
                type="button"
                role="option"
                aria-selected={value === it.e}
                aria-label={it.k}
                title={it.k}
                onClick={() => onPick(it.e)}
                className={`grid aspect-square place-items-center rounded-lg transition ${
                  value === it.e ? "bg-soft ring-1 ring-accent" : "hover:bg-soft"
                }`}
              >
                <TaskIcon icon={it.e} className="text-[19px]" />
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="mt-2 flex items-center gap-2 border-t border-line pt-2">
        <span className="shrink-0 text-[11px] text-ink-soft">직접 넣기</span>
        <input
          value={value}
          onChange={(e) => {
            // 문장을 붙여넣거나 여러 개를 넣어도 맨 앞 한 글자만 남긴다.
            const first = firstGrapheme(e.target.value);
            if (first) onPick(first);
          }}
          placeholder="🐶"
          aria-label="이모지 직접 입력"
          className="emoji w-14 rounded-lg border border-line bg-canvas px-2 py-1 text-center text-[15px] outline-none focus:border-accent"
        />
        <span className="text-[10px] leading-snug text-ink-faint">
          Win + . 로 이모지 판을 열 수 있어요
        </span>
      </label>
    </div>
  );
}
