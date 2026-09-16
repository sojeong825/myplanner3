import { describe, expect, it } from "vitest";
import { diffDays, formatTime, getDday } from "@/lib/date";

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

describe("formatTime", () => {
  it("오전·오후를 나눠 12시간제로 만든다", () => {
    expect(formatTime("09:30")).toBe("오전 9:30");
    expect(formatTime("15:00")).toBe("오후 3:00");
  });

  it("자정과 정오가 12시로 나온다", () => {
    // 0시를 '오전 0시'로 두면 12시간제가 아니다.
    expect(formatTime("00:00")).toBe("오전 12:00");
    expect(formatTime("12:00")).toBe("오후 12:00");
  });

  it("분은 두 자리를 유지한다", () => {
    expect(formatTime("13:05")).toBe("오후 1:05");
  });
});
