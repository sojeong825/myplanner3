# my planner

할 일을 입력하고, 마감을 확인하고, 완료로 넘기는 최소 일정 관리 템플릿.
Next.js(App Router) + Supabase.

## 실행

```bash
npm install
cp .env.example .env.local   # Supabase URL / publishable key 입력
npm run dev
```

## 화면 구성

한 화면에 네 가지 기능이 들어간다.

| 기능 | 위치 |
|---|---|
| Task 입력·수정·삭제 (모달) | `+ 일정 추가` 버튼 / 할 일 클릭 → `components/TaskModal.tsx` |
| 완료 처리 | 오른쪽 `할 일` 목록 체크박스 → `components/TaskList.tsx` |
| 다가오는 일정 (D-day) | 오른쪽 위 카드 → `components/DdayList.tsx` |
| 달력 (월간/주간) | 가운데 → `components/Calendar.tsx` + `MonthGrid` / `WeekGrid` |
| 프로필 사진 | 사이드바 상단 아바타 → `components/ProfileAvatar.tsx` |
| 플래너 이름 | 이름 옆 연필 → `components/PlannerName.tsx` |
| 테마 변경 | 사이드바 하단 색상 팔레트 → `components/ThemePicker.tsx` |
| 카운터 · 배너 | 가운데 상단 → `CounterCard` / `BannerCard` |

레이아웃은 왼쪽 사이드바(고정) · 가운데 본문(스크롤) · 오른쪽 목록(고정)이다.

```
[사이드바]  [ D+ 카운터 ][ 배너 이미지 ]  [ 다가오는 일정 ]
            [ 달력 (월간/주간)         ]  [ 할 일              ]
```

카운터와 배너는 비어 있어도 안내 문구가 자리를 지키므로, 아무것도 채우지 않은 상태에서도
화면이 깨지지 않는다. 둘 다 카드에 마우스를 올리면 편집·변경 버튼이 나온다.

## 개인화 (v1.1)

로그인이 없으므로 세 설정 모두 `localStorage`(`my-planner:settings`)에 보관한다.
Task 데이터와는 완전히 분리돼 있고, 새로고침해도 유지된다.

### 테마

`app/globals.css`의 `:root[data-theme="..."]` 블록이 팔레트 전부다.
컴포넌트는 `canvas / card / line / ink / soft / accent` 같은 의미 이름만 쓰므로,
블록을 하나 더 추가하고 `THEMES` 배열에 항목을 넣으면 새 테마가 붙는다.
컴포넌트는 건드릴 필요가 없다.

색이 찍히는 자리(버튼, 월간/주간 토글 활성, 달력 오늘 표시, 할 일 아이콘 기본값)는
**예외 없이 `--accent`를 참조**한다. 값을 직접 적지 말 것 — 적는 순간 테마를 따라가지
않는다. 이전에 있던 별도 버튼 색(`--btn`)은 이 규칙에 어긋나서 없앴다.

`@theme inline`을 쓴 이유는 Tailwind 유틸리티가 색 값을 복사하지 않고 `var()`를
그대로 참조하게 하기 위해서다. 그래야 루트 변수만 바꿔도 즉시 반영된다.

**배경 그라데이션**(`--bg-gradient`)은 테마마다 따로 정의하고 `body` 한 곳에서만 칠한다.
지킬 것 세 가지:

- `background-color`가 아니라 `background`(또는 `background-image`)로 넣는다.
  그라데이션은 색이 아니라 이미지라서 `background-color`에 넣으면 조용히 무시된다.
- `background-attachment: fixed` — 스크롤해도 그라데이션이 늘어나지 않고 화면에 고정된다.
- 화면을 덮는 최상위 래퍼(`app/page.tsx`의 바깥 `div`)에 배경을 주지 않는다.
  단색 배경이 하나라도 있으면 body가 가려진다.

확인은 개발자 도구에서 `body`의 computed style에 `background-image: linear-gradient(...)`가
잡히는지 보면 된다. `none`이면 첫 번째나 세 번째, 잡히는데 안 보이면 두 번째 문제다.

배경 중간이 흰색이라 흰 카드가 묻히므로 카드에는 `shadow-card`(아주 옅은 그림자)를 준다.
카드류(달력, 할 일, 다가오는 일정, 카운터, 배너, 사이드바 통계)는 전부 흰 배경 +
보더로 통일한다. 반면 **카드 안쪽 항목은 보더도 그림자도 없이 여백(8px)만으로 구분**한다.
완료 항목도 같은 규칙이고 텍스트와 아이콘만 흐리게 + 취소선으로 처리한다.

새로고침 시 기본 핑크가 한 프레임 보이는 걸 막으려고, `lib/settings.ts`의
`THEME_BOOT_SCRIPT`를 `<head>`에 인라인으로 넣어 첫 페인트 전에 `data-theme`을 맞춘다.

### 프로필 사진 · 배너 이미지

둘 다 같은 업로드 경로(`lib/image.ts`)를 쓴다. jpg / png / webp, 5MB 이하만 받고,
저장 전에 캔버스로 **가운데를 목표 비율로 잘라 줄인 뒤** webp data URL로 넣는다.
프로필은 256×256, 배너는 960×384(2.5:1)다.

원본을 그대로 base64로 넣으면 5MB 파일이 약 6.7MB가 되어 localStorage 한도(보통 5MB)를
넘긴다. 표시가 cover라 원본 해상도가 필요 없어서 줄여 저장한다.

### 주간 뷰

가로 7일(일~토) 컬럼에 해당일 마감 Task를 카드로 세로 나열한다. 오늘 컬럼은 강조되고,
완료 Task는 월간과 같은 규칙(취소선 + 흐린 색)을 따른다.

참고 레퍼런스는 시간대 세로축이 있는 event 캘린더지만, 현재 `due_date`는 날짜 단위라
시간 정보가 없다. 그래서 **시간축 없이 날짜 컬럼 + 카드 목록** 형태로 만들었다.
`due_date`를 날짜+시간으로 넓힐 때 시간축을 함께 검토하면 된다.

주간 데이터는 따로 저장하지 않는다. 월간과 같은 `tasksByDate` 맵을 이번 주 날짜로만
읽는 파생 뷰다.

### 할 일 수정

달력(월간·주간), 할 일 목록, D-day 목록 어디서든 할 일을 클릭하면 수정 모달이 열린다.
새 모달을 따로 만들지 않고 `TaskModal`에 `task` prop을 넘겨 추가/수정을 겸한다
(`task`가 null이면 추가). 삭제는 모달 우측 상단의 휴지통 아이콘을 누르면 확인 모달(취소 / 삭제하기)이 뜬다.
Esc나 바깥 클릭은 확인 모달만 닫고 수정 모달은 남긴다.

할 일 목록에서는 **체크박스와 이름 영역의 클릭 범위가 분리**돼 있다. 체크박스는 완료
토글, 이름 영역은 수정 모달이다. 완료된 할 일도 똑같이 수정할 수 있고, 완료 상태는
모달에서 바꾸지 않는다(체크박스 역할).

## 데이터

저장하는 엔티티는 `tasks` 한 벌뿐이다. 달력과 D-day 목록은 별도 테이블이 아니라
같은 데이터를 마감일 기준으로 다르게 보여주는 파생 뷰다.

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | bigint identity | 시스템 자동 부여, 화면 비노출 |
| `title` | text | 필수. 공백만 있으면 DB check 제약으로 거부 |
| `due_date` | date | 선택. 없으면 D-day 목록·달력에 나오지 않음 |
| `is_done` | boolean | 기본값 false |
| `created_at` | timestamptz | 자동 기록 |
| `icon` | text | `circle` / `star` / `heart` / `triangle` / `square`. null이면 circle |
| `icon_color` | text | HEX 문자열. null이면 현재 테마의 `--accent` |

`icon` / `icon_color`는 nullable이라 이 컬럼이 생기기 전에 저장된 할 일도 그대로 읽힌다.
아이콘은 유니코드 문자(★♥▲) 대신 인라인 SVG로 그린다 — 문자는 OS·브라우저마다 모양과
크기가 달라 정렬이 흔들린다. 5종 모두 `lib/icons.tsx` 한 곳에 있다.

모달에서 색을 고르지 않으면 저장 시점의 `--accent` 값을 굳혀서 넣는다. 반대로
`icon_color`가 null인 할 일은 `fill="var(--accent)"`로 그려서 테마를 바꾸면 함께 바뀐다.
완료된 할 일은 아이콘도 `--ink-faint` 톤으로 흐려진다.

스키마는 `supabase/migrations/0001_create_tasks.sql`.

### 계산해서 쓰는 값 (저장하지 않음)

- **D-day** — `due_date − 오늘`을 매번 계산 (`lib/date.ts`의 `getDday`).
  당일은 `D-Day`, 남았으면 `D-2`, 마감이 지났으면 `D+2`로 표기한다.
- **다가오는 일정** — `is_done = false` AND `due_date`가 있고 AND 아직 마감 전
  (D-Day 포함)인 것만, 마감일 오름차순. 마감이 지난 항목은 '남은 일정'이 아니라서 빠진다.
  카드 높이는 `50vh`로 묶여 있고 넘치면 안에서만 스크롤한다.
- **달력 배치** — `due_date`가 있는 Task를 해당 날짜 칸에 표시.

날짜는 전부 `'YYYY-MM-DD'` 문자열로 다룬다. `Date` 객체로 왕복시키면 UTC 파싱 때문에
하루가 밀릴 수 있어서, 일수 계산은 `Date.UTC` 기준으로만 뺀다.

## 보안 메모

로그인이 스코프 밖이라 `tasks` 테이블의 RLS 정책은 `anon` 롤에 읽기/쓰기를 모두 열어두었다.
**즉, publishable key를 아는 사람은 누구나 이 데이터를 읽고 쓸 수 있다.** 개인용 템플릿을
공개 배포하려면 `user_id` 컬럼을 추가하고 정책을 소유권 기준(`auth.uid() = user_id`)으로
좁혀야 한다.

### Settings

사이드바 순서는 프로필 사진 → 이름 + 연필 → 통계 카드 → 테마다.
프로필 사진은 사진이 없으면 클릭 시 곧장 파일 선택으로 가고, 있으면 팝오버로
`다른 사진 업로드 / 사진 삭제`를 고르게 한다(바깥 클릭·Esc로 닫힘).
이름은 연필을 눌러 인라인 편집하며 Enter·바깥 클릭이 저장, Esc가 취소,
빈 값은 기본값 `my planner`로 되돌아간다.

배너 카드는 높이 180px 고정에 `object-fit: cover`라, 세로로 길거나 납작한 이미지를
올려도 레이아웃이 밀리지 않는다. placeholder 상태와 이미지 상태의 높이가 같다.

| 필드 | 값 | 기본값 |
|---|---|---|
| `planner_name` | 문자 (20자) | `my planner` |
| `profile_image` | data URL (webp), 256×256 | `null` |
| `theme` | `pink` / `lavender` / `mint` / `cream` / `gray` | `pink` |
| `calendar_view` | `month` / `week` | `month` |
| `banner_image` | data URL (webp), 960×384 | `null` |
| `counter_date` | `'YYYY-MM-DD'` | `null` |
| `counter_label` | 문자 (20자) | `시작한 날` |

읽을 때 형식을 검사해서(`coerce`) 손상된 값이나 손으로 고친 값이 들어와도 기본값으로
떨어지게 했다. 저장이 실패하면(용량 초과 등) 화면 상태도 되돌려서 표시와 저장 내용이
어긋나지 않는다.

## 범위 밖

로그인, 관리자 페이지, 검색. 2차 확장 후보로 남긴 것: 카테고리, 메모,
완료 시각(`completed_at`), 반복 일정, 시간 단위 일정.

v1.1 기준 제외: 크롭·회전 편집 UI, 여러 장 관리, 이미지 서버 업로드,
다크 모드, 커스텀 컬러 피커, 폰트 변경.

여러 탭을 동시에 열어도 서로의 변경은 실시간으로 반영되지 않는다(새로고침 필요).
Realtime 구독은 넣지 않았다.
