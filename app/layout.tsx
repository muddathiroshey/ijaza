import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة الإجازات — إنشاء وإدارة الشهادات",
  description: "منصة متكاملة لإنشاء قوالب الإجازات والشهادات، وإدارة التقديمات، وتوليد الشهادات آلياً.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="bg-animated" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
