-- v1.9: 글꼴 고르기.
--
-- 테마와 똑같은 모양의 설정이다 — 값 하나를 저장하고 화면은 data-font로 갈아끼운다.
-- 기본값은 지금까지 쓰던 조선굴림체라, 이 컬럼이 생겨도 보이는 건 그대로다.
--
-- 목록이 코드(lib/fonts.ts)와 DB 양쪽에 있다. 글꼴을 더할 때는 이 제약도 함께
-- 넓혀야 한다 — 넓히지 않으면 고르는 순간 저장이 실패한다.

alter table public.settings
  add column font text not null default 'joseon';

comment on column public.settings.font is
  '화면 전체에 쓰는 글꼴. 눈누(noonnu.cc) 무료 글꼴 중에서 고른다.';

alter table public.settings
  add constraint settings_font_check
  check (font in ('joseon', 'pretendard', 'nanumgothic', 'nanumround',
                  'chosunmyungjo', 'ridibatang', 'isamanru',
                  'parkdahyun', 'konkon', 'fromsol', 'mona12'));
