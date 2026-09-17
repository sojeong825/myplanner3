/**
 * 할 일 아이콘.
 *
 * v1.3까지는 인라인 SVG를 직접 그렸다. 도형 다섯 개일 때는 괜찮았지만 '회의·운동·생일'
 * 같은 뜻을 담으려니 패스를 손으로 그리는 방식이 한계였다 — 아령이 화살표처럼 보이고
 * 케이크가 뭉개졌다. 그래서 v1.4부터 **이모지를 그대로 저장하고 그대로 그린다**.
 *
 * 그 대가로 색은 포기했다. 이모지는 CSS로 tint할 수 없다. 어차피 이모지가 색과 뜻을
 * 다 가지고 있어서 별도 색상 선택은 중복이었고, 그래서 모달에서 색상 항목을 뺐다.
 * (`tasks.icon_color` 컬럼은 지우지 않고 남겨뒀다 — 되돌리기 쉽게.)
 *
 * 아이콘은 기본적으로 저장할 때 제목·분류를 보고 자동으로 정해진다(`lib/autoIcon.ts`).
 * 다만 자동이 늘 맞을 수는 없어서, 모달에서 직접 고르거나 아무 이모지나 입력할 수도 있다.
 * 자동은 시작값일 뿐 잠금이 아니다.
 */

/**
 * 모달에서 고를 수 있는 이모지. 한 줄에 여섯 개씩 떨어진다.
 *
 * 이 목록이 전부는 아니다 — 모달에서 직접 입력하면 어떤 이모지든 저장된다.
 * 여기 있는 건 '자주 쓰는 것을 한 번에 고르는' 지름길이다.
 */
export const TASK_EMOJIS: { emoji: string; label: string }[] = [
  { emoji: "📌", label: "일정" },
  { emoji: "⭐", label: "별" },
  { emoji: "❤️", label: "하트" },
  { emoji: "✅", label: "완료" },
  { emoji: "❗", label: "중요" },
  { emoji: "🔥", label: "급함" },

  { emoji: "💼", label: "업무" },
  { emoji: "📋", label: "서류" },
  { emoji: "💻", label: "컴퓨터" },
  { emoji: "📊", label: "보고" },
  { emoji: "📁", label: "프로젝트" },
  { emoji: "📝", label: "메모" },

  { emoji: "💬", label: "회의" },
  { emoji: "🤝", label: "미팅" },
  { emoji: "📞", label: "전화" },
  { emoji: "✉️", label: "메일" },
  { emoji: "💌", label: "편지" },
  { emoji: "🎉", label: "축하" },

  { emoji: "☕", label: "커피" },
  { emoji: "🍔", label: "식사" },
  { emoji: "🎂", label: "생일" },
  { emoji: "🎁", label: "선물" },
  { emoji: "🛒", label: "쇼핑" },
  { emoji: "🏠", label: "집" },

  { emoji: "💪", label: "운동" },
  { emoji: "🏃", label: "달리기" },
  { emoji: "🏥", label: "병원" },
  { emoji: "📚", label: "공부" },
  { emoji: "✈️", label: "여행" },
  { emoji: "💰", label: "돈" },
];

export const DEFAULT_ICON = "📌";

/**
 * 직접 입력한 글자에서 이모지 하나만 뽑아낸다.
 *
 * 붙여넣기로 문장이 통째로 들어오거나 이모지를 여러 개 넣는 일이 잦아서, 맨 앞
 * 한 글자만 남긴다. Intl.Segmenter를 쓰는 이유는 이모지 하나가 코드 유닛 여러 개로
 * 이루어져 있어서다 — slice(0,1)로 자르면 👨‍👩‍👧 같은 건 조각나서 깨진다.
 */
export function firstGrapheme(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = seg.segment(text)[Symbol.iterator]().next();
    return first.done ? null : first.value.segment;
  }
  // Segmenter가 없는 구형 브라우저 — 코드포인트 단위로라도 자른다.
  return [...text][0] ?? null;
}

/**
 * v1.3 이전에 저장된 프리셋 이름 → 이모지.
 *
 * 컬럼은 그대로 두고 값만 바뀌었으므로, 이미 저장된 행은 읽을 때 여기서 옮겨준다.
 * 데이터를 일괄 수정하지 않는 이유는 기존 방식(icon·memo 추가)과 같다 —
 * 읽는 쪽이 감당하면 마이그레이션이 컬럼 추가로 끝난다.
 */
const LEGACY_ICONS: Record<string, string> = {
  circle: "📌",
  star: "⭐",
  heart: "❤️",
  triangle: "🔺",
  square: "🟦",
  // v1.3에서 잠깐 쓰였던 이름들도 같이 옮긴다.
  document: "📋",
  chat: "💬",
  folder: "📁",
  cup: "☕",
  dumbbell: "💪",
  cake: "🎂",
  cross: "🏥",
  book: "📚",
  bag: "🛒",
  pin: "📌",
};

/**
 * 저장된 값을 화면에 그릴 이모지로 바꾼다.
 *
 * 팔레트에 없는 이모지가 들어와도 그대로 통과시킨다 — 나중에 직접 입력을 열어주더라도
 * 이 함수는 고칠 필요가 없다.
 */
export function toIcon(value: string | null | undefined): string {
  if (!value) return DEFAULT_ICON;
  return LEGACY_ICONS[value] ?? value;
}

type Props = {
  icon: string | null;
  /** 완료된 항목은 흐리고 색을 뺀다. 이모지는 색을 바꿀 수 없어서 filter로 처리한다. */
  done?: boolean;
  /** 글자 크기 클래스. 이모지는 폰트 글리프라 width가 아니라 font-size로 키운다. */
  className?: string;
};

export function TaskIcon({ icon, done = false, className = "text-[13px]" }: Props) {
  return (
    <span
      aria-hidden="true"
      // w-[1.25em]: 이모지마다 글리프 폭이 달라서, 고정 폭을 주지 않으면 목록의
      // 제목 시작점이 줄마다 어긋난다. leading-none은 줄 높이가 들쭉날쭉해지는 걸 막는다.
      className={`emoji inline-flex w-[1.25em] shrink-0 justify-center leading-none ${
        done ? "opacity-40 grayscale" : ""
      } ${className}`}
    >
      {toIcon(icon)}
    </span>
  );
}

/* ------------------------------- 별표 표시 -------------------------------- */

/**
 * 별표는 할 일 아이콘이 아니라 UI 컨트롤이라 이모지가 아닌 SVG로 남긴다.
 * 테마 색(--accent)을 따라가야 하고, 켜짐/꺼짐을 채움 vs 테두리로 보여야 하는데
 * 이모지로는 둘 다 못 한다.
 */
const STAR_PATH =
  "M12 3.4l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.7l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z";

/**
 * 별표를 켜고 끄는 버튼. 꺼져 있으면 테두리만 있는 빈 별이다.
 *
 * 별은 **켜고 끄는 자리에만** 있다. 켜진 일정을 목록·달력에서 알아보는 건 형광펜
 * (globals.css의 `.marker`)이 맡는다. 한때 제목 앞에 ★을 붙였는데, 이미 일정마다
 * 이모지가 있어서 작은 글자 옆에 기호가 둘씩 늘어서면 알아보기 어려웠다.
 */
export function StarButton({
  starred,
  onToggle,
  className = "size-5",
  iconClassName = "size-3.5",
}: {
  starred: boolean;
  onToggle: () => void;
  /** 버튼(누를 수 있는 영역) 크기. */
  className?: string;
  /**
   * 별 자체의 크기. 버튼 크기와 따로 받는 이유는 둘이 늘 같은 비율이 아니어서다 —
   * 목록에서는 누르기 편하게 영역만 넓히고, 모달에서는 별을 크게 보여준다.
   */
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // 행 전체가 모달을 여는 버튼이라, 별표 클릭이 거기로 새지 않게 막는다.
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={starred}
      aria-label={starred ? "특별 일정 해제" : "특별 일정으로 표시"}
      title={starred ? "특별 일정 해제" : "특별 일정으로 표시"}
      className={`grid shrink-0 cursor-pointer place-items-center rounded-full transition hover:bg-soft ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={iconClassName}
        fill={starred ? "var(--accent)" : "none"}
        stroke={starred ? "none" : "currentColor"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d={STAR_PATH} />
      </svg>
    </button>
  );
}

/**
 * 삭제 버튼. 보기 모달과 수정 모달이 같은 모양을 쓰도록 여기 둔다.
 *
 * 평소 색은 옆에 있는 별과 같은 톤(--ink-faint)이다. 나란히 놓인 두 버튼의 색이
 * 다르면 그것만으로 시선이 한쪽에 쏠린다. 위험 신호는 **누른 뒤**가 맡는다 —
 * hover에서 빨강으로 바뀌고, 확인 창의 '삭제하기'는 그대로 빨강이다.
 */
export function TrashButton({
  onClick,
  className = "size-9 text-ink-faint",
  iconClassName = "size-5",
}: {
  onClick: () => void;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="일정 삭제"
      title="삭제"
      className={`grid shrink-0 cursor-pointer place-items-center rounded-full transition hover:bg-danger/10 hover:text-danger ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={iconClassName}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M4 7h16M9.5 4.5h5M6.5 7l.8 12.2h9.4L17.5 7M10 10.5v6M14 10.5v6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/* ------------------------------- 완료 체크 -------------------------------- */

/**
 * 아이콘 자리에 겹쳐 둔 완료 체크박스.
 *
 * 달력이나 '다가오는 일정'에서도 모달을 열지 않고 완료를 바꿀 수 있어야 한다.
 * 그렇다고 좁은 칸에 체크박스 자리를 늘 비워두면 아이콘과 나란히 두 칸을 먹는다.
 * 그래서 같은 자리에 겹쳐두고, 마우스를 올린 동안에만 체크박스가 보인다.
 *
 * 쓰는 쪽 항목에 `group/task`가 있어야 하고, 그 항목은 <button>이면 안 된다 —
 * 버튼 안에 버튼을 넣을 수 없다. 달력 칸과 같은 방식으로 div role="button"을 쓸 것.
 */
export function TaskCheck({
  icon,
  done,
  onToggle,
  iconClassName = "text-[13px]",
  boxClassName = "size-4",
}: {
  icon: string | null;
  done: boolean;
  onToggle: () => void;
  iconClassName?: string;
  boxClassName?: string;
}) {
  const label = done ? "완료 취소" : "완료 표시";

  return (
    <span className="relative inline-flex shrink-0">
      <TaskIcon
        icon={icon}
        done={done}
        className={`${iconClassName} transition group-hover/task:opacity-0`}
      />
      <button
        type="button"
        // 항목을 누르면 모달이 열린다. 체크는 거기까지 올라가면 안 된다.
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={label}
        title={label}
        className="absolute inset-0 grid cursor-pointer place-items-center opacity-0 transition group-hover/task:opacity-100"
      >
        <span
          className={`grid ${boxClassName} place-items-center rounded-[5px] border transition ${
            done ? "border-accent bg-accent" : "border-soft-deep bg-card"
          }`}
        >
          {done && (
            <svg
              viewBox="0 0 24 24"
              className="size-2.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>
    </span>
  );
}
