-- v1.10: 글꼴 목록에서 이사만루를 뺀다.
--
-- 제약을 좁히기 전에 그 값을 쓰고 있는 행을 먼저 되돌려야 한다.
-- 안 그러면 기존 행이 새 제약을 위반해서 ALTER 자체가 실패한다.

alter table public.settings drop constraint settings_font_check;

update public.settings set font = 'joseon' where font = 'isamanru';

alter table public.settings
  add constraint settings_font_check
  check (font in ('joseon', 'pretendard', 'nanumgothic', 'nanumround',
                  'chosunmyungjo', 'ridibatang',
                  'parkdahyun', 'konkon', 'fromsol', 'mona12'));
