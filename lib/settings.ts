/**
 * 개인화 설정. 게스트는 브라우저 저장소, 로그인 상태는 서버에 보관한다.
 * Task 데이터와는 완전히 분리되어 있다.
 */

import type { CategoryFilter } from "@/lib/categories";
import { DEFAULT_FONT, FONTS, isFontId, type FontId } from "@/lib/fonts";

export const THEMES = [
  { id: "pink", label: "핑크", swatch: "#ecb9be" },
  { id: "lavender", label: "라벤더", swatch: "#bfb4e6" },
  { id: "mint", label: "민트", swatch: "#9ad6c0" },
  { id: "cream", label: "크림", swatch: "#e8cb92" },
  { id: "gray", label: "그레이", swatch: "#b9b9c4" },
  // 새 테마를 넣을 때 고칠 곳은 셋이다 — globals.css 블록, 이 배열, 그리고
  // settings_theme_check 제약. swatch는 그 테마의 --accent와 같은 값이어야 한다.
  { id: "blue", label: "블루", swatch: "#a5c9e9" },
  { id: "sage", label: "세이지", swatch: "#b3cbac" },
  { id: "coral", label: "코랄", swatch: "#f0b3a3" },
  { id: "mocha", label: "모카", swatch: "#c4aa9b" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type CalendarView = "month" | "week" | "day";

export const COUNTER_LABEL_MAX = 20;
export const PLANNER_NAME_MAX = 20;
export const DEFAULT_PLANNER_NAME = "my planner";

export type Settings = {
  /** 사이드바에 보이는 플래너 이름. 빈 값으로 저장하면 기본값으로 되돌린다. */
  planner_name: string;
  /**
   * 원본 비율 그대로 줄여 저장한 data URL. 없으면 기본 실루엣.
   * 원형 틀에서 어디를 보여줄지는 아래 profile_pos_* 가 정한다.
   */
  profile_image: string | null;
  /** 프로필 사진이 원형 틀에서 보일 위치(0~100%). 50이면 가운데. */
  profile_pos_x: number;
  profile_pos_y: number;
  theme: ThemeId;
  /** 화면 전체에 쓰는 글꼴. 테마와 같은 방식으로 data-font를 갈아끼운다. */
  font: FontId;
  calendar_view: CalendarView;
  /** 카운터 옆 배너 카드. 원본 비율 그대로 줄여 저장한 data URL. 없으면 placeholder. */
  banner_image: string | null;
  /** 배너가 2.5:1 틀에서 보일 위치(0~100%). 50이면 가운데. */
  banner_pos_x: number;
  banner_pos_y: number;
  /** 기념일 카운터의 기준 날짜('YYYY-MM-DD'). 없으면 비활성 안내. */
  counter_date: string | null;
  counter_label: string;
  /**
   * 분류 필터. calendar_view와 같은 성격의 '보기 상태'라서 여기 둔다.
   * 그 덕분에 게스트(localStorage)와 로그인(서버) 양쪽에 저장 경로가 이미 있다.
   * null이면 전체 보기.
   */
  filter_category_id: CategoryFilter;
};

/** 위치를 안 정했을 때의 기본값 — 가운데. */
export const CENTER = 50;

export const DEFAULT_SETTINGS: Settings = {
  planner_name: DEFAULT_PLANNER_NAME,
  profile_image: null,
  profile_pos_x: CENTER,
  profile_pos_y: CENTER,
  theme: "pink",
  font: DEFAULT_FONT,
  calendar_view: "month",
  banner_image: null,
  banner_pos_x: CENTER,
  banner_pos_y: CENTER,
  counter_date: null,
  counter_label: "시작한 날",
  filter_category_id: null,
};

export const SETTINGS_KEY = "my-planner:settings";

/**
 * 첫 페인트용 캐시.
 * 로그인 상태에서는 설정이 서버에 있어 불러오기 전까지 테마·글꼴을 알 수 없다.
 * 마지막으로 쓴 값만 따로 남겨두고 부팅 스크립트가 이걸 먼저 본다.
 */
export const THEME_CACHE_KEY = "my-planner:theme";
export const FONT_CACHE_KEY = "my-planner:font";

const THEME_IDS: string[] = THEMES.map((t) => t.id);
const FONT_IDS: string[] = FONTS.map((f) => f.id);

const asDataUrl = (v: unknown) =>
  typeof v === "string" && v.startsWith("data:image/") ? v : null;

const asText = (v: unknown, max: number, fallback: string) =>
  typeof v === "string" ? v.slice(0, max) : fallback;

/** 사진 위치는 0~100 사이 정수만 받는다. 그 밖의 값은 가운데로 떨어뜨린다. */
const asPercent = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(100, Math.max(0, Math.round(v)))
    : CENTER;

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
    profile_pos_x: asPercent(v.profile_pos_x),
    profile_pos_y: asPercent(v.profile_pos_y),
    theme: THEME_IDS.includes(v.theme as string) ? (v.theme as ThemeId) : DEFAULT_SETTINGS.theme,
    font: isFontId(v.font) ? v.font : DEFAULT_FONT,
    calendar_view:
      v.calendar_view === "week" || v.calendar_view === "month" || v.calendar_view === "day"
        ? v.calendar_view
        : DEFAULT_SETTINGS.calendar_view,
    banner_image: asDataUrl(v.banner_image),
    banner_pos_x: asPercent(v.banner_pos_x),
    banner_pos_y: asPercent(v.banner_pos_y),
    counter_date:
      typeof v.counter_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.counter_date)
        ? v.counter_date
        : null,
    counter_label: asText(v.counter_label, COUNTER_LABEL_MAX, DEFAULT_SETTINGS.counter_label),
    // 지워진 분류를 가리킬 수 있다. 그건 분류 목록을 함께 봐야 알 수 있어서
    // 화면(page.tsx)에서 목록과 대조해 걸러낸다.
    filter_category_id: typeof v.filter_category_id === "number" ? v.filter_category_id : null,
  };
}

export type SaveResult = { ok: true } | { ok: false; message: string };

/**
 * 첫 페인트 전에 <html data-theme>을 맞춰두는 인라인 스크립트.
 * 이게 없으면 새로고침할 때마다 기본 핑크가 한 프레임 보였다가 바뀐다.
 */
export const THEME_BOOT_SCRIPT = `
try{
  var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}");

  var ids=${JSON.stringify(THEME_IDS)};
  var t=localStorage.getItem(${JSON.stringify(THEME_CACHE_KEY)});
  if(ids.indexOf(t)<0){t=ids.indexOf(s.theme)>=0?s.theme:${JSON.stringify(DEFAULT_SETTINGS.theme)};}
  document.documentElement.dataset.theme=t;

  var fids=${JSON.stringify(FONT_IDS)};
  var f=localStorage.getItem(${JSON.stringify(FONT_CACHE_KEY)});
  if(fids.indexOf(f)<0){f=fids.indexOf(s.font)>=0?s.font:${JSON.stringify(DEFAULT_FONT)};}
  document.documentElement.dataset.font=f;
}catch(e){
  document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_SETTINGS.theme)};
  document.documentElement.dataset.font=${JSON.stringify(DEFAULT_FONT)};
}
`.trim();
