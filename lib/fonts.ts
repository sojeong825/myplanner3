/**
 * 고를 수 있는 글꼴.
 *
 * 전부 눈누(noonnu.cc)에 올라온 무료 글꼴이고, CDN 주소를 그대로 쓴다. 파일을
 * 프로젝트에 두지 않는 이유는 한글 글꼴이 하나에 0.3~3MB씩 되기 때문이다 —
 * 열여섯 개를 저장소에 넣으면 배포 용량이 15MB 넘게 불어난다.
 *
 * **고른 글꼴 하나만 내려받는다.** 브라우저는 실제로 쓰이는 @font-face만 가져가므로
 * 나머지는 파일을 건드리지도 않는다. 드롭다운을 펼치면 미리보기 때문에 전부
 * 받아오지만, 그건 한 번뿐이고 그 뒤로는 캐시에서 온다.
 *
 * 라이선스는 넣기 전에 눈누 페이지에서 하나씩 확인했다. 전부 **웹폰트 임베딩 허용 +
 * 상업적 이용 가능**이다. 새 글꼴을 더할 때도 반드시 확인할 것 — '무료 글꼴'이라도
 * 임베딩만 따로 '조건부 허용'으로 막아둔 것이 흔하다(오이냉체·세종글꽃체가 그래서 빠졌다).
 *
 * 크기는 눈대중으로 맞추지 않는다. 글꼴 파일을 열어 한글 대표 글자의 잉크 높이를 재고,
 * 조선굴림체를 기준으로 size-adjust를 계산했다(globals.css). 같은 13px이라도 글꼴마다
 * 글자가 em 박스를 채우는 정도가 달라서, 그러지 않으면 어떤 글꼴은 확연히 작아 보인다.
 */

export type FontId = (typeof FONTS)[number]["id"];

export const FONTS = [
  /* ── 고딕 ── */
  { id: "joseon", label: "조선굴림체", family: "JoseonGulim" },
  { id: "pretendard", label: "프리텐다드", family: "Pretendard" },
  { id: "nanumgothic", label: "나눔고딕", family: "NanumGothic" },
  { id: "nanumround", label: "나눔스퀘어라운드", family: "NanumSquareRound" },
  { id: "kopub", label: "KoPub돋움", family: "KoPubDotum" },
  { id: "gmarket", label: "G마켓 산스", family: "GMarketSans" },
  { id: "cafe24air", label: "카페24 아네모네에어", family: "Cafe24AnemoneAir" },

  /* ── 명조·바탕 ── */
  { id: "chosunmyungjo", label: "조선일보명조체", family: "ChosunilboMyungjo" },
  { id: "ridibatang", label: "리디바탕", family: "RIDIBatang" },

  /* ── 손글씨 ── */
  { id: "parkdahyun", label: "온글잎 박다현체", family: "OngleipParkDahyeon" },
  { id: "konkon", label: "온글잎 콘콘체", family: "OngleipKonkon" },
  { id: "positive", label: "온글잎 긍정", family: "OngleipPositive" },
  { id: "kyobo2025", label: "교보문고 손글씨 2025", family: "KyoboHandwriting2025" },
  { id: "hakgyo", label: "학교안심 받아쓰기", family: "HakgyoansimBadasseugi" },
  { id: "fromsol", label: "그리운 프롬솔", family: "DearFromsol" },

  /* ── 도트 ── */
  { id: "mona12", label: "Mona12", family: "Mona12" },
] as const;

export const DEFAULT_FONT: FontId = "joseon";

const FONT_IDS: string[] = FONTS.map((f) => f.id);

export function isFontId(v: unknown): v is FontId {
  return typeof v === "string" && FONT_IDS.includes(v);
}

export function fontLabel(id: FontId): string {
  return FONTS.find((f) => f.id === id)!.label;
}
