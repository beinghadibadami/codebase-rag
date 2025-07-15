import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodeBase AI',
  description: 'CodeBase AI is a tool that allows you to ask questions about your codebase and get answers from the codebase.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
