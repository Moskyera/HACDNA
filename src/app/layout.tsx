import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HACDNA | HACD Mining Rarity",
  description:
    "HACDNA: check Hacash HACD diamond mining rarity. Live mainnet data, HIP-5 traits, and simple scores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
          HACDNA · Live Hacash mainnet data ·{" "}
          <a
            href="https://hacash.org/HACD"
            className="text-cyan-500/80 hover:text-cyan-300"
            target="_blank"
            rel="noreferrer"
          >
            Learn about HACD
          </a>
        </footer>
      </body>
    </html>
  );
}
