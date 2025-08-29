// app/(site)/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Navbar from "@/components/site/navbar";

export const metadata: Metadata = {
  title: "SOTERIA",
  description: "Saving lives, one heartbeat at a time.",
  generator: "We Save Lives.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>

        <Navbar />

        <div className="h-16" aria-hidden />

        {children}
      </body>
    </html>
  );
}
