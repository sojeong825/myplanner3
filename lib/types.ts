export type Task = {
  id: number;
  title: string;
  /** 'YYYY-MM-DD' 또는 마감 없음 */
  due_date: string | null;
  is_done: boolean;
  created_at: string;
  /** 프리셋 키. null이면 circle로 표시(기존 데이터 호환) */
  icon: string | null;
  /** HEX 문자열. null이면 현재 테마의 --accent로 표시 */
  icon_color: string | null;
  /** 짧은 메모. null이면 메모 없음(빈 문자열은 저장하지 않는다) */
  memo: string | null;
};

/** 새 Task 저장 시 사용자가 채우는 값. 나머지는 DB 기본값. */
export type NewTask = {
  title: string;
  due_date: string | null;
  icon: string;
  icon_color: string;
  memo: string | null;
};

/** select에서 쓰는 컬럼 목록 — 한 곳에서만 관리한다. */
export const TASK_COLUMNS =
  "id, title, due_date, is_done, created_at, icon, icon_color, memo";
