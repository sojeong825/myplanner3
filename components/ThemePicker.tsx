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
      <div role="radiogroup" aria-label="테마" className="flex items-center justify-between px-1">
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
