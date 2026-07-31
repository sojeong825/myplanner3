"use client";

import PlannerName from "@/components/PlannerName";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemePicker from "@/components/ThemePicker";
import type { SaveResult, ThemeId } from "@/lib/settings";

type Props = {
  pendingCount: number;
  dueTodayCount: number;
  doneCount: number;
  plannerName: string;
  profileImage: string | null;
  theme: ThemeId;
  onNameChange: (name: string) => void;
  onProfileChange: (dataUrl: string | null) => SaveResult;
  onThemeChange: (theme: ThemeId) => void;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between px-1 py-2">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <span className="font-mono text-[15px] font-medium text-ink">{value}</span>
    </div>
  );
}

export default function Sidebar({
  pendingCount,
  dueTodayCount,
  doneCount,
  plannerName,
  profileImage,
  theme,
  onNameChange,
  onProfileChange,
  onThemeChange,
}: Props) {
  return (
    <aside className="sticky top-0 flex h-screen w-[204px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-card px-5 py-8">
      {/* 프로필 사진 → 이름 + 연필 → 통계 → 테마 */}
      <div className="flex flex-col items-center gap-2.5">
        <ProfileAvatar image={profileImage} onChange={onProfileChange} />
        <div className="w-full">
          <PlannerName name={plannerName} onSave={onNameChange} />
        </div>
      </div>

      {/* 카드류는 전부 흰 배경 + 보더로 통일 */}
      <div className="rounded-card border border-line bg-card px-3 py-2">
        <Stat label="남은 할 일" value={pendingCount} />
        <div className="h-px bg-line" />
        <Stat label="오늘 마감" value={dueTodayCount} />
        <div className="h-px bg-line" />
        <Stat label="완료" value={doneCount} />
      </div>

      <div className="mt-auto">
        <ThemePicker value={theme} onChange={onThemeChange} />
      </div>
    </aside>
  );
}
