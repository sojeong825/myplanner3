/**
 * 개인화 설정. 로그인이 없으므로 서버가 아닌 브라우저 저장소에 보관한다.
 * Task 데이터와는 완전히 분리되어 있다.
 */

export const THEMES = [
  { id: "pink", label: "핑크", swatch: "#e5aab0" },
  { id: "lavender", label: "라벤더", swatch: "#ada0d9" },
  { id: "mint", label: "민트", swatch: "#7cc4ab" },
  { id: "cream", label: "크림", swatch: "#ddb673" },
  { id: "gray", label: "그레이", swatch: "#9797a4" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type CalendarView = "month" | "week";

export const COUNTER_LABEL_MAX = 20;
export const PLANNER_NAME_MAX = 20;
export const DEFAULT_PLANNER_NAME = "my planner";

export type Settings = {
  /** 사이드바에 보이는 플래너 이름. 빈 값으로 저장하면 기본값으로 되돌린다. */
  planner_name: string;
  /** 정사각형으로 줄여 저장한 data URL. 없으면 기본 실루엣. */
  profile_image: string | null;
  theme: ThemeId;
  calendar_view: CalendarView;
  /** 카운터 옆 배너 카드. 2.5:1로 줄여 저장한 data URL. 없으면 placeholder. */
  banner_image: string | null;
  /** 기념일 카운터의 기준 날짜('YYYY-MM-DD'). 없으면 비활성 안내. */
  counter_date: string | null;
  counter_label: string;
};

export const DEFAULT_SETTINGS: Settings = {
  planner_name: DEFAULT_PLANNER_NAME,
  profile_image: null,
  theme: "pink",
  calendar_view: "month",
  banner_image: null,
  counter_date: null,
  counter_label: "시작한 날",
};

export const SETTINGS_KEY = "my-planner:settings";

/**
 * 첫 페인트용 테마 캐시.
 * 로그인 상태에서는 설정이 서버에 있어 불러오기 전까지 테마를 알 수 없다.
 * 마지막으로 쓴 테마만 따로 남겨두고 부팅 스크립트가 이걸 먼저 본다.
 */
export const THEME_CACHE_KEY = "my-planner:theme";

const THEME_IDS: string[] = THEMES.map((t) => t.id);

const asDataUrl = (v: unknown) =>
  typeof v === "string" && v.startsWith("data:image/") ? v : null;

const asText = (v: unknown, max: number, fallback: string) =>
  typeof v === "string" ? v.slice(0, max) : fallback;

/**
 * localStorage에서 읽은 값과 서버 settings 행을 같은 모양으로 정규화한다.
 * 손상된 값이나 손으로 고친 값이 들어와도 기본값으로 떨어진다.
 */
export function coerceSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const v = raw as Partial<Settings>;
  return {
    planner_name:
      asText(v.planner_name, PLANNER_NAME_MAX, DEFAULT_PLANNER_NAME).trim() ||
      DEFAULT_PLANNER_NAME,
    profile_image: asDataUrl(v.profile_image),
    theme: THEME_IDS.includes(v.theme as string) ? (v.theme as ThemeId) : DEFAULT_SETTINGS.theme,
    calendar_view:
      v.calendar_view === "week" || v.calendar_view === "month"
        ? v.calendar_view
        : DEFAULT_SETTINGS.calendar_view,
    banner_image: asDataUrl(v.banner_image),
    counter_date:
      typeof v.counter_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.counter_date)
        ? v.counter_date
        : null,
    counter_label: asText(v.counter_label, COUNTER_LABEL_MAX, DEFAULT_SETTINGS.counter_label),
  };
}

export type SaveResult = { ok: true } | { ok: false; message: string };

/**
 * 첫 페인트 전에 <html data-theme>을 맞춰두는 인라인 스크립트.
 * 이게 없으면 새로고침할 때마다 기본 핑크가 한 프레임 보였다가 바뀐다.
 */
export const THEME_BOOT_SCRIPT = `
try{
  var ids=${JSON.stringify(THEME_IDS)};
  var t=localStorage.getItem(${JSON.stringify(THEME_CACHE_KEY)});
  if(ids.indexOf(t)<0){
    var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}");
    t=ids.indexOf(s.theme)>=0?s.theme:${JSON.stringify(DEFAULT_SETTINGS.theme)};
  }
  document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_SETTINGS.theme)}}
`.trim();
