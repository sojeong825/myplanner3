"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BannerCard from "@/components/BannerCard";
import Calendar from "@/components/Calendar";
import CounterCard from "@/components/CounterCard";
import DdayList from "@/components/DdayList";
import Sidebar from "@/components/Sidebar";
import TaskList from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import { addDays, addMonthsKey, todayKey, type DateKey } from "@/lib/date";
import type { CalendarView, ThemeId } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import type { NewTask, Task } from "@/lib/types";
import { useSettings } from "@/lib/useSettings";

/** 마감일 오름차순, 마감 없는 항목은 뒤로. 같으면 최근 등록 순. */
function byDueThenCreated(a: Task, b: Task) {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return a.created_at < b.created_at ? 1 : -1;
}

export default function Page() {
  // 날짜에 의존하는 렌더는 하이드레이션 이후로 미룬다.
  const [today, setToday] = useState<DateKey | null>(null);
  /** 달력이 보고 있는 기준 날짜. 월간이면 이 날짜의 달, 주간이면 이 날짜가 속한 주. */
  const [anchor, setAnchor] = useState<DateKey | null>(null);

  const { settings, update } = useSettings();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const key = todayKey();
    setToday(key);
    setAnchor(key);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, due_date, is_done, created_at")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) setError(`할 일을 불러오지 못했어요: ${error.message}`);
      else setTasks(data as Task[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const addTask = useCallback(async (input: NewTask) => {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("tasks")
      .insert(input)
      .select("id, title, due_date, is_done, created_at")
      .single();

    setSaving(false);

    if (error) {
      setError(`저장에 실패했어요: ${error.message}`);
      return;
    }

    setTasks((prev) => [data as Task, ...prev]);
    setModalOpen(false);
  }, []);

  /** 데이터를 옮기지 않고 is_done 값만 뒤집는다. */
  const toggleTask = useCallback(async (task: Task) => {
    const next = !task.is_done;
    setError(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_done: next } : t)),
    );

    const { error } = await supabase
      .from("tasks")
      .update({ is_done: next })
      .eq("id", task.id);

    if (error) {
      // 실패하면 되돌린다.
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_done: !next } : t)),
      );
      setError(`완료 상태를 바꾸지 못했어요: ${error.message}`);
    }
  }, []);

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

  // 노출 조건: 미완료 AND 마감일 있음 → 마감일 오름차순
  const ddayTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.is_done && t.due_date)
        .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1)),
    [tasks],
  );

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

  // 설정이 준비되기 전에 그리면 저장해둔 테마·뷰와 다른 화면이 한 번 보인다.
  if (!today || !anchor || !settings) {
    return <div className="min-h-screen bg-canvas" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        pendingCount={pending.length}
        dueTodayCount={dueTodayCount}
        doneCount={done.length}
        plannerName={settings.planner_name}
        profileImage={settings.profile_image}
        theme={settings.theme}
        onNameChange={(planner_name) => update({ planner_name })}
        onProfileChange={(dataUrl) => update({ profile_image: dataUrl })}
        onThemeChange={(theme: ThemeId) => update({ theme })}
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

          {/* 배너는 180px 고정. 카운터는 편집할 때만 더 커지면 되므로 items-start. */}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-5">
            <CounterCard
              label={settings.counter_label}
              date={settings.counter_date}
              today={today}
              onSave={(counter_label, counter_date) =>
                update({ counter_label, counter_date })
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
            onViewChange={(next) => update({ calendar_view: next })}
            onAdd={() => setModalOpen(true)}
          />
        </div>

        {/* 가운데가 길어져도 계속 보이도록 붙여둔다. */}
        <div className="sticky top-6 flex max-h-[calc(100vh-3rem)] w-[300px] shrink-0 flex-col gap-5">
          {loading ? (
            <div className="h-40 animate-pulse rounded-card border border-line bg-card" />
          ) : (
            <DdayList tasks={ddayTasks} today={today} />
          )}

          {loading ? (
            <div className="flex-1 animate-pulse rounded-card border border-line bg-card" />
          ) : (
            <TaskList
              pending={pending}
              done={done}
              onToggle={toggleTask}
              onAdd={() => setModalOpen(true)}
            />
          )}
        </div>
      </main>

      <TaskModal
        open={modalOpen}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={addTask}
      />
    </div>
  );
}
