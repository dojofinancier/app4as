import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/layout/navbar"

const inter = Inter({ subsets: ["latin"] })

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
      <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body className={cn(inter.className, "min-h-screen antialiased")}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}

