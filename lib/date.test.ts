import { describe, expect, it } from "vitest";
import { diffDays, getDday } from "@/lib/date";

const TODAY = "2026-09-13";

describe("getDday", () => {
  it("오늘 마감은 '오늘'", () => {
    const d = getDday(TODAY, TODAY);
    expect(d.label).toBe("오늘");
    expect(d.today).toBe(true);
    expect(d.overdue).toBe(false);
  });

  it("앞으로 남은 일정은 D- 표기", () => {
    expect(getDday("2026-09-16", TODAY).label).toBe("D-3");
    expect(getDday("2026-09-23", TODAY).label).toBe("D-10");
  });

  it("지난 일정은 'N일 지남' — D+가 아니다", () => {
    // '지난 일정' 탭에서 한눈에 읽히도록 방향이 다른 표기를 쓴다.
    expect(getDday("2026-09-12", TODAY).label).toBe("1일 지남");
    expect(getDday("2026-08-30", TODAY).label).toBe("14일 지남");
    expect(getDday("2026-09-12", TODAY).overdue).toBe(true);
  });

  it("달과 해를 넘겨도 일수가 맞는다", () => {
    expect(diffDays("2027-01-01", "2026-12-31")).toBe(1);
    expect(diffDays("2026-10-01", "2026-09-30")).toBe(1);
    // 2028은 윤년이라 2월이 29일이다.
    expect(diffDays("2028-03-01", "2028-02-28")).toBe(2);
  });
});
