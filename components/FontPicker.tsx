"use client";

import { FONT_CREDITS, FONTS, type FontId } from "@/lib/fonts";

type Props = {
  value: FontId;
  onChange: (font: FontId) => void;
};

/**
 * 글꼴 고르기.
 *
 * **글꼴 이름을 그 글꼴로 그린다.** 이름만 나열하면 '리디바탕'이 어떻게 생겼는지
 * 알 수가 없어서, 결국 하나씩 눌러보며 찾게 된다.
 *
 * 그 대가로 이 목록이 처음 열릴 때 열한 개 글꼴을 전부 내려받는다(합쳐서 7MB 남짓).
 * 설정 모달 안에 있어서 **모달을 열기 전까지는 한 글자도 받지 않고**, 한 번 받으면
 * 그 뒤로는 캐시에서 온다. 평소 화면은 고른 글꼴 하나만 받는다.
 */
export default function FontPicker({ value, onChange }: Props) {
  return (
    <div>
      <div role="radiogroup" aria-label="글꼴" className="flex flex-col gap-0.5">
        {FONTS.map((font) => {
          const active = font.id === value;
          return (
            <button
              key={font.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(font.id)}
              className={`flex items-baseline gap-2 rounded-lg px-2 py-2 text-left transition ${
                active ? "bg-soft" : "hover:bg-soft/50"
              }`}
            >
              {/*
                이름을 그 글꼴로 그린다. 폴백을 같이 적어두는 이유는 CDN이 늦을 때
                글자가 사라지지 않게 하기 위해서다.
              */}
              <span
                style={{ fontFamily: `"${font.family}", var(--font-noto-kr), sans-serif` }}
                className={`text-[15px] ${active ? "text-ink" : "text-ink-mid"}`}
              >
                {font.label}
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{font.note}</span>
            </button>
          );
        })}
      </div>

      {/*
        대부분은 출처 표시 의무가 없지만 리디바탕은 라이선스에서 표기를 권한다.
        한 곳만 적으면 왜 저것만 적혀 있는지 이상해서 전부 적는다.
      */}
      <p className="px-2 pt-2 text-[10px] leading-relaxed text-ink-faint">{FONT_CREDITS}</p>
    </div>
  );
}
