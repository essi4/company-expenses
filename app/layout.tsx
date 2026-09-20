import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import PwaRegister from "./pwa-register";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans", weight: "100 900" });
const geistMono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-geist-mono", weight: "100 900" });
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "EASY Business Platform",
    template: "%s | EASY Business Platform",
  },
  description: "پلتفرم چندکسب‌وکاره EASY برای مدیریت کسب‌وکار، مشتری، عملیات، اشتراک و اتوماسیون",
  manifest: "/manifest.webmanifest",
  applicationName: "EASY Business Platform",
  keywords: ["EASY", "Business Platform", "Control Center", "Multi-Business SaaS"],
  appleWebApp: {
    capable: true,
    title: "EASY Business Platform",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} font-persian`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
