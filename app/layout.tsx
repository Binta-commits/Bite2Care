import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bite2Care — Snakebite Emergency Response & Triage System",
  description: "Rapid clinical triage, facility matching, and transport coordination for snakebite emergencies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <header className="bg-brand-teal-900 text-white border-b border-brand-teal-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {/* Official Brand Logo */}
              <Image
                src="/logo.png"
                alt="Bite2Care Logo"
                width={40}
                height={40}
                className="rounded-full object-contain shadow-sm"
                priority
              />
              <div className="flex items-center">
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Bite<span className="text-brand-gold-500">2</span>Care
                </span>
                <span className="ml-2.5 hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-brand-teal-800 text-brand-gold-500 rounded-full border border-brand-gold-500/40">
                  Emergency Platform
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-slate-200">
              <Link
                href="/activate"
                className="hover:text-brand-gold-500 transition-colors"
              >
                Activate Case
              </Link>
              <Link
                href="/facility/00000000-0000-0000-0000-00000000000A/readiness"
                className="hover:text-brand-gold-500 transition-colors hidden sm:inline-block"
              >
                Facility Readiness
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 pb-16">{children}</main>
      </body>
    </html>
  );
}
