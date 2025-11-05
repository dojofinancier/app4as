import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { OfflineIndicator } from "@/components/offline-indicator"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { ensureEnvValid } from "@/lib/utils/env-validation"

// Validate environment variables on app startup (runtime only, not during build)
// The validation function itself skips validation during build time
ensureEnvValid()

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "Carré d'As Tutorat - Réservation de séances de tutorat",
    template: "%s | Carré d'As Tutorat"
  },
  description: "Plateforme de réservation de séances de tutorat en ligne. Réservez des séances de tutorat avec des tuteurs qualifiés pour vos cours universitaires et professionnels.",
  keywords: ["tutorat", "tuteur", "cours", "réservation", "apprentissage", "éducation"],
  authors: [{ name: "4AS" }],
  creator: "4AS",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://app.carredastutorat.com"),
  icons: {
    icon: "/images/1-84529878.ico",
    shortcut: "/images/1-84529878.ico",
    apple: "/images/1-84529878.ico",
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: "/",
    siteName: "Carré d'As Tutorat",
    title: "Carré d'As Tutorat - Réservation de séances de tutorat",
    description: "Plateforme de réservation de séances de tutorat en ligne. Réservez des séances de tutorat avec des tuteurs qualifiés.",
    // images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "4AS Tutorat" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carré d'As Tutorat - Réservation de séances de tutorat",
    description: "Plateforme de réservation de séances de tutorat en ligne",
    // images: ["/twitter-image.jpg"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
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
        <GoogleAnalytics />
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

