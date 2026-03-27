import { RootProvider } from "fumadocs-ui/provider/next"
import type { Metadata } from "next"
import Providers from "./providers"
import "./globals.css"

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  return new URL(siteUrl)
}

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "MindPocket",
  description:
    "A fully open-source, free, multi-platform, one-click deployable personal bookmark system with AI Agent integration.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RootProvider
          search={{
            options: {
              api: "/api/search",
            },
          }}
          theme={{
            enabled: false,
          }}
        >
          <Providers>{children}</Providers>
        </RootProvider>
      </body>
    </html>
  )
}
