"use client";

import PlannerName from "@/components/PlannerName";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemePicker from "@/components/ThemePicker";
import type { SaveResult, ThemeId } from "@/lib/settings";

type Props = {
  pendingCount: number;
  dueTodayCount: number;
  doneCount: number;
  /** null이면 게스트 */
  email: string | null;
  plannerName: string;
  profileImage: string | null;
  theme: ThemeId;
  onNameChange: (name: string) => void;
  onProfileChange: (dataUrl: string | null) => Promise<SaveResult>;
  onThemeChange: (theme: ThemeId) => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between px-1 py-2">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <span className="text-[15px] font-medium text-ink">{value}</span>
    </div>
  );
}

export default function Sidebar({
  pendingCount,
  dueTodayCount,
  doneCount,
  email,
  plannerName,
  profileImage,
  theme,
  onNameChange,
  onProfileChange,
  onThemeChange,
  onSignIn,
  onSignOut,
}: Props) {
  const signedIn = email !== null;

  return (
    <aside className="sticky top-0 flex h-screen w-[204px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-card px-5 py-8">
      {signedIn ? (
        // 로그인: 프로필 사진 → 이름 + 연필 → 통계 → 테마 → 로그아웃
        <div className="flex flex-col items-center gap-2.5">
          <ProfileAvatar image={profileImage} onChange={onProfileChange} />
          <div className="w-full">
            <PlannerName name={plannerName} onSave={onNameChange} />
          </div>
        </div>
      ) : (
        // 게스트: 프로필 사진·이름 수정을 감추고 로그인 유도 카드를 둔다.
        <div className="rounded-card border border-line bg-soft/50 p-4 text-center">
          <p className="break-keep text-[12px] leading-relaxed text-ink">
            로그인하면 어디서든
            <br />
            내 플래너를 볼 수 있어요
          </p>
          <p className="mt-1.5 break-keep text-[11px] leading-relaxed text-ink-faint">
            지금 쓴 내용은 이 브라우저에만 저장돼요
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-3 w-full rounded-full bg-accent py-2 text-[12px] font-medium text-white transition hover:bg-accent-deep"
          >
            이메일로 시작하기
          </button>
        </div>
      )}

      {/* 카드류는 전부 흰 배경 + 보더로 통일 */}
      <div className="rounded-card border border-line bg-card px-3 py-2">
        <Stat label="남은 할 일" value={pendingCount} />
        <div className="h-px bg-line" />
        <Stat label="오늘 마감" value={dueTodayCount} />
        <div className="h-px bg-line" />
        <Stat label="완료" value={doneCount} />
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <ThemePicker value={theme} onChange={onThemeChange} />

        {signedIn && (
          <div className="border-t border-line pt-3">
            <p className="truncate px-1 text-[11px] text-ink-faint" title={email}>
              {email}
            </p>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-1 px-1 text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
