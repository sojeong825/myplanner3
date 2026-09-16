"use client";

import CategoryFilter from "@/components/CategoryFilter";
import PlannerName from "@/components/PlannerName";
import ProfileAvatar from "@/components/ProfileAvatar";
import type { Category, CategoryFilter as Filter } from "@/lib/categories";
import type { SaveResult } from "@/lib/settings";

type Props = {
  pendingCount: number;
  dueTodayCount: number;
  doneCount: number;
  categories: Category[];
  /** 화면 전체가 공유하는 필터. 여기에는 고르는 자리만 있고 적용은 호출부에서 한다. */
  filter: Filter;
  onFilterChange: (next: Filter) => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (category: Category) => void;
  /** null이면 게스트 */
  email: string | null;
  plannerName: string;
  profileImage: string | null;
  /** 프로필 사진이 원형 틀에서 보일 위치(0~100%). */
  profileX: number;
  profileY: number;
  onNameChange: (name: string) => void;
  onProfileChange: (next: {
    image?: string | null;
    x?: number;
    y?: number;
  }) => Promise<SaveResult>;
  /** 테마·알림·계정은 전부 설정 모달로 옮겼다. 여기에는 여는 버튼만 있다. */
  onOpenSettings: () => void;
  onSignIn: () => void;
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
  categories,
  filter,
  onFilterChange,
  onAddCategory,
  onRemoveCategory,
  email,
  plannerName,
  profileImage,
  profileX,
  profileY,
  onNameChange,
  onProfileChange,
  onOpenSettings,
  onSignIn,
}: Props) {
  const signedIn = email !== null;

  return (
    <aside className="sticky top-0 flex h-screen w-[204px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-card px-5 py-8">
      {signedIn ? (
        // 로그인: 프로필 사진 → 이름 + 연필 → 통계 → 테마 → 로그아웃
        <div className="flex flex-col items-center gap-2.5">
          <ProfileAvatar
            image={profileImage}
            x={profileX}
            y={profileY}
            onSave={onProfileChange}
          />
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

      <CategoryFilter
        categories={categories}
        value={filter}
        onChange={onFilterChange}
        onAdd={onAddCategory}
        onRemove={onRemoveCategory}
      />

      {/*
        자주 건드리지 않는 것(테마·알림·계정)은 전부 설정 모달로 넣었다. 늘 펼쳐두면
        매일 보는 화면(할 일·분류)을 밀어내기만 한다.
      */}
      <div className="mt-auto border-t border-line pt-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-ink-soft transition hover:bg-soft/50 hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[12px]">설정</span>
        </button>

        {/* 로그인 전에는 설정 안에 묻히지 않게 사이드바에도 한 번 더 권한다. */}
        {!signedIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
          >
            로그인
          </button>
        )}
      </div>
    </aside>
  );
}
