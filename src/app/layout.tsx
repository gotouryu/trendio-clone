import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { I18nProvider } from "@/lib/i18n";
import CommandPalette from "@/components/CommandPalette";
import HtmlLangSync from "@/components/HtmlLangSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Phase 4 修正:metadata は静的なので英語版に統一。
// (=Meta/TikTok レビュアが英語UIで動作確認時にタブタイトルが日本語混在しないように)
export const metadata: Metadata = {
  metadataBase: new URL("https://karteia.vercel.app"),
  title: "Karteia | Customer Engagement & Sales Support Platform",
  description:
    "AI-powered customer engagement platform for small-to-medium businesses on Instagram and TikTok. Auto-reply, customer records, and audience insights in one place.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <I18nProvider>
            <HtmlLangSync />
            <ToasterProvider>
              {children}
              <CommandPalette />
            </ToasterProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
