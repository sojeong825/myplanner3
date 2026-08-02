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
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  /**
   * 코드 입력칸은 기본으로 감춘다.
   * Supabase 기본 메일 서비스는 템플릿이 잠겨 있어 링크만 오고,
   * 커스텀 SMTP를 붙여 템플릿에 {{ .Token }}을 넣은 경우에만 코드가 온다.
   */
  const [codeOpen, setCodeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setEmail("");
    setCode("");
    setCodeOpen(false);
    setError(null);
    setBusy(false);
    emailRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (codeOpen) codeRef.current?.focus();
  }, [codeOpen]);

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
        setStep("sent");
      } else {
        await onVerify(email, code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  // 메일을 보낸 뒤에는 링크를 누르는 게 기본 경로라, 코드를 펼쳤을 때만 제출 버튼을 쓴다.
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
            ? "비밀번호는 만들지 않아요. 입력하신 주소로 인증 메일을 보내드릴게요."
            : `${email} 로 메일을 보냈어요.`}
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
            <>
              <div className="rounded-lg border border-line bg-soft/50 px-3.5 py-3">
                <p className="break-keep text-[12px] leading-relaxed text-ink">
                  메일 속 <strong className="font-medium">링크를 누르면 로그인돼요.</strong>
                  <br />이 창은 그대로 두셔도 됩니다.
                </p>
              </div>

              {/*
                기본 메일 서비스는 템플릿이 잠겨 있어 링크만 온다.
                커스텀 SMTP를 붙여 템플릿에 {{ .Token }}을 넣은 경우에만 코드가 오므로,
                코드 입력은 기본으로 감추고 필요한 사람만 펼치게 한다.
              */}
              {codeOpen ? (
                <label className="block">
                  <span className="text-[12px] text-ink-soft">6자리 코드</span>
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
              ) : (
                <button
                  type="button"
                  onClick={() => setCodeOpen(true)}
                  className="w-full text-center text-[11px] text-ink-faint underline underline-offset-2 transition hover:text-ink-soft"
                >
                  코드를 받으셨다면 직접 입력하기
                </button>
              )}
            </>
          )}

          {error && (
            <p className="break-keep text-[12px] leading-relaxed text-accent-deep">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={step === "sent" ? () => setStep("email") : onClose}
              className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
            >
              {step === "sent" ? "이메일 다시 입력" : "취소"}
            </button>

            {/* 링크로 로그인하는 경우엔 누를 버튼이 없으므로 코드를 펼쳤을 때만 보여준다. */}
            {(step === "email" || codeOpen) && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "확인 중…" : step === "email" ? "인증 메일 받기" : "코드로 로그인"}
              </button>
            )}
          </div>

          {step === "sent" && (
            <p className="break-keep text-center text-[11px] leading-relaxed text-ink-faint">
              메일이 안 보이면 스팸함을 확인해주세요.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
