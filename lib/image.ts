export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_BYTES = 5 * 1024 * 1024;

/** 프로필로 저장할 정사각형 한 변 픽셀 */
const AVATAR_SIZE = 256;

/** 배너로 저장할 크기. 레퍼런스 배너와 비슷한 2.5:1 비율. */
const BANNER_W = 960;
const BANNER_H = 384;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "jpg, png, webp 파일만 올릴 수 있어요.";
  }
  if (file.size > MAX_BYTES) {
    return "5MB 이하 이미지만 올릴 수 있어요.";
  }
  return null;
}

/**
 * 가운데를 목표 비율로 잘라 지정 크기로 줄인 data URL을 만든다.
 *
 * 원본을 그대로 base64로 넣으면 5MB 파일이 약 6.7MB가 되어 localStorage
 * 한도(보통 5MB)를 넘긴다. 표시가 cover라 원본 해상도가 필요 없으므로
 * 저장 전에 줄인다.
 */
export function fileToCroppedDataUrl(
  file: File,
  outW: number,
  outH: number,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: iw, naturalHeight: ih } = img;
      if (!iw || !ih) {
        reject(new Error("이미지 크기를 읽지 못했어요."));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리하지 못했어요."));
        return;
      }

      // cover: 목표 비율에 맞춰 넘치는 쪽을 가운데 기준으로 잘라낸다.
      const scale = Math.max(outW / iw, outH / ih);
      const cropW = outW / scale;
      const cropH = outH / scale;
      ctx.drawImage(
        img,
        (iw - cropW) / 2,
        (ih - cropH) / 2,
        cropW,
        cropH,
        0,
        0,
        outW,
        outH,
      );

      // webp 인코딩을 지원하지 않는 브라우저는 png를 돌려주므로 jpeg로 되돌린다.
      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) {
        out = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(out);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했어요."));
    };

    img.src = url;
  });
}

export const fileToSquareDataUrl = (file: File) =>
  fileToCroppedDataUrl(file, AVATAR_SIZE, AVATAR_SIZE);

export const fileToBannerDataUrl = (file: File) =>
  fileToCroppedDataUrl(file, BANNER_W, BANNER_H, 0.8);
