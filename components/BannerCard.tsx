"use client";

import { useRef, useState } from "react";
import { ACCEPT_ATTR, fileToBannerDataUrl, validateImageFile } from "@/lib/image";
import type { SaveResult } from "@/lib/settings";

type Props = {
  image: string | null;
  onChange: (dataUrl: string | null) => Promise<SaveResult>;
};

/** 프로필 사진과 같은 업로드 경로를 쓰되, 정사각형 대신 배너 비율로 줄여 저장한다. */
export default function BannerCard({ image, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const saved = await onChange(dataUrl);
      if (!saved.ok) setError(saved.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    // 원본 비율과 무관하게 높이를 고정하고 잘라서 채운다.
    // placeholder 상태와 이미지 상태의 카드 높이가 같아야 레이아웃이 밀리지 않는다.
    <section className="group relative h-[180px] overflow-hidden rounded-card border border-line bg-card shadow-card">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="block size-full"
        aria-label={image ? "배너 이미지 변경" : "배너 이미지 추가"}
      >
        {image ? (
          // 저장 시 이미 배너 비율로 잘라둬서 cover만으로 맞는다. radius는 부모가 잡는다.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover object-center" />
        ) : (
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
        )}
      </button>

      {image && (
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
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
              const saved = await onChange(null);
              if (!saved.ok) setError(saved.message);
              }}
            className="rounded-full bg-card/85 px-3 py-1.5 text-[11px] text-ink-soft backdrop-blur-sm transition hover:bg-card hover:text-ink"
          >
            삭제
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

      {error && (
        <p className="absolute inset-x-0 bottom-0 bg-card/90 px-3 py-2 text-center text-[11px] text-accent-deep">
          {error}
        </p>
      )}
    </section>
  );
}
