-- v1.11: 글꼴 여섯 종 추가.
--
-- KoPub돋움, G마켓 산스, 카페24 아네모네에어, 온글잎 긍정,
-- 교보문고 손글씨 2025, 학교안심 받아쓰기.
--
-- 오이냉체와 세종글꽃체는 뺐다. 둘 다 '무료 글꼴'이지만 임베딩(웹폰트)만 따로
-- '조건부 허용'이라 저작권자에게 먼저 물어야 한다.
--
-- 목록이 코드(lib/fonts.ts)와 DB 양쪽에 있어서 함께 넓혀야 한다.

alter table public.settings drop constraint settings_font_check;

alter table public.settings
  add constraint settings_font_check
  check (font in ('joseon', 'pretendard', 'nanumgothic', 'nanumround',
                  'kopub', 'gmarket', 'cafe24air', 'chosunmyungjo', 'ridibatang',
                  'parkdahyun', 'konkon', 'positive', 'kyobo2025',
                  'hakgyo', 'fromsol', 'mona12'));
