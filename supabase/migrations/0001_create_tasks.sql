-- MVP 일정관리 템플릿: 단일 엔티티 Task
-- 달력 / D-day 목록은 별도 테이블이 아니라 이 테이블의 파생 뷰다.

create table public.tasks (
  id bigint generated always as identity primary key,
  title text not null check (char_length(btrim(title)) > 0),
  due_date date,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.tasks is 'MVP 일정관리 템플릿의 단일 엔티티. 달력/D-day 목록은 모두 이 테이블의 파생 뷰.';

-- D-day 목록 질의(미완료 + 마감일 있음 + 마감일 오름차순)에 맞춘 부분 인덱스
create index tasks_due_date_pending_idx
  on public.tasks (due_date)
  where is_done = false and due_date is not null;

alter table public.tasks enable row level security;

-- 로그인이 스코프 밖인 개인용 템플릿이므로 anon 롤에 전체 권한을 연다.
-- 인증을 붙일 때는 user_id 컬럼을 추가하고 아래 정책을 소유권 기준으로 좁혀야 한다.
create policy "anon can read tasks"
  on public.tasks for select to anon, authenticated using (true);

create policy "anon can insert tasks"
  on public.tasks for insert to anon, authenticated with check (true);

create policy "anon can update tasks"
  on public.tasks for update to anon, authenticated using (true) with check (true);

create policy "anon can delete tasks"
  on public.tasks for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.tasks to anon, authenticated;
