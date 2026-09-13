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
 * v1.5에서는 고르는 팔레트도 없앴다. 아이콘은 저장할 때 제목·분류로 자동 결정된다
 * (`lib/autoIcon.ts`). 그래서 이 파일에는 '그리는 법'만 남고 '고를 목록'은 없다.
 */

export const DEFAULT_ICON = "📌";

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

/** 켜진 항목 옆에 붙는 읽기 전용 표식. 색은 반드시 --accent를 따라간다. */
export function StarMark({ className = "size-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} shrink-0`}
      fill="var(--accent)"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

/** 별표를 켜고 끄는 버튼. 꺼져 있으면 테두리만 있는 빈 별이다. */
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
