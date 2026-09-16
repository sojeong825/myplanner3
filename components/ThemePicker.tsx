"use client";

import { THEMES, type ThemeId } from "@/lib/settings";

type Props = {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
};

export default function ThemePicker({ value, onChange }: Props) {
  return (
    <div>
      {/*
        설정 모달 안에 들어가므로 제목은 모달이 붙인다 — 여기서 또 붙이면 "테마"가 두 번 나온다.
        스와치는 wrap으로 둔다. 한 줄에 몇 개가 들어가는지는 모달 폭에 달렸고,
        테마를 더할 때마다 조용히 삐져나가는 일이 없어야 한다.
      */}
      <div role="radiogroup" aria-label="테마" className="flex flex-wrap items-center gap-2.5 px-1">
        {THEMES.map((theme) => {
          const active = theme.id === value;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={theme.label}
              title={theme.label}
              onClick={() => onChange(theme.id)}
              className={`size-5 rounded-full transition ${
                active
                  ? "ring-2 ring-ink-soft ring-offset-2 ring-offset-card"
                  : "ring-1 ring-line hover:ring-ink-faint"
              }`}
              style={{ backgroundColor: theme.swatch }}
            />
          );
        })}
      </div>
    </div>
  );
}
