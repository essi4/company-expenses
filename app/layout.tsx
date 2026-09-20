import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PwaRegister from "./pwa-register";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans", weight: "100 900" });
const geistMono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-geist-mono", weight: "100 900" });

export const metadata: Metadata = {
  title: {
    default: "EASY Business Platform",
    template: "%s | EASY Business Platform",
  },
  description: "پلتفرم چندکسب‌وکاره EASY برای مدیریت Business، Customer، Automation، Communication، Intelligence و Control Center",
  manifest: "/manifest.webmanifest",
  applicationName: "EASY Business Platform",
  keywords: ["EASY", "Business Platform", "Multi-Business", "Control Center", "Customer Portal", "Automation"],
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