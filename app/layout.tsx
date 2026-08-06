import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { FundoOndas } from './fundo'
import './globals.css'

/**
 * Tipografia.
 *
 * O Spotify usa a **Circular**, de Laurenz Brunner — proprietária da Lineto. A
 * substituta gratuita mais próxima é a **Plus Jakarta Sans**: mesma geometria
 * circular e ar amigável, com "a" de dois andares e altura-x generosa, o que a torna
 * muito melhor que a Poppins para texto denso de interface.
 *
 * A **Inter** fica só no wordmark, porque o design system da marca especifica Inter 900
 * com tracking −0.045em em "RadioConnect". Marca é marca.
 *
 * Servidas pelo next/font: baixadas no build e hospedadas com o app, sem requisição a
 * terceiro no carregamento.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--fonte-corpo',
  display: 'swap',
})

const interMarca = Inter({
  subsets: ['latin'],
  weight: ['400', '900'],
  variable: '--fonte-marca',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Radio Connect Studio',
  description: 'O Sistema Operacional da Experiência Digital da Rádio.',
  icons: { icon: '/marca/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${interMarca.variable}`}>
      <body>
        <div className="assinatura" />
        <FundoOndas />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </body>
    </html>
  )
}
