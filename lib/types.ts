export type Task = {
  id: number;
  title: string;
  /** 'YYYY-MM-DD' 또는 마감 없음 */
  due_date: string | null;
  is_done: boolean;
  created_at: string;
  /**
   * 이모지 문자. null이면 📌.
   *
   * v1.5부터 사용자가 고르지 않는다 — 저장할 때 제목·분류를 보고 자동으로 정해진다.
   * v1.3까지 저장된 프리셋 이름('circle' 등)도 그대로 읽힌다(toIcon).
   */
  icon: string | null;
  /** v1.4에서 화면 사용을 중단했다. 예전 데이터 보존용으로만 남는다. */
  icon_color: string | null;
  /** 짧은 메모. null이면 메모 없음(빈 문자열은 저장하지 않는다) */
  memo: string | null;
  /** 사용자가 만든 분류. null이면 미분류 — '전체 보기'에서만 보인다. */
  category_id: number | null;
  /** 특별 일정 표시. 목록 최상단으로 올라가고 달력에서도 강조된다. */
  is_starred: boolean;
};

/** 새 Task 저장 시 사용자가 채우는 값. 나머지는 DB 기본값. */
export type NewTask = {
  title: string;
  due_date: string | null;
  /** 저장 직전에 autoIcon이 계산해 넣는다. */
  icon: string;
  /** 새로 저장하는 행은 항상 null이다. 컬럼만 남겨둔 상태(v1.4). */
  icon_color: string | null;
  memo: string | null;
  category_id: number | null;
  is_starred: boolean;
};

/** select에서 쓰는 컬럼 목록 — 한 곳에서만 관리한다. */
export const TASK_COLUMNS =
  "id, title, due_date, is_done, created_at, icon, icon_color, memo, category_id, is_starred";

/**
 * 어디서 읽었든 Task를 같은 모양으로 맞춘다.
 *
 * 특히 게스트(localStorage)에 이미 쌓여 있는 할 일은 새 필드가 아예 없다. 그대로 쓰면
 * is_starred가 undefined라 정렬·필터가 조용히 어긋나므로, 읽는 지점에서 한 번 통과시킨다.
 * coerceSettings와 같은 역할이다.
 *
 * 지워진 분류를 가리키는 category_id까지는 여기서 걸러내지 않는다 — 그건 분류 목록을
 * 함께 봐야 알 수 있고, 서버에서는 on delete set null이 이미 처리한다.
 */
export function coerceTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;

  if (typeof v.id !== "number" || typeof v.title !== "string") return null;

  return {
    id: v.id,
    title: v.title,
    due_date: typeof v.due_date === "string" ? v.due_date : null,
    is_done: v.is_done === true,
    created_at:
      typeof v.created_at === "string" ? v.created_at : new Date(0).toISOString(),
    icon: typeof v.icon === "string" ? v.icon : null,
    icon_color: typeof v.icon_color === "string" ? v.icon_color : null,
    memo: typeof v.memo === "string" && v.memo.length > 0 ? v.memo : null,
    category_id: typeof v.category_id === "number" ? v.category_id : null,
    is_starred: v.is_starred === true,
  };
}

export function coerceTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(coerceTask).filter((t): t is Task => t !== null);
}
