"use client";

import { useEffect, useState } from "react";
import FontPicker from "@/components/FontPicker";
import NotifyToggle from "@/components/NotifyToggle";
import ThemePicker from "@/components/ThemePicker";
import type { FontId } from "@/lib/fonts";
import type { ThemeId } from "@/lib/settings";
import { PASSWORD_MIN } from "@/lib/useAuth";
import type { NotifyState } from "@/lib/useNotifications";

type Props = {
  open: boolean;
  theme: ThemeId;
  font: FontId;
  notify: NotifyState;
  /** null이면 게스트 — 계정 칸 대신 로그인 안내가 나온다. */
  email: string | null;
  onClose: () => void;
  onThemeChange: (theme: ThemeId) => void;
  onFontChange: (font: FontId) => void;
  onChangePassword: (password: string) => Promise<void>;
  onSignIn: () => void;
  onSignOut: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="pb-2.5 text-[12px] font-medium text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

/**
 * 설정 모아두기.
 *
 * 테마·알림·계정은 저마다 성격이 다르지만 **자주 건드리지 않는다**는 점이 같다.
 * 사이드바에 늘 펼쳐두면 매일 보는 화면(할 일·분류)을 밀어내기만 해서, 톱니 하나로
 * 접어 넣고 필요할 때만 연다.
 */
export default function SettingsModal({
  open,
  theme,
  font,
  notify,
  email,
  onClose,
  onThemeChange,
  onFontChange,
  onChangePassword,
  onSignIn,
  onSignOut,
}: Props) {
  /** 비밀번호 바꾸기 칸이 펼쳐져 있는지. 평소에는 접어둔다. */
  const [pwOpen, setPwOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  // 열 때마다 비밀번호 칸은 처음 상태로 되돌린다. 입력해둔 게 남아 있으면 안 된다.
  useEffect(() => {
    if (!open) return;
    setPwOpen(false);
    setPassword("");
    setConfirm("");
    setError(null);
    setOkMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submitPassword = async () => {
    setError(null);
    setOkMessage(null);

    if (password.length < PASSWORD_MIN) {
      setError(`비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`);
      return;
    }
    if (password !== confirm) {
      setError("두 번 입력한 비밀번호가 달라요.");
      return;
    }

    setBusy(true);
    try {
      await onChangePassword(password);
      setOkMessage("비밀번호를 바꿨어요.");
      setPwOpen(false);
      setPassword("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "비밀번호를 바꾸지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-ink/20 backdrop-blur-[2px] sm:grid sm:place-items-center sm:overflow-y-auto sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        /* 폰에서는 화면을 꽉 채우는 시트, 넓은 화면에서는 가운데 카드. */
        className="flex h-full w-full flex-col bg-card sm:my-auto sm:h-auto sm:max-w-[360px] sm:rounded-2xl sm:border sm:border-line sm:p-6 sm:shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
      >
        <div className="flex shrink-0 items-center border-b border-line px-4 py-3 sm:border-0 sm:p-0">
          <h2 id="settings-title" className="text-[16px] font-medium">
            설정
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-1 ml-auto grid size-8 place-items-center rounded-full text-ink-faint transition hover:bg-soft hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 폰에서 스크롤되는 곳은 여기뿐이다. 머리줄의 닫기는 늘 제자리에 있다. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:mt-5 sm:flex-none sm:overflow-visible sm:p-0">
          <Section title="테마">
            <ThemePicker value={theme} onChange={onThemeChange} />
          </Section>

          <Section title="글꼴">
            <FontPicker value={font} onChange={onFontChange} />
          </Section>

          <Section title="알림">
            <NotifyToggle {...notify} />
          </Section>

          <Section title="계정">
            {email === null ? (
              <>
                <p className="break-keep px-1 text-[12px] leading-relaxed text-ink-soft">
                  지금 쓴 내용은 이 브라우저에만 저장돼요. 로그인하면 어디서든 볼 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="mt-3 w-full rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep"
                >
                  이메일로 시작하기
                </button>
              </>
            ) : (
              <>
                <p className="truncate px-1 text-[12px] text-ink" title={email}>
                  {email}
                </p>

                {pwOpen ? (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={`새 비밀번호 (${PASSWORD_MIN}자 이상)`}
                      autoComplete="new-password"
                      aria-label="새 비밀번호"
                      className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
                    />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => {
                        // 한글 조합 중 Enter는 조합 확정용이라 그대로 받으면 안 된다.
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void submitPassword();
                        }
                      }}
                      placeholder="한 번 더 입력"
                      autoComplete="new-password"
                      aria-label="새 비밀번호 확인"
                      className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
                    />

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPwOpen(false);
                          setPassword("");
                          setConfirm("");
                          setError(null);
                        }}
                        className="flex-1 rounded-full border border-line py-2 text-[12px] text-ink-soft transition hover:bg-soft"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitPassword()}
                        disabled={busy}
                        className="flex-1 rounded-full bg-accent py-2 text-[12px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? "바꾸는 중…" : "바꾸기"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPwOpen(true);
                        setOkMessage(null);
                      }}
                      className="flex-1 rounded-full border border-line py-2 text-[12px] text-ink-soft transition hover:bg-soft hover:text-ink"
                    >
                      비밀번호 바꾸기
                    </button>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="flex-1 rounded-full border border-line py-2 text-[12px] text-ink-soft transition hover:bg-soft hover:text-ink"
                    >
                      로그아웃
                    </button>
                  </div>
                )}

                {error && (
                  <p className="px-1 pt-2 text-[11px] leading-snug text-danger">{error}</p>
                )}
                {okMessage && (
                  <p className="px-1 pt-2 text-[11px] text-accent-deep">{okMessage}</p>
                )}
              </>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
