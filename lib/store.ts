"use client";

import {
  coerceSettings,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  type Settings,
} from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import {
  coerceCategories,
  type Category,
  type NewCategory,
} from "@/lib/categories";
import { coerceTask, coerceTasks, TASK_COLUMNS, type NewTask, type Task } from "@/lib/types";

/**
 * 할 일과 설정을 읽고 쓰는 통로.
 *
 * 게스트는 localStorage, 로그인 상태는 서버를 쓴다. 화면 쪽 코드가 둘을 구분하지
 * 않도록 같은 모양의 함수만 노출한다 — 게스트→로그인 전환(이관·병합)도 여기서만 다룬다.
 */
export type Store = {
  listTasks(): Promise<Task[]>;
  /** 마감일을 여러 개 고르면 한 번에 여러 건이 만들어진다. */
  addTasks(drafts: NewTask[]): Promise<Task[]>;
  updateTask(id: number, draft: NewTask): Promise<Task>;
  setDone(id: number, done: boolean): Promise<void>;
  /** 별표는 수정 모달을 거치지 않고 목록에서 바로 켜고 끄므로 setDone처럼 따로 둔다. */
  setStarred(id: number, starred: boolean): Promise<void>;
  removeTask(id: number): Promise<void>;
  listCategories(): Promise<Category[]>;
  addCategory(draft: NewCategory): Promise<Category>;
  /** 분류를 지워도 거기 달려 있던 할 일은 남는다 — 미분류로 돌아갈 뿐이다. */
  removeCategory(id: number): Promise<void>;
  loadSettings(): Promise<Settings>;
  saveSettings(next: Settings): Promise<void>;
};

const LOCAL_TASKS_KEY = "my-planner:tasks";
const LOCAL_CATEGORIES_KEY = "my-planner:categories";

function fail(message: string, error: { message: string }): never {
  throw new Error(`${message}: ${error.message}`);
}

/* ---------------------------------- 게스트 --------------------------------- */

/**
 * 게스트 할 일을 읽는 유일한 통로.
 *
 * 그대로 캐스팅하지 않고 coerceTasks를 반드시 거친다 — 예전에 저장된 항목에는
 * category_id·is_starred가 아예 없어서, undefined인 채로 흘러가면 정렬과 필터가
 * 조용히 어긋난다(무엇보다 is_starred가 undefined면 별표 정렬이 뒤죽박죽이 된다).
 */
function readLocalTasks(): Task[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_TASKS_KEY);
    return coerceTasks(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function writeLocalTasks(tasks: Task[]) {
  window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
}

/** 로컬은 시퀀스가 없으니 현재 최대값 + 1을 쓴다. */
function nextLocalId(rows: { id: number }[]) {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

function readLocalCategories(): Category[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_CATEGORIES_KEY);
    return coerceCategories(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function writeLocalCategories(rows: Category[]) {
  window.localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(rows));
}

export function readLocalSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? coerceSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function localTaskCount() {
  if (typeof window === "undefined") return 0;
  return readLocalTasks().length;
}

export function clearLocalData() {
  window.localStorage.removeItem(LOCAL_TASKS_KEY);
  window.localStorage.removeItem(LOCAL_CATEGORIES_KEY);
  window.localStorage.removeItem(SETTINGS_KEY);
}

const guestStore: Store = {
  async listTasks() {
    return readLocalTasks().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  async addTasks(drafts) {
    const tasks = readLocalTasks();
    let nextId = nextLocalId(tasks);
    const now = Date.now();

    const created: Task[] = drafts.map((draft, i) => ({
      id: nextId++,
      title: draft.title,
      due_date: draft.due_date,
      is_done: false,
      // 같은 밀리초로 몰리면 정렬이 뒤섞여서 1ms씩 벌려둔다.
      created_at: new Date(now + i).toISOString(),
      icon: draft.icon,
      icon_color: draft.icon_color,
      memo: draft.memo,
      category_id: draft.category_id,
      is_starred: draft.is_starred,
    }));

    writeLocalTasks([...created.slice().reverse(), ...tasks]);
    return created;
  },

  async updateTask(id, draft) {
    const next = readLocalTasks().map((t) => (t.id === id ? { ...t, ...draft } : t));
    writeLocalTasks(next);
    return next.find((t) => t.id === id)!;
  },

  async setDone(id, done) {
    writeLocalTasks(
      readLocalTasks().map((t) => (t.id === id ? { ...t, is_done: done } : t)),
    );
  },

  async setStarred(id, starred) {
    writeLocalTasks(
      readLocalTasks().map((t) => (t.id === id ? { ...t, is_starred: starred } : t)),
    );
  },

  async removeTask(id) {
    writeLocalTasks(readLocalTasks().filter((t) => t.id !== id));
  },

  async listCategories() {
    return readLocalCategories();
  },

  async addCategory(draft) {
    const rows = readLocalCategories();
    const created: Category = { id: nextLocalId(rows), ...draft };
    writeLocalCategories([...rows, created]);
    return created;
  },

  async removeCategory(id) {
    writeLocalCategories(readLocalCategories().filter((c) => c.id !== id));
    // 서버에서는 on delete set null이 해주는 일을 여기서는 직접 해야 한다.
    // 안 하면 없는 분류를 가리키는 할 일이 남아 어느 필터에도 안 걸린다.
    writeLocalTasks(
      readLocalTasks().map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
    );
  },

  async loadSettings() {
    return readLocalSettings();
  },

  async saveSettings(next) {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (e) {
      // 이미지까지 넣으면 저장소 용량(보통 5MB)에 걸릴 수 있다.
      const quota = e instanceof DOMException && e.name.includes("Quota");
      throw new Error(
        quota
          ? "브라우저 저장 공간이 부족해요. 로그인하면 서버에 저장돼요."
          : "설정을 저장하지 못했어요.",
      );
    }
  },
};

/* ---------------------------------- 서버 ---------------------------------- */

function createServerStore(userId: string): Store {
  return {
    async listTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) fail("할 일을 불러오지 못했어요", error);
      // 게스트 경로와 같은 모양으로 맞춰, 화면이 출처를 구분하지 않아도 되게 한다.
      return coerceTasks(data);
    },

    async addTasks(drafts) {
      // user_id는 컬럼 기본값 auth.uid()가 채운다. 여러 건도 한 번의 insert로 보낸다.
      const { data, error } = await supabase
        .from("tasks")
        .insert(drafts)
        .select(TASK_COLUMNS);
      if (error) fail("저장에 실패했어요", error);
      return coerceTasks(data);
    },

    async updateTask(id, draft) {
      const { data, error } = await supabase
        .from("tasks")
        .update(draft)
        .eq("id", id)
        .select(TASK_COLUMNS)
        .single();
      if (error) fail("저장에 실패했어요", error);
      const task = coerceTask(data);
      if (!task) throw new Error("저장한 내용을 다시 읽지 못했어요.");
      return task;
    },

    async setDone(id, done) {
      const { error } = await supabase
        .from("tasks")
        .update({ is_done: done })
        .eq("id", id);
      if (error) fail("완료 상태를 바꾸지 못했어요", error);
    },

    async setStarred(id, starred) {
      const { error } = await supabase
        .from("tasks")
        .update({ is_starred: starred })
        .eq("id", id);
      if (error) fail("별표를 바꾸지 못했어요", error);
    },

    async removeTask(id) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) fail("삭제하지 못했어요", error);
    },

    async listCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true });
      if (error) fail("분류를 불러오지 못했어요", error);
      return coerceCategories(data);
    },

    async addCategory(draft) {
      // user_id는 컬럼 기본값 auth.uid()가 채운다.
      const { data, error } = await supabase
        .from("categories")
        .insert(draft)
        .select("id, name, sort_order")
        .single();
      if (error) {
        // (user_id, name) 유니크 제약. 화면에서도 같은 검사를 하지만 다른 탭에서
        // 먼저 만들었을 수 있어서 여기서도 사람이 읽을 말로 바꿔준다.
        if (error.code === "23505") throw new Error("이미 있는 분류예요.");
        fail("분류를 만들지 못했어요", error);
      }
      const rows = coerceCategories([data]);
      if (rows.length === 0) throw new Error("분류를 만들지 못했어요.");
      return rows[0];
    },

    async removeCategory(id) {
      // tasks.category_id는 on delete set null이라 할 일은 미분류로 남는다.
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) fail("분류를 지우지 못했어요", error);
    },

    async loadSettings() {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) fail("설정을 불러오지 못했어요", error);
      // 첫 로그인이면 아직 줄이 없다.
      return data ? coerceSettings(data) : DEFAULT_SETTINGS;
    },

    async saveSettings(next) {
      const { error } = await supabase
        .from("settings")
        .upsert({ ...next, user_id: userId, updated_at: new Date().toISOString() });
      if (error) fail("설정을 저장하지 못했어요", error);
    },
  };
}

export function createStore(userId: string | null): Store {
  return userId ? createServerStore(userId) : guestStore;
}

/* ------------------------- 게스트 → 로그인 전환 처리 ------------------------- */

/**
 * 로컬에 쌓인 할 일을 서버로 옮긴다.
 * 서버가 비어 있던 계정이면 설정까지 함께 옮기고, 이미 쓰던 계정이면
 * 할 일만 덧붙인다(설정을 덮어쓰면 쓰던 테마·프로필이 날아간다).
 */
export async function migrateLocalToServer(
  userId: string,
  opts: { includeSettings: boolean },
) {
  const tasks = readLocalTasks();

  if (tasks.length > 0) {
    // 중복 판정은 하지 않고 단순 추가한다(PRD 6번).
    const rows = tasks.map((t) => ({
      user_id: userId,
      title: t.title,
      due_date: t.due_date,
      is_done: t.is_done,
      icon: t.icon,
      icon_color: t.icon_color,
      // 게스트 때 쓰던 컬럼이 나중에 생겼을 수 있으니 없으면 null로 채운다.
      // (readLocalTasks가 이미 coerceTasks를 거치므로 여기 오는 값은 항상 채워져 있다.)
      memo: t.memo ?? null,
      // 게스트가 만든 분류는 서버로 옮기지 않는다 — 로컬 id가 서버 id와 아무 관계가
      // 없어서 짝을 맞출 수 없다. 옮겨온 할 일은 미분류로 시작한다.
      category_id: null,
      is_starred: t.is_starred,
      created_at: t.created_at,
    }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) fail("할 일을 계정으로 옮기지 못했어요", error);
  }

  if (opts.includeSettings) {
    await createServerStore(userId).saveSettings(readLocalSettings());
  }

  clearLocalData();
}
