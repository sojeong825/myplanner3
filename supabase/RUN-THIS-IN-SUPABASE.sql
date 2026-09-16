-- ============================================================
--  my planner 업데이트 SQL  (0005 ~ 0012 한 번에)
--
--  ▶ 이 파일 전체를 복사해서 Supabase SQL Editor에 붙여넣고 Run 하세요.
--
--  ▶ 여러 번 실행해도 안전합니다.
--     "이미 있으면 건너뛰고, 없으면 만든다"로만 짜여 있어서
--     전에 일부만 실행됐더라도 나머지만 알아서 채웁니다.
--
--  ▶ 맨 마지막에 결과표가 나옵니다. 전부 ✅ 면 성공입니다.
-- ============================================================


-- ============================================================
--  1. 분류 테이블 만들기
-- ============================================================

create table if not exists public.categories (
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

create index if not exists categories_user_id_idx
  on public.categories (user_id, sort_order);

alter table public.categories enable row level security;

-- 새 테이블은 public 스키마 기본 권한으로 anon에도 열리므로 명시적으로 회수한다.
revoke all on public.categories from anon;
grant select, insert, update, delete on public.categories to authenticated;

-- 정책은 "있으면 지우고 다시 만든다" — create policy에는 if not exists가 없다.
drop policy if exists "categories: owner select" on public.categories;
create policy "categories: owner select" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "categories: owner insert" on public.categories;
create policy "categories: owner insert" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- update는 USING과 WITH CHECK 둘 다 필요하다. WITH CHECK가 없으면 소유자를 넘길 수 있다.
drop policy if exists "categories: owner update" on public.categories;
create policy "categories: owner update" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "categories: owner delete" on public.categories;
create policy "categories: owner delete" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);


-- ============================================================
--  2. tasks · settings 에 새 칸 붙이기
-- ============================================================

alter table public.tasks
  add column if not exists is_starred boolean not null default false;

alter table public.tasks
  add column if not exists category_id bigint
  references public.categories(id) on delete set null;

create index if not exists tasks_category_id_idx on public.tasks (category_id);

comment on column public.tasks.is_starred is
  '특별 일정 표시. 목록 최상단으로 올라가고 달력에서도 강조된다.';
comment on column public.tasks.category_id is
  '사용자가 만든 분류. 분류를 지우면 null이 되어 미분류로 남는다.';

alter table public.settings
  add column if not exists filter_category_id bigint
  references public.categories(id) on delete set null;

comment on column public.settings.filter_category_id is
  '분류 필터. null이면 전체 보기. 보고 있던 분류를 지우면 자동으로 null이 된다.';


-- ============================================================
--  3. 테마 4종(블루·세이지·코랄·모카) 허용
-- ============================================================

alter table public.settings drop constraint if exists settings_theme_check;

alter table public.settings
  add constraint settings_theme_check
  check (theme in ('pink', 'lavender', 'mint', 'cream', 'gray',
                   'blue', 'sage', 'coral', 'mocha'));


-- ============================================================
--  4. 아이콘을 이모지로 바꾸기
-- ============================================================

-- 값을 열거하던 옛 제약을 푼다. 이모지는 종류를 미리 다 적을 수 없다.
alter table public.tasks drop constraint if exists tasks_icon_check;
alter table public.tasks drop constraint if exists tasks_icon_len_check;

-- 이미 이모지인 행은 else 로 빠져서 그대로 남는다 — 다시 돌려도 안전하다.
update public.tasks set icon = case icon
  when 'circle'   then '📌'
  when 'star'     then '⭐'
  when 'heart'    then '❤️'
  when 'triangle' then '🔺'
  when 'square'   then '🟦'
  when 'document' then '📋'
  when 'chat'     then '💬'
  when 'folder'   then '📁'
  when 'cup'      then '☕'
  when 'dumbbell' then '💪'
  when 'cake'     then '🎂'
  when 'cross'    then '🏥'
  when 'book'     then '📚'
  when 'bag'      then '🛒'
  when 'pin'      then '📌'
  else icon
end
where icon is not null;

-- 값 대신 길이만 막는다. (❤️·✈️처럼 변이 선택자가 붙으면 2코드포인트다.)
alter table public.tasks
  add constraint tasks_icon_len_check
  check (icon is null or char_length(icon) between 1 and 8);

comment on column public.tasks.icon is
  '이모지 문자. null이면 📌으로 표시. v1.3까지는 프리셋 이름이었다.';
comment on column public.tasks.icon_color is
  '더 이상 화면에 쓰지 않는다(v1.4). 예전 데이터 보존용.';


-- ============================================================
--  5. 옛 '일/일상' 분류가 쓰이고 있었다면 새 분류로 옮기기
--
--  area 칸이 아직 남아 있을 때만 돈다. 이미 지워졌으면 통째로 건너뛴다.
-- ============================================================

do $outer$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'area'
  ) then
    -- 쓰고 있던 사용자에게만 그 이름의 분류를 만들어준다.
    execute $mig$
      insert into public.categories (user_id, name, sort_order)
      select distinct
        t.user_id,
        case t.area when 'work' then '일' else '일상' end,
        case t.area when 'work' then 0 else 1 end
      from public.tasks t
      where t.area is not null
      on conflict (user_id, name) do nothing
    $mig$;

    -- 그 할 일들을 새 분류에 다시 건다.
    execute $mig$
      update public.tasks t
      set category_id = c.id
      from public.categories c
      where c.user_id = t.user_id
        and t.area is not null
        and c.name = case t.area when 'work' then '일' else '일상' end
    $mig$;
  end if;
end
$outer$;


-- ============================================================
--  6. 이제 안 쓰는 옛 칸 지우기
-- ============================================================

alter table public.tasks drop constraint if exists tasks_category_pair_check;
alter table public.tasks drop constraint if exists tasks_area_check;

alter table public.tasks drop column if exists area;
alter table public.tasks drop column if exists category;

alter table public.settings drop constraint if exists settings_filter_pair_check;
alter table public.settings drop constraint if exists settings_filter_area_check;

alter table public.settings drop column if exists filter_area;
alter table public.settings drop column if exists filter_category;


-- ============================================================
--  7. 사진이 잘려 보일 위치 (v1.6)
--
--  전까지는 업로드할 때 가운데를 잘라 저장해서, 잘린 부분이 영영 사라졌다.
--  이제 원본 비율 그대로 저장하고 어디를 보여줄지는 이 값이 정한다.
--  50은 가운데 — 기존 사진은 예전과 똑같이 보인다.
-- ============================================================

alter table public.settings
  add column if not exists profile_pos_x smallint not null default 50;
alter table public.settings
  add column if not exists profile_pos_y smallint not null default 50;
alter table public.settings
  add column if not exists banner_pos_x smallint not null default 50;
alter table public.settings
  add column if not exists banner_pos_y smallint not null default 50;

comment on column public.settings.profile_pos_x is
  '프로필 사진이 원형 틀에서 보일 가로 위치(0~100%). 50이면 가운데.';
comment on column public.settings.banner_pos_x is
  '배너가 2.5:1 틀에서 보일 가로 위치(0~100%). 50이면 가운데.';

-- object-position은 0~100% 밖을 받지 않는다.
alter table public.settings drop constraint if exists settings_image_pos_check;

alter table public.settings
  add constraint settings_image_pos_check
  check (
    profile_pos_x between 0 and 100
    and profile_pos_y between 0 and 100
    and banner_pos_x between 0 and 100
    and banner_pos_y between 0 and 100
  );


-- ============================================================
--  8. 마감 시간 (v1.7)
--
--  날짜만으로는 '몇 시에'를 담을 수 없어서 time 칸을 하나 더한다.
--  기존 일정은 전부 '시간 없음'으로 남는다.
-- ============================================================

alter table public.tasks add column if not exists due_time time;

comment on column public.tasks.due_time is
  '마감 시간(선택). null이면 시간 없음. due_date가 null이면 이것도 null이어야 한다.';

-- 날짜 없는 시간은 언제인지 알 수 없다.
alter table public.tasks drop constraint if exists tasks_due_time_needs_date_check;

alter table public.tasks
  add constraint tasks_due_time_needs_date_check
  check (due_time is null or due_date is not null);


-- ============================================================
--  9. 날짜별 회고 (v1.8)
--
--  하루에 하나씩 쓰는 회고. 날짜가 곧 열쇠라 (user_id, date)에 유일 제약을 건다.
-- ============================================================

create table if not exists public.reflections (
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

create index if not exists reflections_user_date_idx
  on public.reflections (user_id, date desc);

alter table public.reflections enable row level security;

revoke all on public.reflections from anon;
grant select, insert, update, delete on public.reflections to authenticated;

drop policy if exists "reflections: owner select" on public.reflections;
create policy "reflections: owner select" on public.reflections
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "reflections: owner insert" on public.reflections;
create policy "reflections: owner insert" on public.reflections
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "reflections: owner update" on public.reflections;
create policy "reflections: owner update" on public.reflections
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "reflections: owner delete" on public.reflections;
create policy "reflections: owner delete" on public.reflections
  for delete to authenticated using ((select auth.uid()) = user_id);


-- ============================================================
--  10. 글꼴 고르기 (v1.9)
--
--  테마와 똑같은 모양의 설정이다. 기본값은 지금까지 쓰던 조선굴림체라,
--  이 칸이 생겨도 보이는 건 그대로다.
-- ============================================================

alter table public.settings
  add column if not exists font text not null default 'joseon';

comment on column public.settings.font is
  '화면 전체에 쓰는 글꼴. 눈누(noonnu.cc) 무료 글꼴 중에서 고른다.';

alter table public.settings drop constraint if exists settings_font_check;

-- 이사만루를 뺐다. 그걸 고른 채로 남아 있으면 아래 제약에 걸리므로 먼저 되돌린다.
update public.settings set font = 'joseon' where font = 'isamanru';

alter table public.settings
  add constraint settings_font_check
  check (font in ('joseon', 'pretendard', 'nanumgothic', 'nanumround',
                  'kopub', 'gmarket', 'cafe24air', 'chosunmyungjo', 'ridibatang',
                  'parkdahyun', 'konkon', 'positive', 'kyobo2025',
                  'hakgyo', 'fromsol', 'mona12'));


-- ============================================================
--  11. 확인 — 아래 표가 전부 ✅ 면 성공입니다
-- ============================================================

with check_list(순서, 항목, 통과) as (
  select 1, 'categories 테이블이 생겼다', exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'categories')
  union all
  select 2, 'tasks.category_id 칸이 생겼다', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'category_id')
  union all
  select 3, 'tasks.is_starred 칸이 생겼다', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'is_starred')
  union all
  select 4, 'settings.filter_category_id 칸이 생겼다', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'settings' and column_name = 'filter_category_id')
  union all
  select 5, '옛 tasks.area 칸이 사라졌다', not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'area')
  union all
  select 6, '옛 settings.filter_area 칸이 사라졌다', not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'settings' and column_name = 'filter_area')
  union all
  select 10, 'settings.font 칸이 생겼다', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'settings' and column_name = 'font')
  union all
  select 9, 'reflections 테이블이 생겼다', exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'reflections')
  union all
  select 8, 'tasks.due_time 칸이 생겼다', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'due_time')
  union all
  select 7, '사진 위치 칸 4개가 생겼다', (
    select count(*) = 4 from information_schema.columns
    where table_schema = 'public' and table_name = 'settings'
      and column_name in ('profile_pos_x', 'profile_pos_y', 'banner_pos_x', 'banner_pos_y'))
)
select 항목, case when 통과 then '✅ 완료' else '❌ 실패' end as 결과
from check_list
order by 순서;
