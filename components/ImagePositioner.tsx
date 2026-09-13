"use client";

import { useRef, useState } from "react";

type Props = {
  image: string;
  /** 지금 보여줄 위치(0~100%). object-position에 그대로 들어간다. */
  x: number;
  y: number;
  /** true면 끌어서 옮길 수 있다. false면 그냥 그림이다. */
  editing?: boolean;
  onChange?: (x: number, y: number) => void;
  /** 틀(크기·모서리·overflow-hidden)은 호출부가 정한다. */
  className?: string;
};

/** 0~100 밖으로 나가지 않게 자른다. */
const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * 사진을 틀 안에서 끌어 '보일 위치'를 정한다. 배너와 프로필이 같이 쓴다.
 *
 * 사진은 원본 비율 그대로 저장되고(lib/image.ts), 틀에 맞춰 잘라 보여주는 일은
 * object-cover가 한다. 여기서 정하는 건 **그 잘린 창을 어디에 둘지**뿐이다.
 * 그래서 몇 번을 다시 조정해도 원본 화질이 깎이지 않는다.
 *
 * 넘치지 않는 축으로는 움직이지 않는다 — 가로가 딱 맞는 사진을 좌우로 끌면
 * 아무 일도 일어나지 않아야 하고, 억지로 움직이면 빈 여백이 드러난다.
 */
export default function ImagePositioner({
  image,
  x,
  y,
  editing = false,
  onChange,
  className = "",
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  /** 드래그 시작 시점의 포인터 좌표와 위치값. 매 move마다 여기서부터 다시 계산한다. */
  const start = useRef({ px: 0, py: 0, x: 50, y: 50 });

  /**
   * 틀 밖으로 넘치는 픽셀 수. object-cover가 그리는 크기를 그대로 다시 계산한다.
   * 넘치는 양이 곧 '끌 수 있는 거리'다.
   */
  const overflow = () => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img?.naturalWidth) return { ox: 0, oy: 0 };

    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const scale = Math.max(fw / img.naturalWidth, fh / img.naturalHeight);
    return {
      ox: img.naturalWidth * scale - fw,
      oy: img.naturalHeight * scale - fh,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editing || !onChange) return;
    e.preventDefault();
    // 포인터를 잡아두면 틀 밖으로 나가도 드래그가 끊기지 않는다.
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x, y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !onChange) return;

    const { ox, oy } = overflow();
    const s = start.current;

    // 사진을 오른쪽으로 끌면 더 왼쪽이 보여야 하므로 퍼센트는 줄어든다.
    // 넘치는 양이 0이면 나눌 수 없고 움직일 이유도 없어서 그대로 둔다.
    const nx = ox > 0 ? clamp(s.x - ((e.clientX - s.px) / ox) * 100) : s.x;
    const ny = oy > 0 ? clamp(s.y - ((e.clientY - s.py) / oy) * 100) : s.y;

    onChange(Math.round(nx), Math.round(ny));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative overflow-hidden ${
        editing ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      } ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={image}
        alt=""
        // draggable=false: 브라우저 기본 이미지 끌기가 먼저 잡아채면 위치 조정이 안 먹는다.
        draggable={false}
        className="size-full select-none object-cover"
        style={{ objectPosition: `${x}% ${y}%` }}
      />
    </div>
  );
}
