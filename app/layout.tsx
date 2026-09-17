import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { DEFAULT_FONT } from "@/lib/fonts";
import { DEFAULT_SETTINGS, THEME_BOOT_SCRIPT } from "@/lib/settings";
import "./globals.css";

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "my planner",
  description: "할 일을 입력하고, 마감을 확인하고, 완료로 넘기는 일정 관리 템플릿",
};

/**
 * 폰에서 화면 폭을 그대로 쓴다. Next가 넣어주는 기본값과 같은 값이지만, 좁은 화면
 * 레이아웃이 이 한 줄에 매달려 있어서 눈에 보이게 적어둔다.
 *
 * maximumScale은 건드리지 않는다 — 글씨를 키워 보는 사람에게서 확대를 뺏을 이유가 없다.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      // 아래 인라인 스크립트가 하이드레이션 전에 data-theme·data-font를 바꾸므로
      // DOM 값을 그대로 둔다.
      data-theme={DEFAULT_SETTINGS.theme}
      data-font={DEFAULT_FONT}
      suppressHydrationWarning
      className={`${notoKr.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
