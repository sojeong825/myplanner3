-- v1.5: 고정 2단계 분류(area + category)를 사용자가 만드는 1단계 분류로 바꾼다.
--
-- 0005에서 넣은 '일 → 업무·회의·프로젝트 / 일상 → 약속·운동·개인'은 코드에 박힌
-- 목록이었다. 쓰지도 않는 하위 항목이 화면만 차지해서, 한 단계로 줄이고 이름도
-- 사용자가 정하게 한다.
--
-- 기존 데이터는 버리지 않는다. area를 쓰던 사람에게는 '일'·'일상' 분류를 만들어주고
-- 그 할 일들을 새 분류에 다시 걸어준다. 하위 카테고리(업무·회의…)는 사라진다 —
-- 한 단계로 줄이기로 한 이상 옮겨 담을 자리가 없다.

create table public.categories (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),

  constraint categories_name_len_check check (char_length(btrim(name)) between 1 and 12),
  -- 같은 이름이 둘이면 사이드바에서 어느 쪽을 누른 건지 알 수 없다.
  constraint categories_name_unique unique (user_id, name)
);

comment on table public.categories is
  '사용자가 직접 만들고 지우는 일정 분류. 한 단계뿐이다(v1.5).';

create index categories_user_id_idx on public.categories (user_id, sort_order);

alter table public.categories enable row level security;

-- 새 테이블은 public 스키마 기본 권한으로 anon에도 열리므로 명시적으로 회수한다.
revoke all on public.categories from anon;
grant select, insert, update, delete on public.categories to authenticated;

create policy "categories: owner select" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "categories: owner insert" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- update는 USING과 WITH CHECK 둘 다 필요하다. WITH CHECK가 없으면 소유자를 넘길 수 있다.
create policy "categories: owner update" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "categories: owner delete" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

/* --------------------------- 기존 area 값 옮기기 --------------------------- */

-- area를 쓰고 있던 사용자에게만 그 이름의 분류를 만들어준다.
insert into public.categories (user_id, name, sort_order)
select distinct
  t.user_id,
  case t.area when 'work' then '일' else '일상' end,
  case t.area when 'work' then 0 else 1 end
from public.tasks t
where t.area is not null;

alter table public.tasks
  add column category_id bigint references public.categories(id) on delete set null;

comment on column public.tasks.category_id is
  '사용자가 만든 분류. 분류를 지우면 null이 되어 미분류로 남는다.';

create index tasks_category_id_idx on public.tasks (category_id);

update public.tasks t
set category_id = c.id
from public.categories c
where c.user_id = t.user_id
  and t.area is not null
  and c.name = case t.area when 'work' then '일' else '일상' end;

-- 여기까지 옮겼으면 옛 컬럼은 쓸 일이 없다. 제약도 함께 사라진다.
alter table public.tasks
  drop constraint tasks_category_pair_check,
  drop constraint tasks_area_check;

alter table public.tasks
  drop column area,
  drop column category;

/* ------------------------------ 필터 설정 ------------------------------- */

alter table public.settings
  drop constraint settings_filter_pair_check,
  drop constraint settings_filter_area_check;

alter table public.settings
  add column filter_category_id bigint references public.categories(id) on delete set null;

comment on column public.settings.filter_category_id is
  '분류 필터. null이면 전체 보기. 보고 있던 분류를 지우면 자동으로 null이 된다.';

alter table public.settings
  drop column filter_area,
  drop column filter_category;
