import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "معلم حسناء | رفيق الدراسة", description: "مدرس ذكي يساعد على فهم دروس السادس الابتدائي العراقي", applicationName: "معلم حسناء", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#176b58", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
