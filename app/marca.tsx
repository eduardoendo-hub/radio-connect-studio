'use client'

import Image from 'next/image'

/**
 * A marca do Radio Connect Studio — direção "O Pulso".
 *
 * O ponto Rose da identidade TechNow é o "ao vivo"; os dois arcos que saem dele são
 * transmissão de rádio e batimento ao mesmo tempo.
 *
 * **O ritmo do pulso é estado, não decoração:**
 *   4,0 s → fora do ar
 *   2,4 s → no ar
 *   1,1 s → com Momento ativo
 *
 * Quem opera o Studio aprende a ler o batimento sem olhar o texto. É a marca virando
 * instrumento.
 *
 * Regras do design system: área de respiro igual à altura do "R"; abaixo de 150 px de
 * largura usa-se só o símbolo; **abaixo de 24 px a marca não anima**. E no app do
 * ouvinte esta marca não aparece — white-label total, ela vive só aqui.
 */

export type RitmoPulso = 'fora-do-ar' | 'no-ar' | 'momento-ativo'

const DURACAO: Record<RitmoPulso, string> = {
  'fora-do-ar': '4s',
  'no-ar': '2.4s',
  'momento-ativo': '1.1s',
}

export const CoresMarca = {
  rose: '#EC6088',
  tiffany: '#0ABAB5',
  tiffanyClaro: '#81D8D0',
  pearl: '#EDF4F4',
  pearlEscuro: '#9ABABA',
  deepTeal: '#080F0F',
} as const

export function MarcaPulso({
  tamanho = 26,
  ritmo = 'no-ar',
}: {
  tamanho?: number
  ritmo?: RitmoPulso
}) {
  // Abaixo de 24 px a marca não anima — regra do design system.
  const anima = tamanho >= 24
  const d = DURACAO[ritmo]

  return (
    <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 64 64"
        fill="none"
        role="img"
        aria-label="Radio Connect Studio"
        className={anima ? 'marca-anima' : undefined}
        style={{ ['--ritmo' as string]: d, flex: 'none' }}
      >
        <circle className="marca-ponto" cx="20" cy="32" r="7.5" fill={CoresMarca.rose} />
        <path className="marca-w1" d="M35 21a17 17 0 0 1 0 22" stroke={CoresMarca.tiffany} strokeWidth="6" strokeLinecap="round" />
      <path className="marca-w2" d="M47 12a31 31 0 0 1 0 40" stroke={CoresMarca.tiffanyClaro} strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

/** "RadioConnect Studio" — Inter 900 com tracking apertado, "Studio" em 400. */
export function AssinaturaStudio({ tamanho = 16 }: { tamanho?: number }) {
  return (
    <span className="marca-wordmark" style={{ whiteSpace: 'nowrap', lineHeight: 1 }}>
      <span style={{ fontSize: tamanho, fontWeight: 900, letterSpacing: '-0.045em', color: CoresMarca.pearl }}>
        Radio
      </span>
      <span style={{ fontSize: tamanho, fontWeight: 900, letterSpacing: '-0.045em', color: CoresMarca.tiffanyClaro }}>
        Connect
      </span>
      <span style={{ fontSize: tamanho * 0.94, fontWeight: 400, color: CoresMarca.pearlEscuro, marginLeft: tamanho * 0.28 }}>
        Studio
      </span>
    </span>
  )
}

function Divisor() {
  return <span style={{ width: 1, height: 26, background: 'var(--borda)', flex: 'none' }} />
}

/**
 * O lockup co-branded, na ordem do design system:
 *
 *   [ Band FM ] │ [ ◗)) RadioConnect Studio ] │ [ powered by TechNow ]
 *
 * A rádio vem primeiro porque o Studio é a casa dela. A TechNow assina no fim, discreta
 * e permanente — o oposto do app do ouvinte, onde nada disso aparece.
 */
export function CabecalhoMarca({
  ritmo = 'no-ar',
  compacto = false,
}: {
  ritmo?: RitmoPulso
  compacto?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compacto ? 12 : 16, minWidth: 0 }}>
      <Image
        src="/marca/bandfm-logo.webp"
        alt="Band FM"
        width={compacto ? 74 : 92}
        height={compacto ? 24 : 30}
        style={{ objectFit: 'contain', height: compacto ? 24 : 30, width: 'auto' }}
        priority
      />

      <Divisor />

      <a href="/hoje" style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <MarcaPulso tamanho={compacto ? 24 : 28} ritmo={ritmo} />
        <AssinaturaStudio tamanho={compacto ? 15 : 17} />
      </a>

      {!compacto && (
        <>
          <Divisor />
          <PoweredByTechNow />
        </>
      )}
    </div>
  )
}

export function PoweredByTechNow({ tamanho = 22 }: { tamanho?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
      <span style={{
        fontSize: 9.5, letterSpacing: '.22em', color: 'var(--texto-3)',
        textTransform: 'uppercase', fontWeight: 500,
      }}>
        powered by
      </span>
      <Image
        src="/marca/logo-technow.png"
        alt="TechNow"
        width={96}
        height={tamanho}
        style={{ objectFit: 'contain', height: tamanho, width: 'auto' }}
      />
    </span>
  )
}

/** A marca da emissora, para quando o lockup completo não cabe. */
export function LogoRadio({ nome }: { nome: string }) {
  return (
    <span style={{
      fontSize: 14.5, fontWeight: 500, padding: '5px 12px', borderRadius: 999,
      border: '1px solid var(--borda-forte)', whiteSpace: 'nowrap',
    }}>
      {nome}
    </span>
  )
}

export function Rodape() {
  return (
    <footer style={{
      marginTop: 56, padding: '20px 0 36px', borderTop: '1px solid var(--borda)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: .65 }}>
        <MarcaPulso tamanho={20} />
        <AssinaturaStudio tamanho={13} />
      </span>
      <PoweredByTechNow tamanho={18} />
    </footer>
  )
}
