"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  onVerify: (email: string, code: string) => Promise<void>;
};

/**
 * 이메일 인증 한 화면. 가입과 로그인을 구분하지 않는다 —
 * 처음 인증한 이메일이면 자동 가입되고, 기존 이메일이면 로그인된다.
 */
export default function AuthModal({ open, onClose, onSend, onVerify }: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setEmail("");
    setCode("");
    setError(null);
    setBusy(false);
    emailRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (step === "email") {
        await onSend(email);
        setStep("code");
      } else {
        await onVerify(email, code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !busy && (step === "email" ? /\S+@\S+\.\S+/.test(email) : code.trim().length >= 6);

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
          이메일로 시작하기
        </h2>
        <p className="mt-2 break-keep text-[12px] leading-relaxed text-ink-soft">
          {step === "email"
            ? "비밀번호는 만들지 않아요. 입력하신 주소로 인증 코드를 보내드릴게요."
            : `${email} 로 보낸 6자리 코드를 입력해주세요.`}
        </p>

        <div className="mt-5 space-y-5">
          {step === "email" ? (
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
          ) : (
            <label className="block">
              <span className="text-[12px] text-ink-soft">인증 코드</span>
              <input
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="000000"
                className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-center font-mono text-[18px] tracking-[0.4em] outline-none placeholder:text-ink-faint focus:border-accent"
              />
            </label>
          )}

          {error && (
            <p className="break-keep text-[12px] leading-relaxed text-accent-deep">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={step === "code" ? () => setStep("email") : onClose}
              className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
            >
              {step === "code" ? "이메일 다시 입력" : "취소"}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "확인 중…" : step === "email" ? "인증 코드 받기" : "로그인"}
            </button>
          </div>

          {step === "code" && (
            <p className="break-keep text-center text-[11px] leading-relaxed text-ink-faint">
              메일 속 링크를 눌러도 로그인돼요. 코드가 안 보이면 스팸함을 확인해주세요.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
