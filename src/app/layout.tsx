import type { Metadata } from "next";
import { Albert_Sans, Inter_Tight } from "next/font/google";

import { ClientLayout } from "@/components/layout/ClientLayout";

import "./globals.css";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-albert-sans",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: "Academic Management Dashboard",
  description: "Academic management dashboard for students, courses, faculty, and reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${albertSans.variable} ${interTight.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
