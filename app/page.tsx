"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthModal from "@/components/AuthModal";
import BannerCard from "@/components/BannerCard";
import Calendar from "@/components/Calendar";
import CounterCard from "@/components/CounterCard";
import DaySheet from "@/components/DaySheet";
import MergePrompt from "@/components/MergePrompt";
import ScheduleCard from "@/components/ScheduleCard";
import SettingsModal from "@/components/SettingsModal";
import Sidebar from "@/components/Sidebar";
import TaskDetail from "@/components/TaskDetail";
import TaskList from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import TaskSearch from "@/components/TaskSearch";
import {
  matchesFilter,
  type Category,
  type CategoryFilter,
} from "@/lib/categories";
import { addDays, addMonthsKey, diffDays, todayKey, type DateKey } from "@/lib/date";
import type { Reflection } from "@/lib/reflections";
import type { FontId } from "@/lib/fonts";
import type { CalendarView, Settings, ThemeId } from "@/lib/settings";
import {
  clearLocalData,
  createStore,
  localTaskCount,
  migrateLocalToServer,
} from "@/lib/store";
import type { NewTask, Task } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import { useNotifications } from "@/lib/useNotifications";
import { useSettings } from "@/lib/useSettings";

/** '다가오는 일정'에 띄울 범위. 오늘부터 이 일수 안에 마감인 것만 보여준다. */
const UPCOMING_DAYS = 10;

/** 마감일 오름차순, 마감 없는 항목은 뒤로. 같으면 최근 등록 순. */
function byDueThenCreated(a: Task, b: Task) {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  // 같은 날이면 시간이 이른 것부터. 시간을 안 정한 건 그날의 맨 뒤로 보낸다 —
  // '몇 시까지'가 있는 일을 먼저 보는 게 자연스럽다.
  if (a.due_time !== b.due_time) {
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time < b.due_time ? -1 : 1;
  }
  return a.created_at < b.created_at ? 1 : -1;
}

/**
 * 별표를 맨 위로 끌어올리는 래퍼. 같은 그룹 안에서는 넘겨받은 순서를 그대로 쓴다.
 * 목록마다 정렬 기준이 다르지만(마감 오름차순/내림차순) '별표가 먼저'는 공통이라
 * 각 비교 함수에 조건을 심지 않고 여기서 한 번만 씌운다.
 */
function starredFirst(cmp: (a: Task, b: Task) => number) {
  return (a: Task, b: Task) => {
    if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
    return cmp(a, b);
  };
}

/**
 * 같은 날짜 안에서는 시간까지 본다 — byDueThenCreated와 같은 규칙을 쓴다.
 * 지난 일정은 최근에 지난 것부터 보므로 날짜만 뒤집는다.
 */
const byDueAsc = (a: Task, b: Task) =>
  a.due_date === b.due_date ? byDueThenCreated(a, b) : a.due_date! < b.due_date! ? -1 : 1;

const byDueDesc = (a: Task, b: Task) =>
  a.due_date === b.due_date ? byDueThenCreated(a, b) : a.due_date! < b.due_date! ? 1 : -1;

const message = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

/** 폰 아래쪽 탭 하나. 아이콘 + 이름을 세로로 쌓는 흔한 모양. */
function MobileTab({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition ${
        active ? "text-accent-deep" : "text-ink-faint"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
      >
        {children}
      </svg>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

export default function Page() {
  // 날짜에 의존하는 렌더는 하이드레이션 이후로 미룬다.
  const [today, setToday] = useState<DateKey | null>(null);
  /** 달력이 보고 있는 기준 날짜. 월간이면 이 날짜의 달, 주간이면 이 날짜가 속한 주. */
  const [anchor, setAnchor] = useState<DateKey | null>(null);

  const { session, ready, userId, email, signIn, signUp, signOut, changePassword } =
    useAuth();
  const store = useMemo(() => createStore(userId), [userId]);
  const { settings, setSettings, update } = useSettings(store, ready);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  /** null이면 추가 모드, Task가 담기면 그 항목 수정 모드 */
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  /**
   * 보기 모달에 떠 있는 일정의 id. 일정을 누르면 수정 모달이 아니라 여기부터 연다 —
   * 내용만 확인하려다 모르는 새 값을 건드리는 일을 막는다.
   *
   * Task를 통째로 담지 않고 id만 담는 이유는, 모달이 떠 있는 동안 별표를 켜면
   * 담아둔 사본은 옛날 값 그대로라 화면이 따라 바뀌지 않기 때문이다.
   * 목록에서 매번 찾아 쓰면 항상 최신이고, 그 일정이 지워지면 저절로 닫힌다.
   */
  const [viewingId, setViewingId] = useState<number | null>(null);
  /** 달력에서 고른 날짜 칸. '+ 일정 추가'가 이 날짜로 채워진다. */
  const [selectedDate, setSelectedDate] = useState<DateKey | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** 좁은 화면에서 사이드바를 서랍으로 열었는지. 넓은 화면에서는 쓰이지 않는다. */
  const [navOpen, setNavOpen] = useState(false);
  /**
   * 좁은 화면에서 달력 칸을 눌러 연 '그날 목록'. null이면 닫힘.
   * 넓은 화면에서는 칸에 제목이 그대로 보이므로 이 시트가 뜰 일이 없다.
   */
  const [daySheetKey, setDaySheetKey] = useState<DateKey | null>(null);
  /**
   * 폰에서 아래 탭으로 오가는 화면. 한 화면에 달력과 할 일을 같이 쌓으면 달력이
   * 작아지고 스크롤만 길어진다. 넓은 화면에서는 둘 다 한꺼번에 보이므로 쓰이지 않는다.
   */
  const [mobileTab, setMobileTab] = useState<"calendar" | "tasks">("calendar");
  /** 폰 머리줄의 돋보기로 여는 검색. 넓은 화면에서는 본문에 늘 떠 있다. */
  const [searchOpen, setSearchOpen] = useState(false);
  /** 로그인했는데 서버에도 로컬에도 데이터가 있어 합칠지 물어야 하는 상태 */
  const [mergeCount, setMergeCount] = useState<number | null>(null);

  /** 직전에 로그인 상태였는지 — 게스트→로그인 전환 순간만 잡아낸다. */
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const key = todayKey();
    setToday(key);
    setAnchor(key);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // 분류는 할 일을 그릴 때 이름이 필요하므로 함께 받는다. 회고는 보기 모달에서 쓴다.
      const [nextTasks, nextCategories, nextReflections] = await Promise.all([
        store.listTasks(),
        store.listCategories(),
        store.listReflections(),
      ]);
      setTasks(nextTasks);
      setCategories(nextCategories);
      setReflections(nextReflections);
      setError(null);
    } catch (e) {
      setError(message(e, "할 일을 불러오지 못했어요."));
    } finally {
      setLoading(false);
    }
  }, [store]);

  // 게스트 → 로그인 전환 시 로컬 데이터를 어떻게 할지 먼저 정한다.
  useEffect(() => {
    if (!ready) return;

    const before = prevUserId.current;
    prevUserId.current = userId;

    const justSignedIn = before === null && userId !== null;
    if (!justSignedIn || !userId) {
      void reload();
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [serverTasks, serverCategories, serverReflections] = await Promise.all([
          store.listTasks(),
          store.listCategories(),
          store.listReflections(),
        ]);
        setCategories(serverCategories);
        setReflections(serverReflections);
        const localCount = localTaskCount();

        if (localCount === 0) {
          setTasks(serverTasks);
        } else if (serverTasks.length === 0) {
          // 처음 쓰는 계정 — 쓰던 내용이 그대로 이어지도록 설정까지 옮긴다.
          await migrateLocalToServer(userId, { includeSettings: true });
          setTasks(await store.listTasks());
          setSettings(await store.loadSettings());
        } else {
          // 이미 데이터가 있는 계정 — 서버 것을 먼저 보여주고 합칠지 묻는다.
          setTasks(serverTasks);
          setMergeCount(localCount);
        }
        setError(null);
      } catch (e) {
        setError(message(e, "계정 데이터를 불러오지 못했어요."));
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, userId, store, reload, setSettings]);

  const acceptMerge = useCallback(async () => {
    if (!userId) return;
    setMergeCount(null);
    setLoading(true);
    try {
      await migrateLocalToServer(userId, { includeSettings: false });
      setTasks(await store.listTasks());
    } catch (e) {
      setError(message(e, "합치지 못했어요."));
    } finally {
      setLoading(false);
    }
  }, [userId, store]);

  const declineMerge = useCallback(() => {
    // 거절하면 로컬 게스트 데이터는 버린다.
    clearLocalData();
    setMergeCount(null);
  }, []);

  /**
   * 할 일 추가. 날짜를 주면 그 날짜가 미리 골라진 채로 열린다 —
   * 달력 칸을 누르면 여기로 온다(노션 달력과 같은 동작).
   */
  const openAdd = useCallback((date: DateKey | null) => {
    setSelectedDate(date);
    setEditingTask(null);
    setModalOpen(true);
  }, []);

  /** 일정을 눌렀을 때 — 곧장 고치지 않고 보기 모달부터 연다. */
  const openView = useCallback((task: Task) => {
    setViewingId(task.id);
  }, []);

  /** 보기 모달의 '수정' 버튼에서만 들어온다. */
  const openEdit = useCallback((task: Task) => {
    setViewingId(null);
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  /**
   * 추가와 수정을 한 곳에서 처리한다. editingTask가 있으면 update, 없으면 insert.
   * 추가할 때 마감일을 여러 개 고르면 날짜 수만큼 drafts가 넘어온다.
   */
  const submitTask = useCallback(
    async (drafts: NewTask[]) => {
      setSaving(true);
      setError(null);
      try {
        if (editingTask) {
          // 수정 중 날짜를 더 골랐으면, 이 일정은 첫 날짜로 옮기고 나머지 날짜에는
          // 같은 내용의 일정을 새로 만든다. '수정'과 '추가'를 한 번에 처리하는 곳이다.
          const saved = await store.updateTask(editingTask.id, drafts[0]);
          const extra = drafts.length > 1 ? await store.addTasks(drafts.slice(1)) : [];
          setTasks((prev) => [
            ...extra,
            ...prev.map((t) => (t.id === saved.id ? saved : t)),
          ]);
        } else {
          const saved = await store.addTasks(drafts);
          setTasks((prev) => [...saved, ...prev]);
        }
        setModalOpen(false);
      } catch (e) {
        setError(message(e, "저장에 실패했어요."));
      } finally {
        setSaving(false);
      }
    },
    [editingTask, store],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      setSaving(true);
      setError(null);
      try {
        await store.removeTask(task.id);
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setModalOpen(false);
        // 보고 있던 id를 비운다. 게스트는 id를 '최댓값 + 1'로 매기므로, 방금 지운
        // 번호를 다음 일정이 그대로 물려받아 보기 모달이 혼자 열릴 수 있다.
        setViewingId(null);
      } catch (e) {
        setError(message(e, "삭제하지 못했어요."));
      } finally {
        setSaving(false);
      }
    },
    [store],
  );

  /** 데이터를 옮기지 않고 is_done 값만 뒤집는다. */
  const toggleTask = useCallback(
    async (task: Task) => {
      const next = !task.is_done;
      setError(null);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: next } : t)));

      try {
        await store.setDone(task.id, next);
      } catch (e) {
        // 실패하면 되돌린다.
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, is_done: !next } : t)),
        );
        setError(message(e, "완료 상태를 바꾸지 못했어요."));
      }
    },
    [store],
  );

  /**
   * 회고 저장. 내용이 비면 그 날짜의 회고를 지운다.
   *
   * 저장이 끝난 뒤에 화면을 바꾼다(할 일의 낙관적 갱신과 반대다). 회고는 타이핑이
   * 끝나고 한 번 누르는 것이라 기다림이 짧고, 대신 '저장됨'이 정확해야 한다.
   */
  const saveReflection = useCallback(
    async (date: DateKey, content: string) => {
      setError(null);
      try {
        await store.saveReflection(date, content);
        setReflections((prev) => {
          const rest = prev.filter((r) => r.date !== date);
          if (!content.trim()) return rest;
          return [{ date, content }, ...rest].sort((a, b) => (a.date < b.date ? 1 : -1));
        });
      } catch (e) {
        setError(message(e, "회고를 저장하지 못했어요."));
      }
    },
    [store],
  );

  /**
   * 설정 저장. 실패하면 화면 위 띠에 이유를 띄운다.
   *
   * useSettings.update는 실패해도 예외를 던지지 않고 SaveResult를 돌려준다. 그 결과를
   * 그냥 버리면 저장이 안 됐는데도 화면에는 아무 일도 안 일어난 것처럼 보인다.
   * 실제로 글꼴을 골랐는데 안 바뀌던 일이 이것이었다 — DB 제약에 없는 값이라
   * 거절당했는데, 거절당했다는 사실이 아무 데도 드러나지 않았다.
   */
  const saveSetting = useCallback(
    async (patch: Partial<Settings>) => {
      const result = await update(patch);
      setError(result.ok ? null : result.message);
    },
    [update],
  );

  /** 별표는 완료와 같은 방식 — 먼저 화면을 바꾸고, 실패하면 되돌린다. */
  const toggleStar = useCallback(
    async (task: Task) => {
      const next = !task.is_starred;
      setError(null);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_starred: next } : t)),
      );

      try {
        await store.setStarred(task.id, next);
      } catch (e) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, is_starred: !next } : t)),
        );
        setError(message(e, "별표를 바꾸지 못했어요."));
      }
    },
    [store],
  );

  const addCategory = useCallback(
    async (name: string) => {
      setError(null);
      try {
        const created = await store.addCategory({ name, sort_order: categories.length });
        setCategories((prev) => [...prev, created]);
      } catch (e) {
        setError(message(e, "분류를 만들지 못했어요."));
      }
    },
    [store, categories.length],
  );

  /** 분류를 지우면 거기 달려 있던 할 일은 미분류로 남는다(서버는 on delete set null). */
  const removeCategory = useCallback(
    async (category: Category) => {
      setError(null);
      try {
        await store.removeCategory(category.id);
        setCategories((prev) => prev.filter((c) => c.id !== category.id));
        setTasks((prev) =>
          prev.map((t) => (t.category_id === category.id ? { ...t, category_id: null } : t)),
        );
        // 지운 분류를 보고 있었다면 전체 보기로 돌아간다.
        if (settings?.filter_category_id === category.id) {
          void saveSetting({ filter_category_id: null });
        }
      } catch (e) {
        setError(message(e, "분류를 지우지 못했어요."));
      }
    },
    [store, settings?.filter_category_id, update],
  );

  /**
   * 지금 걸려 있는 필터.
   *
   * 저장된 값이 이미 지워진 분류를 가리킬 수 있다(다른 탭에서 지웠거나, 게스트 데이터가
   * 어긋났거나). 목록에 없는 id면 전체 보기로 떨어뜨린다 — 안 그러면 아무것도 안 보이는
   * 화면에서 빠져나올 방법이 없다.
   */
  const filter: CategoryFilter = useMemo(() => {
    const id = settings?.filter_category_id ?? null;
    return id !== null && categories.some((c) => c.id === id) ? id : null;
  }, [settings?.filter_category_id, categories]);

  /**
   * 일/일상 필터를 적용하는 단 한 곳.
   *
   * 아래 파생 목록(달력·다가오는·지난·할 일·통계)은 전부 이 배열에서 나오므로
   * 화면 어디를 봐도 같은 기준이 걸린다. 필터를 개별 목록마다 걸면 한 군데를
   * 빠뜨렸을 때 달력과 목록이 서로 다른 걸 보여준다.
   *
   * 검색만 예외로 원본 tasks를 받는다 — TaskSearch 주석 참고.
   */
  const visible = useMemo(() => tasks.filter((t) => matchesFilter(filter, t)), [tasks, filter]);

  const tasksByDate = useMemo(() => {
    const map = new Map<DateKey, Task[]>();
    for (const task of visible) {
      if (!task.due_date) continue;
      const bucket = map.get(task.due_date);
      if (bucket) bucket.push(task);
      else map.set(task.due_date, [task]);
    }
    for (const bucket of map.values()) bucket.sort(starredFirst(byDueThenCreated));
    return map;
  }, [visible]);

  // 노출 조건: 미완료 AND 마감일 있음 AND D-Day ~ D-10 → 별표 먼저, 마감일 오름차순.
  // 마감이 지난 것은 아래 overdue가 맡고, 아직 먼 것(D-11 이후)은 지금 신경 쓸 일이 아니다.
  const upcoming = useMemo(() => {
    if (!today) return [];
    return visible
      .filter((t) => {
        if (t.is_done || !t.due_date) return false;
        const left = diffDays(t.due_date, today);
        return left >= 0 && left <= UPCOMING_DAYS;
      })
      .sort(starredFirst(byDueAsc));
  }, [visible, today]);

  /**
   * '지난 일정' 탭. 마감이 지났는데 아직 완료하지 않은 것만 담는다.
   * 이미 끝낸 과거 일정까지 넣으면 시간이 갈수록 목록이 길어지기만 하고,
   * 정작 지금 처리해야 할 것이 그 안에 묻힌다.
   */
  const overdue = useMemo(() => {
    if (!today) return [];
    return visible
      .filter((t) => !t.is_done && t.due_date !== null && diffDays(t.due_date, today) < 0)
      .sort(starredFirst(byDueDesc));
  }, [visible, today]);

  const pending = useMemo(
    () => visible.filter((t) => !t.is_done).sort(starredFirst(byDueThenCreated)),
    [visible],
  );
  const done = useMemo(() => visible.filter((t) => t.is_done), [visible]);

  const dueTodayCount = useMemo(
    () => (today ? upcoming.filter((t) => t.due_date === today).length : 0),
    [upcoming, today],
  );

  /**
   * 마감 알림. 필터를 거치지 않은 전체 tasks를 넘긴다 — 지금 '운동'만 보고 있다고
   * 해서 '업무' 마감 알림을 놓치면 안 된다.
   */
  const notify = useNotifications(tasks);

  /** 보기 모달에 그릴 일정. 목록에서 매번 찾으므로 별표를 켜면 바로 반영되고, 지워지면 닫힌다. */
  const viewingTask = useMemo(
    () => (viewingId === null ? null : (tasks.find((t) => t.id === viewingId) ?? null)),
    [tasks, viewingId],
  );

  const view: CalendarView = settings?.calendar_view ?? "month";

  /** 화살표 한 번에 얼마나 움직이는지 — 보고 있는 단위만큼. */
  const step = useCallback(
    (delta: number) =>
      setAnchor((a) =>
        a === null
          ? a
          : view === "month"
            ? addMonthsKey(a, delta)
            : view === "day"
              ? addDays(a, delta)
              : addDays(a, delta * 7),
      ),
    [view],
  );

  // 설정·세션이 준비되기 전에 그리면 저장해둔 테마·뷰와 다른 화면이 한 번 보인다.
  if (!today || !anchor || !settings || !ready) {
    return <div className="min-h-screen bg-canvas" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        pendingCount={pending.length}
        dueTodayCount={dueTodayCount}
        doneCount={done.length}
        categories={categories}
        filter={filter}
        onFilterChange={(next) => void saveSetting({ filter_category_id: next })}
        onAddCategory={(name) => void addCategory(name)}
        onRemoveCategory={(category) => void removeCategory(category)}
        email={email}
        plannerName={settings.planner_name}
        profileImage={settings.profile_image}
        profileX={settings.profile_pos_x}
        profileY={settings.profile_pos_y}
        onNameChange={(planner_name) => void saveSetting({ planner_name })}
        // 사진과 위치를 한 번에 저장한다 — 두 번 나눠 저장하면 사진만 바뀌고 위치는
        // 예전 값으로 남는 순간이 생긴다.
        onProfileChange={(next) =>
          update({
            ...(next.image !== undefined && { profile_image: next.image }),
            ...(next.x !== undefined && { profile_pos_x: next.x }),
            ...(next.y !== undefined && { profile_pos_y: next.y }),
          })
        }
        onOpenSettings={() => setSettingsOpen(true)}
        onSignIn={() => setAuthOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          좁은 화면에만 있는 머리줄. 사이드바가 서랍으로 접혀 있으니 여는 손잡이와
          플래너 이름, 그리고 설정으로 가는 길만 둔다.
        */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-card px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="메뉴 열기"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-soft hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
            {settings.planner_name}
          </span>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="일정 검색"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-soft hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4 4" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="설정"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-soft hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        {/* 폰 검색. 머리줄을 덮고 내려와서 자판이 바로 올라온다. */}
        {searchOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="검색 닫기"
              onClick={() => setSearchOpen(false)}
              className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
            />
            <div className="relative flex items-center gap-2 border-b border-line bg-card p-3">
              <div className="min-w-0 flex-1">
                <TaskSearch
                  tasks={tasks}
                  today={today}
                  autoFocus
                  onSelect={(task) => {
                    setSearchOpen(false);
                    openView(task);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="shrink-0 px-1 text-[13px] text-ink-soft"
              >
                취소
              </button>
            </div>
          </div>
        )}


        {/* 아래 탭바에 가리지 않도록 폰에서만 아래 여백을 크게 준다. */}
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-3 pb-24 lg:flex-row lg:items-start lg:gap-5 lg:p-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5">
            {error && (
              <div className="flex items-center gap-3 rounded-card border border-soft-deep bg-soft px-4 py-3 text-[12px] text-accent-deep">
                <span className="min-w-0 flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 underline underline-offset-2"
                >
                  닫기
                </button>
              </div>
            )}

            {/* 폰에서는 머리줄의 돋보기가 검색을 연다. 여기 있는 것은 넓은 화면용. */}
            <div className="hidden lg:block">
              <TaskSearch tasks={tasks} today={today} onSelect={openView} />
            </div>

            {/*
              배너는 180px 고정. 카운터는 편집할 때만 더 커지므로 items-start.
              둘 다 폰에서는 이 자리에 없다 — 배너는 화면 높이를 크게 먹으면서 달력을
              아래로 밀어내서 아예 빼고, 카운터는 할 일 탭으로 옮겼다.
            */}
            <div className="hidden items-start gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <CounterCard
                label={settings.counter_label}
                date={settings.counter_date}
                today={today}
                onSave={(counter_label, counter_date) =>
                  void saveSetting({ counter_label, counter_date })
                }
              />
              <BannerCard
                image={settings.banner_image}
                x={settings.banner_pos_x}
                y={settings.banner_pos_y}
                onSave={(next) =>
                  update({
                    ...(next.image !== undefined && { banner_image: next.image }),
                    ...(next.x !== undefined && { banner_pos_x: next.x }),
                    ...(next.y !== undefined && { banner_pos_y: next.y }),
                  })
                }
              />
            </div>

            {/*
              폰에서만 달력 위에 놓이는 다가오는/지난 일정. 다섯 개까지만 보여준다 —
              길어지는 만큼 달력이 아래로 밀려난다. 넓은 화면에서는 오른쪽 단에 있다.
            */}
            <div
              className={`lg:hidden ${
                // 둘 다 비면 카드째 감춘다. '없어요' 한 줄이 달력을 100px 밀어낼 이유는 없다.
                mobileTab === "calendar" && (loading || upcoming.length > 0 || overdue.length > 0)
                  ? "block"
                  : "hidden"
              }`}
            >
              {loading ? (
                <div className="h-32 animate-pulse rounded-card border border-line bg-card" />
              ) : (
                <ScheduleCard
                  upcoming={upcoming}
                  overdue={overdue}
                  today={today}
                  limit={5}
                  onSelect={openView}
                  onToggleDone={toggleTask}
                />
              )}
            </div>

            <div className={`lg:block ${mobileTab === "calendar" ? "block" : "hidden"}`}>
              <Calendar
                anchor={anchor}
                view={view}
                today={today}
                tasksByDate={tasksByDate}
                // 칸을 누르면 그 날짜로 추가 모달이 곧장 열린다.
                onAddOn={openAdd}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
                onToday={() => setAnchor(todayKey())}
                onViewChange={(next) => void saveSetting({ calendar_view: next })}
                onSelect={openView}
                onToggleDone={toggleTask}
                onOpenDay={setDaySheetKey}
                // 주간 요일 줄에서 고른 날. 같은 주 안이라 보이는 주는 그대로다.
                onSelectDay={setAnchor}
              />
            </div>

            {/* ── 폰: 할 일 탭 ── */}
            <div
              className={`flex-col gap-4 lg:hidden ${
                mobileTab === "tasks" ? "flex" : "hidden"
              }`}
            >
              <CounterCard
                label={settings.counter_label}
                date={settings.counter_date}
                today={today}
                onSave={(counter_label, counter_date) =>
                  void saveSetting({ counter_label, counter_date })
                }
              />

              {loading ? (
                <div className="h-64 animate-pulse rounded-card border border-line bg-card" />
              ) : (
                <TaskList
                  pending={pending}
                  done={done}
                  onToggle={toggleTask}
                  onToggleStar={toggleStar}
                  onSelect={openView}
                  onAdd={() => openAdd(null)}
                />
              )}
            </div>
          </div>

          {/*
            가운데가 길어져도 계속 보이도록 붙여둔다.
            overflow-hidden은 필수다. 안쪽 목록이 max-h를 넘긴 만큼은 카드 안에서 잘려
            보이지 않는데도 문서 스크롤 높이에는 그대로 더해져서, 목록이 길어지면
            화면에 아무것도 없는 여백이 아래로 길게 생긴다.
          */}
          <div className="hidden w-full shrink-0 flex-col gap-5 lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)] lg:w-[300px] lg:overflow-hidden">
            {loading ? (
              <div className="h-40 animate-pulse rounded-card border border-line bg-card" />
            ) : (
              <ScheduleCard
                upcoming={upcoming}
                overdue={overdue}
                today={today}
                onSelect={openView}
                onToggleDone={toggleTask}
              />
            )}

            {loading ? (
              <div className="h-64 flex-1 animate-pulse rounded-card border border-line bg-card lg:h-auto" />
            ) : (
              <TaskList
                pending={pending}
                done={done}
                onToggle={toggleTask}
                onToggleStar={toggleStar}
                onSelect={openView}
                onAdd={() => openAdd(null)}
              />
            )}
          </div>
        </main>

        {/* 폰 전용 아래 탭바. 홈 인디케이터 영역만큼 아래를 더 띄운다. */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
          <MobileTab
            active={mobileTab === "calendar"}
            label="달력"
            onClick={() => setMobileTab("calendar")}
          >
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" strokeLinecap="round" />
          </MobileTab>
          <MobileTab
            active={mobileTab === "tasks"}
            label="할 일"
            onClick={() => setMobileTab("tasks")}
          >
            <path
              d="M4 7l2 2 3.5-3.5M4 16l2 2 3.5-3.5M13 7.5h7M13 16.5h7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </MobileTab>
        </nav>
      </div>

      {/* 좁은 화면에서 달력 칸을 눌렀을 때 아래에서 올라오는 그날 목록. */}
      <DaySheet
        dateKey={daySheetKey}
        tasks={daySheetKey ? (tasksByDate.get(daySheetKey) ?? []) : []}
        today={today}
        onClose={() => setDaySheetKey(null)}
        onSelect={openView}
        onToggleDone={toggleTask}
        onAdd={(key) => {
          setDaySheetKey(null);
          openAdd(key);
        }}
      />

      <TaskDetail
        task={viewingTask}
        categories={categories}
        reflections={reflections}
        today={today}
        onSaveReflection={saveReflection}
        saving={saving}
        onClose={() => setViewingId(null)}
        onDelete={(t) => void deleteTask(t)}
        onEdit={openEdit}
        onToggleStar={toggleStar}
      />

      <TaskModal
        open={modalOpen}
        task={editingTask}
        // 달력에서 고른 칸이 있으면 추가 모달의 마감일이 그 날짜로 채워진다.
        initialDate={selectedDate}
        today={today}
        categories={categories}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={submitTask}
        onDelete={deleteTask}
      />

      <SettingsModal
        open={settingsOpen}
        theme={settings.theme}
        font={settings.font}
        notify={notify}
        email={email}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={(theme: ThemeId) => void saveSetting({ theme })}
        onFontChange={(font: FontId) => void saveSetting({ font })}
        onChangePassword={changePassword}
        onSignIn={() => {
          setSettingsOpen(false);
          setAuthOpen(true);
        }}
        onSignOut={() => {
          setSettingsOpen(false);
          void signOut();
        }}
      />

      <AuthModal
        open={authOpen && !session}
        onClose={() => setAuthOpen(false)}
        onSignIn={async (mail, password) => {
          await signIn(mail, password);
          setAuthOpen(false);
        }}
        onSignUp={async (mail, password) => {
          await signUp(mail, password);
          setAuthOpen(false);
        }}
      />

      <MergePrompt
        count={mergeCount}
        onAccept={() => void acceptMerge()}
        onDecline={declineMerge}
      />
    </div>
  );
}
