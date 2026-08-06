import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Radio Connect Studio',
  description: 'O Sistema Operacional da Experiência Digital da Rádio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="assinatura" />
        {children}
      </body>
    </html>
  )
}
