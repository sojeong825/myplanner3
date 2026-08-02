-- v1.2: 로그인 도입.
-- 서버 데이터는 전부 소유자(user_id)에 묶고, 게스트는 서버를 아예 쓰지 않는다.

alter table public.tasks
  add column user_id uuid not null references auth.users(id) on delete cascade
  default auth.uid();

create index tasks_user_id_idx on public.tasks (user_id);

drop policy if exists "anon can read tasks" on public.tasks;
drop policy if exists "anon can insert tasks" on public.tasks;
drop policy if exists "anon can update tasks" on public.tasks;
drop policy if exists "anon can delete tasks" on public.tasks;

revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;

-- TO authenticated 만으로는 '로그인했다'는 확인일 뿐이라, 소유권 조건을 함께 건다.
create policy "tasks: owner select" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "tasks: owner insert" on public.tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- update는 USING과 WITH CHECK 둘 다 필요하다. WITH CHECK가 없으면 소유자를 남에게 넘길 수 있다.
create policy "tasks: owner update" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tasks: owner delete" on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 로그인 시 개인화 설정도 서버에 둔다. 계정당 한 줄이라 user_id가 곧 기본키다.
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  planner_name text not null default 'my planner',
  profile_image text,
  banner_image text,
  theme text not null default 'pink',
  calendar_view text not null default 'month',
  counter_date date,
  counter_label text not null default '시작한 날',
  updated_at timestamptz not null default now(),

  constraint settings_theme_check check (theme in ('pink','lavender','mint','cream','gray')),
  constraint settings_view_check check (calendar_view in ('month','week')),
  constraint settings_name_len_check check (char_length(planner_name) between 1 and 20),
  constraint settings_counter_label_len_check check (char_length(counter_label) between 1 and 20)
);

alter table public.settings enable row level security;

-- 새 테이블은 public 스키마 기본 권한으로 anon에도 열리므로 명시적으로 회수한다.
revoke all on public.settings from anon;
grant select, insert, update, delete on public.settings to authenticated;

create policy "settings: owner select" on public.settings
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "settings: owner insert" on public.settings
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "settings: owner update" on public.settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "settings: owner delete" on public.settings
  for delete to authenticated using ((select auth.uid()) = user_id);
