export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_BYTES = 5 * 1024 * 1024;

/**
 * 저장할 때의 긴 변 상한.
 *
 * v1.6부터 **자르지 않고 줄이기만 한다.** 예전에는 가운데를 잘라 정사각형/2.5:1로
 * 저장했는데, 그러면 잘려나간 부분이 영영 사라져서 나중에 보일 위치를 옮길 수가 없다.
 * 지금은 원본 비율 그대로 두고 화면에서 object-position으로 잘라 보여준다.
 */
const AVATAR_MAX = 320;
const BANNER_MAX = 960;

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
 * 원본 비율을 그대로 두고 긴 변이 max를 넘지 않게만 줄인 data URL을 만든다.
 *
 * **자르지 않는다.** 잘라서 저장하면 잘려나간 부분이 사라져서, 나중에 '보일 위치'를
 * 옮기려 해도 옮길 것이 없다. 어디를 보여줄지는 화면에서 object-position으로 정한다.
 *
 * 그래도 줄이기는 한다 — 원본을 그대로 base64로 넣으면 5MB 파일이 약 6.7MB가 되어
 * localStorage 한도(보통 5MB)를 넘긴다.
 */
export function fileToFittedDataUrl(
  file: File,
  max: number,
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

      // 1을 넘지 않게 해서, 이미 작은 이미지를 억지로 키우지 않는다.
      const scale = Math.min(1, max / Math.max(iw, ih));
      const outW = Math.round(iw * scale);
      const outH = Math.round(ih * scale);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리하지 못했어요."));
        return;
      }

      ctx.drawImage(img, 0, 0, outW, outH);

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

export const fileToAvatarDataUrl = (file: File) =>
  fileToFittedDataUrl(file, AVATAR_MAX);

export const fileToBannerDataUrl = (file: File) =>
  fileToFittedDataUrl(file, BANNER_MAX, 0.8);
