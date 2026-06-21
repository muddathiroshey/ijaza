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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@200..1000&family=Reem+Kufi:wght@400..700&family=Aref+Ruqaa:wght@400;700&family=Lalezar&family=El+Messiri:wght@400..700&family=Changa:wght@200..800&family=Almarai:wght@300;400;700;800&family=Marhey:wght@300..700&family=Scheherazade+New:wght@400;700&display=swap" />
      </head>
      <body>
        <div className="bg-animated" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
