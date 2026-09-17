-- v1.13: 달력 보기에 '일간'을 더한다.
--
-- 좁은 화면에서 한 주를 일곱 칸으로 쪼개면 한 칸이 50px이라 제목이 들어가지 않는다.
-- 하루만 보는 화면이 있으면 그날 할 일을 목록으로 그대로 읽을 수 있다.
--
-- 제약을 **넓히는** 방향이라 기존 행을 먼저 고칠 일은 없다.

alter table public.settings drop constraint if exists settings_view_check;

alter table public.settings
  add constraint settings_view_check
  check (calendar_view in ('month', 'week', 'day'));
