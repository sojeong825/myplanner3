/**
 * 이모지 자동 매칭.
 *
 * v1.5부터 **사용자는 아이콘을 고르지 않는다.** 저장할 때 제목과 분류 이름을 보고
 * 여기서 정한다. 고르는 단계를 없앤 만큼 규칙이 전부라, 키워드를 추가할 때 고칠 곳이
 * 한 군데뿐이도록 이 파일에 모아둔다. 화면 어디에서도 제목을 보고 아이콘을 정하지 않는다.
 */

import { DEFAULT_ICON } from "@/lib/icons";

/**
 * 제목 키워드 → 이모지. **위에서부터 먼저 걸리는 것이 이긴다**.
 *
 * 그래서 순서가 규칙의 일부다. 예를 들어 '회의'가 '점심'보다 위에 있어서
 * "점심 회의"는 🍔가 아니라 💬가 된다. 뜻이 좁은 말을 위에, 여러 맥락에 두루 쓰이는
 * 말을 아래에 둔다 — 맨 아래 '약속·예약'이 가장 넓은 말이라 마지막에 온다.
 *
 * 한 글자짜리 키워드는 넣지 않는다 — '약' 하나를 넣으면 '약속·예약·계약'이 전부 걸린다.
 */
const RULES: { icon: string; keywords: string[] }[] = [
  {
    icon: "🎂",
    keywords: ["생일", "기념일", "돌잔치", "birthday"],
  },
  {
    icon: "🎉",
    keywords: ["축하", "파티", "결혼", "웨딩", "졸업", "환영", "집들이"],
  },
  {
    icon: "🏥",
    keywords: ["병원", "진료", "치과", "검진", "접종", "수술", "약국", "내과", "정형외과"],
  },
  {
    icon: "💪",
    keywords: ["운동", "헬스", "요가", "필라테스", "근력", "스트레칭", "pt", "gym", "workout"],
  },
  {
    icon: "🏃",
    keywords: ["러닝", "조깅", "등산", "수영", "마라톤", "산책", "자전거", "클라이밍"],
  },
  {
    icon: "💬",
    keywords: ["회의", "미팅", "면담", "인터뷰", "브리핑", "세미나", "발표", "meeting", "1on1"],
  },
  {
    icon: "📞",
    keywords: ["통화", "전화", "콜", "call"],
  },
  {
    icon: "✉️",
    keywords: ["메일", "이메일", "답장", "회신", "email"],
  },
  {
    icon: "💌",
    keywords: ["편지", "손편지", "카드쓰기", "감사인사"],
  },
  {
    icon: "📋",
    keywords: [
      "보고서", "서류", "제출", "결재", "견적", "신청서", "이력서", "정산", "청구",
      "계약서", "report",
    ],
  },
  {
    icon: "💻",
    keywords: ["개발", "배포", "릴리즈", "코딩", "코드", "버그", "리뷰", "deploy", "release"],
  },
  {
    icon: "📊",
    keywords: ["보고", "실적", "분석", "지표", "매출", "통계"],
  },
  {
    icon: "📁",
    keywords: ["프로젝트", "기획", "스프린트", "project"],
  },
  {
    icon: "💼",
    keywords: ["업무", "출근", "근무", "회사", "면접"],
  },
  {
    icon: "📚",
    keywords: ["공부", "수업", "강의", "독서", "시험", "과제", "스터디", "논문", "자격증", "study"],
  },
  {
    icon: "🛒",
    keywords: ["쇼핑", "장보기", "마트", "구매", "주문", "택배", "사오기", "사기"],
  },
  {
    icon: "💰",
    keywords: ["월세", "공과금", "세금", "저축", "적금", "카드값", "송금", "입금", "결제", "정기권"],
  },
  {
    icon: "🏠",
    keywords: ["청소", "이사", "집안일", "빨래", "설거지", "분리수거", "정리"],
  },
  {
    icon: "✈️",
    keywords: ["여행", "출장", "공항", "숙소", "항공", "비행기", "호텔"],
  },
  {
    icon: "🎁",
    keywords: ["선물", "기념품", "답례"],
  },
  {
    icon: "☕",
    keywords: ["커피", "카페", "티타임", "브런치"],
  },
  {
    icon: "🍔",
    keywords: ["점심", "저녁", "식사", "회식", "밥약", "맛집", "술자리", "디너", "런치"],
  },
  {
    icon: "❤️",
    keywords: ["데이트", "가족", "부모님", "안부", "기념"],
  },
  {
    icon: "❗",
    keywords: ["중요", "필수", "마감", "잊지말기", "긴급"],
  },
  {
    icon: "🤝",
    keywords: ["약속", "만남", "예약", "방문", "상담"],
  },
];

/** 제목에서 찾은 이모지. 걸리는 키워드가 없으면 null. */
export function iconFromTitle(title: string): string | null {
  const text = title.toLowerCase();
  if (!text.trim()) return null;

  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.icon;
  }
  return null;
}

/**
 * 제목과 분류 이름으로 정해지는 이모지.
 *
 * 분류 이름도 같은 키워드 표에 통과시킨다. 분류는 사용자가 직접 지은 이름이라
 * 미리 짝지어둘 수 없는데, '운동'·'공부'처럼 키워드에 이미 있는 말을 쓰는 경우가
 * 많아서 이것만으로도 꽤 맞는다. 제목에서 먼저 찾고, 못 찾으면 분류 이름을 본다.
 */
export function autoIcon(title: string, categoryName: string | null): string {
  return (
    iconFromTitle(title) ??
    (categoryName ? iconFromTitle(categoryName) : null) ??
    DEFAULT_ICON
  );
}
