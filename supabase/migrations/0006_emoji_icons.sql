-- v1.4: 아이콘을 프리셋 이름(SVG)에서 이모지 문자로 바꾼다.
--
-- 컬럼은 그대로 두고 저장하는 값의 종류만 바뀐다. 'circle' 같은 이름 대신 '📌'이 들어간다.
-- 앱도 읽을 때 옛 이름을 이모지로 옮겨주므로(lib/icons.ts의 LEGACY_ICONS) 아래 UPDATE가
-- 늦게 실행돼도 화면은 깨지지 않는다. 그래도 값이 두 종류로 섞여 있는 게 낫지 않아서
-- 여기서 한 번에 정리한다.

-- 목록을 열거하던 제약을 먼저 푼다. 이모지는 종류를 미리 다 적을 수 없다.
alter table public.tasks drop constraint tasks_icon_check;

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

-- 값을 열거하는 대신 길이만 막는다. 이모지 하나는 이어붙인 것까지 쳐도 넉넉히 8자 안이다
-- (❤️·✈️처럼 변이 선택자가 붙으면 2코드포인트, 깃발·가족 이모지는 더 길다).
alter table public.tasks
  add constraint tasks_icon_len_check
  check (icon is null or char_length(icon) between 1 and 8);

comment on column public.tasks.icon is
  '이모지 문자. null이면 📌으로 표시. v1.3까지는 프리셋 이름이었다.';

-- 이모지는 CSS로 색을 입힐 수 없어서 색상 선택 UI를 없앴다.
-- 컬럼은 지우지 않는다 — 되돌리기 쉽게 두고, 새로 저장하는 행은 null로 들어간다.
comment on column public.tasks.icon_color is
  '더 이상 화면에 쓰지 않는다(v1.4). 예전 데이터 보존용.';
