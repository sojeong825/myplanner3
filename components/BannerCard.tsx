"use client";

import { useRef, useState } from "react";
import ImagePositioner from "@/components/ImagePositioner";
import { ACCEPT_ATTR, fileToBannerDataUrl, validateImageFile } from "@/lib/image";
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

/** 프로필 사진과 같은 업로드 경로를 쓰되, 배너는 더 크게(긴 변 960px) 줄여 저장한다. */
export default function BannerCard({ image, x, y, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** 위치 조정 중인 동안의 임시 값. 저장을 눌러야 실제로 반영된다. */
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);

  const editing = draft !== null;

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
      const dataUrl = await fileToBannerDataUrl(file);
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
    // 원본 비율과 무관하게 높이를 고정하고 잘라서 채운다.
    // placeholder 상태와 이미지 상태의 카드 높이가 같아야 레이아웃이 밀리지 않는다.
    <section className="group relative h-[180px] overflow-hidden rounded-card border border-line bg-card shadow-card">
      {image ? (
        <ImagePositioner
          image={image}
          x={draft?.x ?? x}
          y={draft?.y ?? y}
          editing={editing}
          onChange={(nx, ny) => setDraft({ x: nx, y: ny })}
          className="size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="block size-full"
          aria-label="배너 이미지 추가"
        >
          <span className="grid size-full place-items-center bg-gradient-to-br from-soft-deep via-soft to-line-soft">
            <span className="flex flex-col items-center gap-2 text-ink-soft">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M4 17l4.5-4.5 3 3L15 12l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[12px]">{busy ? "이미지 처리 중…" : "배너 이미지 추가"}</span>
            </span>
          </span>
        </button>
      )}

      {/* 조정 중이 아닐 때만 나오는 버튼들. 조정 중에는 아래 저장/취소로 바뀐다. */}
      {image && !editing && (
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setDraft({ x, y })}
            className="rounded-full bg-card/85 px-3 py-1.5 text-[11px] text-ink backdrop-blur-sm transition hover:bg-card"
          >
            위치 조정
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-card/85 px-3 py-1.5 text-[11px] text-ink backdrop-blur-sm transition hover:bg-card"
          >
            변경
          </button>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              const saved = await onSave({ image: null, x: CENTER, y: CENTER });
              if (!saved.ok) setError(saved.message);
            }}
            className="rounded-full bg-card/85 px-3 py-1.5 text-[11px] text-ink-soft backdrop-blur-sm transition hover:bg-card hover:text-ink"
          >
            삭제
          </button>
        </div>
      )}

      {editing && (
        <>
          {/* pointer-events-none: 안내 문구가 드래그를 가로채면 안 된다. */}
          <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-[11px] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
            사진을 끌어서 보일 위치를 정하세요
          </p>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-full bg-card/85 px-3 py-1.5 text-[11px] text-ink-soft backdrop-blur-sm transition hover:bg-card hover:text-ink"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void commit()}
              className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-medium text-white transition hover:bg-accent-deep"
            >
              저장
            </button>
          </div>
        </>
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

      {error && (
        <p className="absolute inset-x-0 bottom-0 bg-card/90 px-3 py-2 text-center text-[11px] text-accent-deep">
          {error}
        </p>
      )}
    </section>
  );
}
