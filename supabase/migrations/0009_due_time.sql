-- v1.7: 마감 시간(선택).
--
-- 날짜만으로는 '몇 시에'를 담을 수 없어서 time 컬럼을 하나 더한다. nullable이라
-- 기존 행은 전부 '시간 없음'으로 남는다.
--
-- timestamptz가 아니라 time인 이유: due_date가 이미 date(시간대 없는 날짜)라서,
-- 한쪽만 시간대를 갖게 하면 자정 부근에서 두 값이 서로 다른 날을 가리킬 수 있다.
-- 개인 플래너라 '내 시계로 몇 시'면 충분하다.

alter table public.tasks add column due_time time;

comment on column public.tasks.due_time is
  '마감 시간(선택). null이면 시간 없음. due_date가 null이면 이것도 null이어야 한다.';

-- 날짜 없는 시간은 언제인지 알 수 없다. 앱에서도 같이 비우지만 여기서도 막는다.
alter table public.tasks
  add constraint tasks_due_time_needs_date_check
  check (due_time is null or due_date is not null);
