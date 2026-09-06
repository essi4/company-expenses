import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PwaRegister from "./pwa-register";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans", weight: "100 900" });
const geistMono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-geist-mono", weight: "100 900" });

export const metadata: Metadata = {
  title: {
    default: "مدیریت مالی شرکت",
    template: "%s | مدیریت مالی شرکت",
  },
  description: "سامانه حرفه‌ای مدیریت خرید، هزینه، فاکتورها، پرداخت‌ها و امور مالی شرکت",
  manifest: "/manifest.webmanifest",
  applicationName: "مدیریت مالی شرکت",
  keywords: ["مدیریت مالی", "هزینه شرکت", "خرید", "فاکتور", "پرداخت", "حسابداری"],
  appleWebApp: {
    capable: true,
    title: "مدیریت مالی شرکت",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
