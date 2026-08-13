-- 할 일에 붙이는 짧은 메모.
-- nullable로 두어 기존 행은 null로 남는다. 앱은 null과 빈 문자열을 모두 '메모 없음'으로
-- 읽고, 저장할 때도 공백만 남으면 null로 넣는다 — 빈 문자열이 섞이면 판정이 두 갈래가 된다.

alter table public.tasks add column memo text;

alter table public.tasks
  add constraint tasks_memo_len_check
  check (memo is null or char_length(memo) <= 500);

comment on column public.tasks.memo is '할 일에 대한 짧은 메모. null이면 메모 없음.';
