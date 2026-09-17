"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_GROUPS, searchEmojis, type EmojiItem } from "@/lib/emojiData";
import { firstGrapheme, TaskIcon } from "@/lib/icons";

type Props = {
  /** 지금 붙어 있는 이모지. 격자에서 이게 강조된다. */
  value: string;
  /** 자동으로 정해진 상태인지. 그럴 때만 '자동' 버튼을 감춘다. */
  isAuto: boolean;
  onPick: (emoji: string) => void;
  onAuto: () => void;
  onClose: () => void;
};

/** 분류 탭에 쓰는 대표 이모지. 글자 이름은 탭 아래 제목이 맡는다. */
const GROUP_ICON: Record<string, string> = {
  often: "🕘",
  face: "😀",
  person: "🏃",
  work: "💼",
  food: "🍔",
  life: "🏠",
  symbol: "🔵",
};

/**
 * 이모지 선택기. OS 이모지 판(Win + .)과 같은 꼴이다.
 *
 * 화면은 위에서부터 **검색 / 분류 / 격자 / 직접 넣기** 네 칸이고, 칸마다 선으로
 * 끊어 둔다. 한 덩어리로 붙여놨더니 어디까지가 검색이고 어디부터가 목록인지
 * 알아보기 어려웠다.
 *
 * 분류 탭은 글자가 아니라 아이콘이다. 글자로 두면 일곱 개가 한 줄에 안 들어가
 * 가로 스크롤바가 생기는데, 그 막대가 화면에서 가장 눈에 띄는 것이 돼버렸다.
 * 대신 고른 분류의 이름을 격자 위에 적어 무엇을 보고 있는지 분명히 한다.
 *
 * 목록에 없는 이모지는 맨 아래 칸에 직접 넣는다 — 238개로 전부를 덮을 수는 없다.
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
  const group = EMOJI_GROUPS.find((g) => g.id === groupId)!;
  const shown: EmojiItem[] = hits ?? group.items;

  return (
    <div
      ref={wrapRef}
      role="dialog"
      aria-label="아이콘 고르기"
      // 모달 안에 뜨는 팝오버라 z-index를 모달보다 높게 둔다.
      // 폰에서는 320px이 화면을 넘는다. 모달 여백만큼 빼고 화면 안에 들어오게 둔다.
      className="absolute left-0 top-[calc(100%+6px)] z-[70] w-[min(320px,calc(100vw-4rem))] overflow-hidden rounded-xl border border-line bg-card shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
    >
      {/* ── 검색 ── */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 text-ink-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" strokeLinecap="round" />
        </svg>

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
          placeholder="생일, 운동, 회의…"
          aria-label="이모지 검색"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="검색어 지우기"
            className="shrink-0 text-ink-faint transition hover:text-ink-soft"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── 분류 ── 검색 중에는 감춘다. 검색은 분류를 가로질러 찾으므로 탭이 무의미하다. */}
      {hits === null && (
        <div className="flex border-b border-line px-1.5 py-1.5">
          {EMOJI_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(g.id)}
              aria-pressed={groupId === g.id}
              aria-label={g.label}
              title={g.label}
              className={`grid flex-1 place-items-center rounded-lg py-1.5 transition ${
                groupId === g.id ? "bg-soft" : "hover:bg-canvas"
              }`}
            >
              <TaskIcon
                icon={GROUP_ICON[g.id]}
                // 고르지 않은 탭은 흐리게 — 일곱 개가 똑같이 진하면 어느 게 켜졌는지 안 보인다.
                className={`text-[15px] ${groupId === g.id ? "" : "opacity-45"}`}
              />
            </button>
          ))}
        </div>
      )}

      {/* ── 격자 ── */}
      <div className="px-3 pb-2 pt-2">
        <p className="pb-1.5 text-[11px] text-ink-faint">
          {hits === null ? group.label : `'${query.trim()}' 검색 결과 ${hits.length}개`}
        </p>

        <div className="h-[168px] overflow-y-auto">
          {shown.length === 0 ? (
            <p className="py-12 text-center text-[12px] leading-relaxed text-ink-faint">
              찾는 이모지가 없어요
              <br />
              아래에 직접 넣어보세요
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
      </div>

      {/* ── 직접 넣기 ── */}
      <div className="flex items-center gap-2 border-t border-line bg-canvas px-3 py-2">
        <input
          value={value}
          onChange={(e) => {
            // 문장을 붙여넣거나 여러 개를 넣어도 맨 앞 한 글자만 남긴다.
            const first = firstGrapheme(e.target.value);
            if (first) onPick(first);
          }}
          placeholder="🐶"
          aria-label="이모지 직접 입력"
          title="Win + . 로 이모지 판을 열 수 있어요"
          className="emoji w-11 shrink-0 rounded-lg border border-line bg-card px-1 py-1 text-center text-[15px] outline-none focus:border-accent"
        />
        <span className="min-w-0 flex-1 text-[10px] leading-snug text-ink-faint">
          Win + . 로 이모지 판을 열 수 있어요
        </span>

        {!isAuto && (
          <button
            type="button"
            onClick={onAuto}
            title="제목과 분류에 맞춰 자동으로 정하게 되돌립니다"
            className="shrink-0 whitespace-nowrap rounded-full border border-line bg-card px-2.5 py-1 text-[11px] text-ink-soft transition hover:text-ink"
          >
            자동으로
          </button>
        )}
      </div>
    </div>
  );
}
