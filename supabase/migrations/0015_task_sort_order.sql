-- v1.14: 달력 한 칸 안에서 손으로 정한 순서.
--
-- 지금까지 한 날짜 안의 순서는 '별표 먼저 → 이른 시간 → 먼저 만든 것'으로 자동이었다.
-- 끌어서 옮길 수 있게 되면서, 손으로 정한 순서가 있으면 그게 자동 규칙을 이긴다.
--
-- null은 '아직 손대지 않음'이다. 기본값을 두지 않는 이유 — 0으로 채워버리면 손으로
-- 정한 순서와 그냥 기본값을 구별할 수 없다.

alter table public.tasks
  add column if not exists sort_order integer;

comment on column public.tasks.sort_order is
  '달력 한 칸 안에서 손으로 정한 순서. null이면 자동 정렬을 따른다.';
