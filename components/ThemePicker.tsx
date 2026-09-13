"use client";

import { THEMES, type ThemeId } from "@/lib/settings";

type Props = {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
};

export default function ThemePicker({ value, onChange }: Props) {
  return (
    <div>
      <p className="px-1 pb-2 text-[11px] text-ink-soft">테마</p>
      {/*
        사이드바 안쪽 폭이 164px이라 20px 스와치는 한 줄에 다섯 개까지만 들어간다.
        justify-between으로 늘려두면 테마를 더할 때마다 조용히 삐져나가므로 wrap으로 둔다.
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
