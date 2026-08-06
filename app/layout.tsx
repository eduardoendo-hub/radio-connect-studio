import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { FundoOndas } from './fundo'
import './globals.css'

/**
 * Tipografia.
 *
 * Space Grotesk nos títulos: grotesca com personalidade, herança técnica, um pouco
 * torta nos detalhes — combina com equipamento de estúdio e foge da neutralidade sem
 * rosto. Inter no corpo, porque texto de interface tem que sumir.
 *
 * Servidas pelo next/font: baixadas no build e hospedadas com o app. Nada de requisição
 * a terceiro no carregamento.
 */
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--fonte-display',
  display: 'swap',
})

const corpo = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fonte-corpo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Radio Connect Studio',
  description: 'O Sistema Operacional da Experiência Digital da Rádio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <body>
        <div className="assinatura" />
        <FundoOndas />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </body>
    </html>
  )
}
