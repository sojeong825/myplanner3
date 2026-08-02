"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthModal from "@/components/AuthModal";
import BannerCard from "@/components/BannerCard";
import Calendar from "@/components/Calendar";
import CounterCard from "@/components/CounterCard";
import DdayList from "@/components/DdayList";
import MergePrompt from "@/components/MergePrompt";
import Sidebar from "@/components/Sidebar";
import TaskList from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import TaskSearch from "@/components/TaskSearch";
import { addDays, addMonthsKey, diffDays, todayKey, type DateKey } from "@/lib/date";
import type { CalendarView, ThemeId } from "@/lib/settings";
import {
  clearLocalData,
  createStore,
  localTaskCount,
  migrateLocalToServer,
} from "@/lib/store";
import type { NewTask, Task } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
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
  return a.created_at < b.created_at ? 1 : -1;
}

const message = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

export default function Page() {
  // 날짜에 의존하는 렌더는 하이드레이션 이후로 미룬다.
  const [today, setToday] = useState<DateKey | null>(null);
  /** 달력이 보고 있는 기준 날짜. 월간이면 이 날짜의 달, 주간이면 이 날짜가 속한 주. */
  const [anchor, setAnchor] = useState<DateKey | null>(null);

  const { session, ready, userId, email, signIn, signUp, signOut } = useAuth();
  const store = useMemo(() => createStore(userId), [userId]);
  const { settings, setSettings, update } = useSettings(store, ready);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  /** null이면 추가 모드, Task가 담기면 그 항목 수정 모드 */
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
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
      setTasks(await store.listTasks());
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
        const serverTasks = await store.listTasks();
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

  const openAdd = useCallback(() => {
    setEditingTask(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((task: Task) => {
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
          const saved = await store.updateTask(editingTask.id, drafts[0]);
          setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
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

  const tasksByDate = useMemo(() => {
    const map = new Map<DateKey, Task[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const bucket = map.get(task.due_date);
      if (bucket) bucket.push(task);
      else map.set(task.due_date, [task]);
    }
    for (const bucket of map.values()) bucket.sort(byDueThenCreated);
    return map;
  }, [tasks]);

  // 노출 조건: 미완료 AND 마감일 있음 AND D-Day ~ D-10 → 마감일 오름차순.
  // 마감이 지난 것(D+1 이후)은 '다가오는' 일정이 아니고,
  // 아직 먼 것(D-11 이후)은 지금 신경 쓸 일이 아니라 양쪽 다 뺀다.
  const ddayTasks = useMemo(() => {
    if (!today) return [];
    return tasks
      .filter((t) => {
        if (t.is_done || !t.due_date) return false;
        const left = diffDays(t.due_date, today);
        return left >= 0 && left <= UPCOMING_DAYS;
      })
      .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));
  }, [tasks, today]);

  const pending = useMemo(
    () => tasks.filter((t) => !t.is_done).sort(byDueThenCreated),
    [tasks],
  );
  const done = useMemo(() => tasks.filter((t) => t.is_done), [tasks]);

  const dueTodayCount = useMemo(
    () => (today ? ddayTasks.filter((t) => t.due_date === today).length : 0),
    [ddayTasks, today],
  );

  const view: CalendarView = settings?.calendar_view ?? "month";

  const step = useCallback(
    (delta: number) =>
      setAnchor((a) =>
        a === null ? a : view === "month" ? addMonthsKey(a, delta) : addDays(a, delta * 7),
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
        pendingCount={pending.length}
        dueTodayCount={dueTodayCount}
        doneCount={done.length}
        email={email}
        plannerName={settings.planner_name}
        profileImage={settings.profile_image}
        theme={settings.theme}
        onNameChange={(planner_name) => void update({ planner_name })}
        onProfileChange={(dataUrl) => update({ profile_image: dataUrl })}
        onThemeChange={(theme: ThemeId) => void update({ theme })}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={() => void signOut()}
      />

      <main className="flex min-w-0 flex-1 items-start gap-5 p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
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

          <TaskSearch tasks={tasks} today={today} onSelect={openEdit} />

          {/* 배너는 180px 고정. 카운터는 편집할 때만 더 커지면 되므로 items-start. */}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-5">
            <CounterCard
              label={settings.counter_label}
              date={settings.counter_date}
              today={today}
              onSave={(counter_label, counter_date) =>
                void update({ counter_label, counter_date })
              }
            />
            <BannerCard
              image={settings.banner_image}
              onChange={(dataUrl) => update({ banner_image: dataUrl })}
            />
          </div>

          <Calendar
            anchor={anchor}
            view={view}
            today={today}
            tasksByDate={tasksByDate}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onToday={() => setAnchor(todayKey())}
            onViewChange={(next) => void update({ calendar_view: next })}
            onSelect={openEdit}
            onAdd={openAdd}
          />
        </div>

        {/* 가운데가 길어져도 계속 보이도록 붙여둔다. */}
        <div className="sticky top-6 flex max-h-[calc(100vh-3rem)] w-[300px] shrink-0 flex-col gap-5">
          {loading ? (
            <div className="h-40 animate-pulse rounded-card border border-line bg-card" />
          ) : (
            <DdayList tasks={ddayTasks} today={today} onSelect={openEdit} />
          )}

          {loading ? (
            <div className="flex-1 animate-pulse rounded-card border border-line bg-card" />
          ) : (
            <TaskList
              pending={pending}
              done={done}
              onToggle={toggleTask}
              onSelect={openEdit}
              onAdd={openAdd}
            />
          )}
        </div>
      </main>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={submitTask}
        onDelete={deleteTask}
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
