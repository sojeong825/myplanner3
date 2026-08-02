"use client";

import { useEffect, useRef, useState } from "react";
import { PASSWORD_MIN } from "@/lib/useAuth";

type Mode = "signin" | "signup";

type Props = {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
};

/**
 * Supabase가 돌려주는 영문 메시지를 그대로 보여주면 뭘 해야 할지 알 수 없다.
 * 자주 나오는 것만 한국어 안내로 바꾸고, 나머지는 원문을 남긴다.
 */
function readableError(raw: string): string {
  const m = raw.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인으로 들어가주세요.";
  }
  if (m.includes("email not confirmed")) {
    return "메일로 보낸 링크를 눌러 이메일을 확인해주세요.";
  }
  if (m.includes("password should be at least")) {
    return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`;
  }
  if (m.includes("rate limit")) {
    return "요청이 너무 잦아요. 잠시 뒤에 다시 시도해주세요.";
  }
  const seconds = raw.match(/after (\d+) seconds?/i);
  if (seconds) return `${seconds[1]}초 뒤에 다시 시도해주세요.`;

  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "지금은 가입이 막혀 있어요.";
  }
  return raw;
}

export default function AuthModal({ open, onClose, onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode("signin");
    setEmail("");
    setPassword("");
    setError(null);
    setBusy(false);
    emailRef.current?.focus();
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

  const signup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (signup) await onSignUp(email, password);
      else await onSignIn(email, password);
    } catch (err) {
      setError(readableError(err instanceof Error ? err.message : "다시 시도해주세요."));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !busy && /\S+@\S+\.\S+/.test(email) && password.length >= PASSWORD_MIN;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-[360px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
      >
        <h2 id="auth-modal-title" className="text-[16px] font-medium">
          {signup ? "회원가입" : "로그인"}
        </h2>

        {/* 로그인과 가입은 필드가 같아서 탭으로만 가른다. */}
        <div role="tablist" className="mt-4 flex rounded-full border border-line p-0.5">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-full py-1.5 text-[12px] transition ${
                mode === m ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {m === "signin" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-[12px] text-ink-soft">이메일</span>
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-[14px] outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-[12px] text-ink-soft">
              비밀번호{signup && ` (${PASSWORD_MIN}자 이상)`}
            </span>
            <input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-[14px] outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </label>

          {error && (
            <p className="break-keep text-[12px] leading-relaxed text-accent-deep">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "확인 중…" : signup ? "가입하기" : "로그인"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
