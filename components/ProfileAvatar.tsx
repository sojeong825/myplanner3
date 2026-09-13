"use client";

import { useEffect, useRef, useState } from "react";
import ImagePositioner from "@/components/ImagePositioner";
import { ACCEPT_ATTR, fileToAvatarDataUrl, validateImageFile } from "@/lib/image";
import { CENTER, type SaveResult } from "@/lib/settings";

type Props = {
  image: string | null;
  x: number;
  y: number;
  /** 이미지와 위치를 한 번에 저장한다. 바꾸지 않을 값은 빼고 넘긴다. */
  onSave: (next: {
    image?: string | null;
    x?: number;
    y?: number;
  }) => Promise<SaveResult>;
};

export default function ProfileAvatar({ image, x, y, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /** 위치 조정 중인 동안의 임시 값. 저장을 눌러야 실제로 반영된다. */
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);

  const editing = draft !== null;

  // 팝오버는 바깥을 누르거나 Esc를 누르면 닫힌다.
  useEffect(() => {
    if (!menuOpen && !editing) return;

    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
      // 조정 중이었다면 저장하지 않고 버린다 — 저장은 '저장'을 눌러야 한다.
      setDraft(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setDraft(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, editing]);

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
      const dataUrl = await fileToAvatarDataUrl(file);
      // 새 사진은 이전 사진의 위치를 물려받으면 안 된다 — 가운데에서 다시 시작한다.
      const saved = await onSave({ image: dataUrl, x: CENTER, y: CENTER });
      if (!saved.ok) setError(saved.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!draft) return;
    setError(null);
    const saved = await onSave({ x: draft.x, y: draft.y });
    if (!saved.ok) {
      setError(saved.message);
      return;
    }
    setDraft(null);
  };

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center gap-2">
      <button
        type="button"
        // 사진이 없으면 곧장 파일 선택, 있으면 교체/위치/삭제를 고르게 한다.
        onClick={() => (image ? setMenuOpen((v) => !v) : inputRef.current?.click())}
        aria-label={image ? "프로필 사진 바꾸기" : "프로필 사진 추가"}
        aria-haspopup={image ? "menu" : undefined}
        aria-expanded={image ? menuOpen : undefined}
        className="group relative size-16 overflow-hidden rounded-full ring-4 ring-line-soft transition hover:ring-soft-deep"
      >
        {image ? (
          // 원본 비율 그대로 저장돼 있어서, 어디를 보여줄지는 위치값이 정한다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="size-full object-cover"
            style={{ objectPosition: `${draft?.x ?? x}% ${draft?.y ?? y}%` }}
          />
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

      {menuOpen && image && !editing && (
        <div
          role="menu"
          className="absolute top-[72px] z-20 w-[152px] overflow-hidden rounded-xl border border-line bg-card py-1 shadow-card"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setDraft({ x, y });
            }}
            className="block w-full px-3 py-2 text-left text-[12px] text-ink transition hover:bg-soft"
          >
            위치 조정
          </button>
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
            onClick={async () => {
              setMenuOpen(false);
              setError(null);
              const saved = await onSave({ image: null, x: CENTER, y: CENTER });
              if (!saved.ok) setError(saved.message);
            }}
            className="block w-full px-3 py-2 text-left text-[12px] text-ink-soft transition hover:bg-soft hover:text-ink"
          >
            사진 삭제
          </button>
        </div>
      )}

      {/*
        조정은 64px 아바타에서 직접 하지 않는다 — 너무 작아서 원하는 위치를 잡을 수 없다.
        아래에 크게 펼쳐두고 거기서 끌게 한 뒤, 위 아바타에 결과가 바로 비친다.
      */}
      {editing && image && (
        <div className="absolute top-[72px] z-20 w-[164px] rounded-xl border border-line bg-card p-3 shadow-card">
          <ImagePositioner
            image={image}
            x={draft.x}
            y={draft.y}
            editing
            onChange={(nx, ny) => setDraft({ x: nx, y: ny })}
            className="mx-auto size-[132px] rounded-full ring-1 ring-line"
          />

          <p className="pt-2 text-center text-[11px] leading-snug text-ink-faint">
            끌어서 보일 위치를 정하세요
          </p>

          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="flex-1 rounded-full border border-line py-1.5 text-[11px] text-ink-soft transition hover:bg-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void commit()}
              className="flex-1 rounded-full bg-accent py-1.5 text-[11px] font-medium text-white transition hover:bg-accent-deep"
            >
              저장
            </button>
          </div>
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
