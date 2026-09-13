-- v1.6: 사진이 잘려 보일 위치를 사용자가 정한다.
--
-- 전까지는 업로드할 때 가운데를 잘라 정사각형/2.5:1로 저장했다. 그러면 잘려나간
-- 부분이 영영 사라져서, 나중에 '조금 위를 보여달라'고 할 방법이 없었다.
-- 이제 사진은 원본 비율 그대로 저장하고, 어디를 보여줄지는 아래 값이 정한다.
-- 화면에서는 object-cover + object-position으로 그린다.
--
-- 기본값 50은 가운데 — 이미 잘려 저장된 기존 사진은 비율이 딱 맞아서 예전과
-- 똑같이 보인다. 다만 이미 잘린 사진은 옮길 여백이 없어서, 위치를 바꾸려면
-- 다시 올려야 한다.

alter table public.settings
  add column profile_pos_x smallint not null default 50,
  add column profile_pos_y smallint not null default 50,
  add column banner_pos_x  smallint not null default 50,
  add column banner_pos_y  smallint not null default 50;

comment on column public.settings.profile_pos_x is
  '프로필 사진이 원형 틀에서 보일 가로 위치(0~100%). 50이면 가운데.';
comment on column public.settings.banner_pos_x is
  '배너가 2.5:1 틀에서 보일 가로 위치(0~100%). 50이면 가운데.';

-- object-position은 0~100% 밖을 받지 않는다. 앱에서도 같은 범위로 자르지만,
-- 손으로 고친 값이 들어오는 길을 여기서도 막는다.
alter table public.settings
  add constraint settings_image_pos_check
  check (
    profile_pos_x between 0 and 100
    and profile_pos_y between 0 and 100
    and banner_pos_x between 0 and 100
    and banner_pos_y between 0 and 100
  );
