"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPT_ATTR, fileToSquareDataUrl, validateImageFile } from "@/lib/image";
import type { SaveResult } from "@/lib/settings";

type Props = {
  image: string | null;
  onChange: (dataUrl: string | null) => SaveResult;
};

export default function ProfileAvatar({ image, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 팝오버는 바깥을 누르거나 Esc를 누르면 닫힌다.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      const saved = onChange(dataUrl);
      if (!saved.ok) setError(saved.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center gap-2">
      <button
        type="button"
        // 사진이 없으면 곧장 파일 선택, 있으면 교체/삭제를 고르게 한다.
        onClick={() => (image ? setMenuOpen((v) => !v) : inputRef.current?.click())}
        aria-label={image ? "프로필 사진 변경 또는 삭제" : "프로필 사진 추가"}
        aria-haspopup={image ? "menu" : undefined}
        aria-expanded={image ? menuOpen : undefined}
        className="group relative size-16 overflow-hidden rounded-full ring-4 ring-line-soft transition hover:ring-soft-deep"
      >
        {image ? (
          // 저장 시 이미 정사각형으로 잘라둬서 cover만으로 원형 표시가 맞는다.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-gradient-to-br from-soft-deep to-soft">
            <svg viewBox="0 0 24 24" className="size-7 text-ink-faint" fill="currentColor">
              <circle cx="12" cy="8.5" r="3.75" />
              <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0z" />
            </svg>
          </span>
        )}

        <span className="absolute inset-0 grid place-items-center bg-ink/35 opacity-0 transition group-hover:opacity-100">
          <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {menuOpen && image && (
        <div
          role="menu"
          className="absolute top-[72px] z-20 w-[148px] overflow-hidden rounded-xl border border-line bg-card py-1 shadow-card"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              inputRef.current?.click();
            }}
            className="block w-full px-3 py-2 text-left text-[12px] text-ink transition hover:bg-soft"
          >
            다른 사진 업로드
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setError(null);
              const saved = onChange(null);
              if (!saved.ok) setError(saved.message);
            }}
            className="block w-full px-3 py-2 text-left text-[12px] text-ink-soft transition hover:bg-soft hover:text-ink"
          >
            사진 삭제
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          // 같은 파일을 다시 골라도 change가 발생하도록 비운다.
          e.target.value = "";
        }}
      />

      {busy && <p className="text-[11px] text-ink-faint">이미지 처리 중…</p>}

      {error && (
        <p className="px-1 text-center text-[11px] leading-snug text-accent-deep">{error}</p>
      )}
    </div>
  );
}
