import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Parcelles viticoles",
  description: "MVP de gestion de parcelles viticoles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-slate-500">
                  Parcelles
                </span>
                <span className="text-xs text-slate-400">MVP terrain</span>
              </div>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/dashboard"
                  className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Tableau de bord
                </Link>
                <Link
                  href="/parcels"
                  className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Parcelles
                </Link>
                <Link
                  href="/map"
                  className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Carte
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
