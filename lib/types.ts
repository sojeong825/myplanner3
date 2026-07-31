export type Task = {
  id: number;
  title: string;
  /** 'YYYY-MM-DD' 또는 마감 없음 */
  due_date: string | null;
  is_done: boolean;
  created_at: string;
};

/** 새 Task 저장 시 사용자가 채우는 값. 나머지는 DB 기본값. */
export type NewTask = {
  title: string;
  due_date: string | null;
};
