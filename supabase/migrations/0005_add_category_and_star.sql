-- v1.3: 일/일상 분류, 특별 일정(별표), 테마 4종 추가.
--
-- 새 컬럼은 전부 nullable 또는 default라 기존 행은 손대지 않는다.
-- 분류가 없는 기존 할 일은 '미분류'로 남고 '전체 보기'에서만 보인다 — 0002(icon),
-- 0004(memo)와 같은 방식이라 데이터 마이그레이션이 필요 없다.

/* ------------------------------- tasks ---------------------------------- */

alter table public.tasks
  add column area       text,
  add column category   text,
  add column is_starred boolean not null default false;

-- 'group'은 Postgres 예약어라 쓸 때마다 따옴표를 강제한다. 그래서 area로 둔다.
comment on column public.tasks.area is
  '상위 영역. ''work'' | ''life'' | null(미분류).';
comment on column public.tasks.category is
  '하위 카테고리. area가 null이면 이것도 반드시 null이어야 한다.';
comment on column public.tasks.is_starred is
  '특별 일정 표시. 목록 최상단으로 올라가고 달력에서도 강조된다.';

alter table public.tasks
  add constraint tasks_area_check
  check (area is null or area in ('work', 'life'));

-- 상위와 하위를 따로 두면 '일 + 운동' 같은 짝이 섞일 수 있다.
-- 개별 컬럼이 아니라 (area, category) 쌍 자체에 제약을 걸어야 이게 막힌다.
alter table public.tasks
  add constraint tasks_category_pair_check
  check (
    category is null
    or (area = 'work' and category in ('task', 'meeting', 'project'))
    or (area = 'life' and category in ('appointment', 'exercise', 'personal'))
  );

/* ------------------------------ settings -------------------------------- */

alter table public.settings
  add column filter_area     text,
  add column filter_category text;

comment on column public.settings.filter_area is
  '일/일상 필터. calendar_view와 같은 성격의 보기 상태. null이면 전체 보기.';

alter table public.settings
  add constraint settings_filter_area_check
  check (filter_area is null or filter_area in ('work', 'life'));

alter table public.settings
  add constraint settings_filter_pair_check
  check (
    filter_category is null
    or (filter_area = 'work' and filter_category in ('task', 'meeting', 'project'))
    or (filter_area = 'life' and filter_category in ('appointment', 'exercise', 'personal'))
  );

-- 테마 4종 추가. 기존 제약을 갈아끼운다.
alter table public.settings drop constraint settings_theme_check;

alter table public.settings
  add constraint settings_theme_check
  check (theme in ('pink', 'lavender', 'mint', 'cream', 'gray',
                   'blue', 'sage', 'coral', 'mocha'));

/* ------------------------------ 아이콘 제약 ------------------------------- */

-- 0002에서 5종으로 좁혀둔 제약을 15종으로 넓힌다.
-- 앞의 5종은 이미 저장된 값이라 반드시 남겨야 한다.
alter table public.tasks drop constraint tasks_icon_check;

alter table public.tasks
  add constraint tasks_icon_check
  check (icon is null or icon in (
    'circle', 'star', 'heart', 'triangle', 'square',
    'document', 'chat', 'folder', 'cup', 'dumbbell',
    'cake', 'cross', 'book', 'bag', 'pin'
  ));
