-- v1.8: 날짜별 회고.
--
-- 할 일과 따로 둔다. 할 일은 '앞으로 할 것'이고 회고는 '지나고 나서 적는 것'이라
-- 성격이 다르고, 일정의 memo로 만들면 하루를 통으로 돌아보는 자리가 없어진다.
--
-- 날짜가 곧 열쇠다(사용자당 하루 한 건). 앱은 늘 날짜로 찾으므로 id가 아니라
-- (user_id, date)에 유일 제약을 건다 — 그래야 upsert 한 번으로 새로 쓰기와
-- 고쳐 쓰기가 모두 처리된다.

create table public.reflections (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  date date not null,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reflections_user_date_unique unique (user_id, date)
);

comment on table public.reflections is
  '하루에 하나씩 쓰는 회고. 빈 내용은 저장하지 않고 행을 지운다.';

-- 목록은 늘 최근 날짜부터 읽는다.
create index reflections_user_date_idx on public.reflections (user_id, date desc);

alter table public.reflections enable row level security;

-- 새 테이블은 public 스키마 기본 권한으로 anon에도 열리므로 명시적으로 회수한다.
revoke all on public.reflections from anon;
grant select, insert, update, delete on public.reflections to authenticated;

create policy "reflections: owner select" on public.reflections
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "reflections: owner insert" on public.reflections
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- update는 USING과 WITH CHECK 둘 다 필요하다. WITH CHECK가 없으면 소유자를 넘길 수 있다.
create policy "reflections: owner update" on public.reflections
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "reflections: owner delete" on public.reflections
  for delete to authenticated using ((select auth.uid()) = user_id);
