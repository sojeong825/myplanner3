-- 할 일에 아이콘/색상 추가.
-- nullable로 두어 기존 행은 null로 남기고, 앱이 읽을 때
-- circle + 현재 테마 --accent로 처리하므로 데이터 마이그레이션이 필요 없다.

alter table public.tasks
  add column icon text,
  add column icon_color text;

alter table public.tasks
  add constraint tasks_icon_check
  check (icon is null or icon in ('circle', 'star', 'heart', 'triangle', 'square'));

alter table public.tasks
  add constraint tasks_icon_color_check
  check (icon_color is null or icon_color ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.tasks.icon is '프리셋 키. null이면 circle로 표시.';
comment on column public.tasks.icon_color is 'HEX 문자열. null이면 현재 테마의 --accent로 표시.';
