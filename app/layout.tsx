import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { OfflineIndicator } from "@/components/offline-indicator"
import { ensureEnvValid } from "@/lib/utils/env-validation"

// Validate environment variables on app startup
ensureEnvValid()

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "4AS - Réservation de tuteur",
  description: "Plateforme de réservation de séances de tutorat en ligne",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr-CA" suppressHydrationWarning>
      <head>
        {/* Blocking script to prevent theme flash - runs before page renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const storageKey = '4as-theme';
                const theme = localStorage.getItem(storageKey) || 'light';
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                } else {
                  root.classList.add(theme);
                }
              })();
            `,
          }}
        />
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body className={cn(dmSans.variable, "min-h-screen antialiased font-sans flex flex-col")}>
        <ThemeProvider defaultTheme="light" storageKey="4as-theme">
          <OfflineIndicator />
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}

