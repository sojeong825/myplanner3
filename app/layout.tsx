import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      // 아래 인라인 스크립트가 하이드레이션 전에 data-theme을 바꾸므로 DOM 값을 그대로 둔다.
      data-theme={DEFAULT_SETTINGS.theme}
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
