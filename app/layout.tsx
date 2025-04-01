import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import { LayoutWrapper } from "@/components/layout-wrapper";
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
    icon: "/logo/KorinAILogo-Black.ico",
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
      <head>
        <link rel="icon" href="/logo/KorinAILogo-Black.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/logo/KorinAILogo-Black.png"
        />
      </head>
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
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
