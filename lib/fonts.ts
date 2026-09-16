/**
 * 고를 수 있는 글꼴.
 *
 * 전부 눈누(noonnu.cc)에 올라온 무료 글꼴이고, jsdelivr CDN 주소를 그대로 쓴다.
 * 파일을 프로젝트에 두지 않는 이유는 한글 글꼴이 하나에 0.4~1.3MB씩 되기 때문이다 —
 * 열한 개를 저장소에 넣으면 배포 용량이 8MB 넘게 불어난다.
 *
 * **고른 글꼴 하나만 내려받는다.** 브라우저는 실제로 쓰이는 @font-face만 가져가므로,
 * 나머지 열 개는 파일을 건드리지도 않는다. 설정 모달을 열면 미리보기 때문에 전부
 * 받아오지만, 그건 한 번뿐이고 그 뒤로는 캐시에서 온다.
 *
 * 라이선스는 넣기 전에 눈누 페이지에서 하나씩 확인했다. 전부 **웹폰트 임베딩 허용 +
 * 상업적 이용 가능**이다. 새 글꼴을 더할 때도 반드시 확인할 것 — '무료 글꼴'이라도
 * 웹폰트만 따로 막아둔 것이 흔하다.
 */

export type FontId = (typeof FONTS)[number]["id"];

export const FONTS = [
  {
    id: "joseon",
    label: "조선굴림체",
    family: "JoseonGulim",
    /** 목록에서 이 글꼴이 어떤 느낌인지 한 줄로. */
    note: "동글동글한 기본 글꼴",
  },
  {
    id: "pretendard",
    label: "프리텐다드",
    family: "Pretendard",
    note: "화면에 최적화된 고딕",
  },
  {
    id: "nanumgothic",
    label: "나눔고딕",
    family: "NanumGothic",
    note: "익숙하고 무난한 고딕",
  },
  {
    id: "nanumround",
    label: "나눔스퀘어라운드",
    family: "NanumSquareRound",
    note: "모서리가 둥근 고딕",
  },
  {
    id: "chosunmyungjo",
    label: "조선일보명조체",
    family: "ChosunilboMyungjo",
    note: "차분한 명조",
  },
  {
    id: "ridibatang",
    label: "리디바탕",
    family: "RIDIBatang",
    note: "책 읽는 느낌의 바탕",
  },
  {
    id: "isamanru",
    label: "이사만루",
    family: "Isamanru",
    note: "묵직하고 각진 고딕",
  },
  {
    id: "parkdahyun",
    label: "온글잎 박다현체",
    family: "OngleipParkDahyeon",
    note: "또박또박한 손글씨",
  },
  {
    id: "konkon",
    label: "온글잎 콘콘체",
    family: "OngleipKonkon",
    note: "동글동글한 손글씨",
  },
  {
    id: "fromsol",
    label: "그리운 프롬솔",
    family: "DearFromsol",
    note: "편지지에 쓴 듯한 손글씨",
  },
  {
    id: "mona12",
    label: "Mona12",
    family: "Mona12",
    note: "도트(픽셀) 글꼴",
  },
] as const;

export const DEFAULT_FONT: FontId = "joseon";

const FONT_IDS: string[] = FONTS.map((f) => f.id);

export function isFontId(v: unknown): v is FontId {
  return typeof v === "string" && FONT_IDS.includes(v);
}

export function fontLabel(id: FontId): string {
  return FONTS.find((f) => f.id === id)!.label;
}

/**
 * 글꼴을 제공한 곳. 설정 모달 맨 아래에 적는다.
 *
 * 대부분은 출처 표시 의무가 없지만, 리디바탕은 라이선스에서 출처 표기를 권한다.
 * 한 곳만 적으면 왜 저것만 적혀 있는지 이상하니 전부 적는다.
 */
export const FONT_CREDITS =
  "글꼴 제공: 네이버, 조선일보, 리디주식회사, 공게임즈 X 폰트릭스, 온글잎(보이저엑스), 그리운, Monad ABXY, 길형진";
