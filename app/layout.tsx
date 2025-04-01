import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
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
  title: "KorinAI Desk - Personal Finance App",
  description: "Manage your personal finances easily with KorinAI Desk",
  manifest: "/manifest.json",
  applicationName: "KorinAI Desk",
  keywords: [
    "finance",
    "personal finance",
    "budget",
    "expense tracking",
    "AI",
    "KorinAI",
  ],
  authors: [{ name: "KorinAI" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  icons: {
    icon: [
      {
        url: "/logo/KorinAILogo-Black.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo/KorinAILogo-White.ico",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/logo/KorinAILogo-Black.ico",
    apple: "/logo/KorinAILogo-Black.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
