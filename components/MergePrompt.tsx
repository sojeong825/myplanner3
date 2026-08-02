"use client";

type Props = {
  /** null이면 물어볼 게 없음 */
  count: number | null;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * 게스트로 쓰던 브라우저에서, 이미 데이터가 있는 계정으로 로그인했을 때 한 번만 묻는다.
 * 거절하면 이 브라우저의 게스트 데이터는 버린다.
 */
export default function MergePrompt({ count, onAccept, onDecline }: Props) {
  if (count === null) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/25 p-4 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="merge-title"
        className="w-full max-w-[340px] rounded-2xl border border-line bg-card p-6 shadow-[0_18px_50px_-20px_rgba(92,74,71,0.35)]"
      >
        <p id="merge-title" className="text-center text-[15px] font-medium">
          이 브라우저의 할 일 {count}개를 계정에 합칠까요?
        </p>
        <p className="mt-2 break-keep text-center text-[12px] leading-relaxed text-ink-soft">
          합치지 않으면 이 브라우저에 있던 내용은 사라지고, 계정에 저장된 내용만 보여요.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-full border border-line py-2.5 text-[13px] text-ink-soft transition hover:bg-soft"
          >
            합치지 않기
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white transition hover:bg-accent-deep"
          >
            합치기
          </button>
        </div>
      </div>
    </div>
  );
}
