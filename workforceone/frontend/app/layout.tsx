// ===================================
// app/layout.tsx (This is the ROOT layout)
// ===================================
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css' // This is the ONLY place this should be imported
import { FeatureFlagsProvider } from '@/components/feature-flags-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'WorkforceOne',
  description: 'Your all-in-one workforce management solution.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <FeatureFlagsProvider>
          {children}
          <Toaster />
        </FeatureFlagsProvider>
      </body>
    </html>
  )
}