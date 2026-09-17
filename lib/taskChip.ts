/**
 * 달력 칸에 붙는 일정 칩의 색.
 *
 * 애플 캘린더에서 색이 '어느 달력의 일정인지'를 알려주듯, 여기서는 **분류**가 색을
 * 정한다. 같은 분류면 늘 같은 색이라 한 달치를 훑을 때 덩어리로 읽힌다.
 *
 * 테마 변수를 쓰지 않고 색을 박아둔 이유: 테마 색은 화면 전체가 공유하는 한 가지
 * 계열이라(핑크면 전부 핑크) 분류끼리 구별이 안 된다. 여기서 필요한 건 '서로 다른
 * 여섯 가지'다. 전부 밝은 파스텔이라 어느 테마 위에 올려도 겉돌지 않는다.
 *
 * 분류를 지웠다 다시 만들면 id가 달라져 색도 바뀐다. 색 자체에 뜻이 있는 게 아니라
 * '이번 달 안에서 서로 다르다'가 요점이라 그대로 둔다.
 */
const CHIPS = [
  "bg-[#fbe6e9] text-[#9e5c66]",
  "bg-[#ebe6f7] text-[#685e96]",
  "bg-[#e0f0e7] text-[#48806a]",
  "bg-[#e5edf8] text-[#456b95]",
  "bg-[#fae7de] text-[#9d6350]",
  "bg-[#f7edd5] text-[#8a6a33]",
] as const;

/** 분류를 안 정한 일정. 색으로 묶을 것이 없으니 무채색으로 둔다. */
const PLAIN = "bg-[#f0eeed] text-[#766b67]";

/** 끝낸 일정. 색을 빼서 남은 일이 먼저 보이게 한다. */
const DONE = "bg-transparent text-ink-faint line-through";

export function chipColor(categoryId: number | null, done: boolean): string {
  if (done) return DONE;
  if (categoryId === null) return PLAIN;
  // id가 음수일 일은 없지만, 들어와도 배열 밖으로 나가지 않게 한다.
  return CHIPS[Math.abs(categoryId) % CHIPS.length];
}
