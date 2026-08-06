'use client'

/**
 * Co-branding.
 *
 * O Studio traz a identidade da TechNow com a marca da rádio ao lado — decisão DP-04.
 * O app do ouvinte é o oposto: white-label total, sem nenhuma menção ao Radio Connect.
 *
 * São públicos opostos. O ouvinte precisa sentir que o app é da rádio; a equipe da
 * emissora precisa saber com quem contratou.
 */

export function LogoTechNow({ tamanho = 15 }: { tamanho?: number }) {
  return (
    <span style={{ fontSize: tamanho, fontWeight: 500, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--texto)' }}>Tech</span>
      <span style={{ color: 'var(--accent)' }}>Now</span>
      <span style={{ color: 'var(--rosa)' }}> •</span>
    </span>
  )
}

/**
 * O Pulso — logo do Radio Connect Studio.
 *
 * O ponto vermelho do "no ar" com ondas de transmissão saindo dele. É ao mesmo tempo
 * batimento e emissão: liga o conceito do pulso do No Ar ao vocabulário do rádio.
 * Vermelho sangue de propósito, e sobrevive como favicon de 16px.
 */
export function LogoStudio({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" fill="none" aria-label="Radio Connect Studio">
      <circle cx="16" cy="16" r="4.5" fill="var(--ao-vivo)" />
      <path d="M23 9.5a9.2 9.2 0 0 1 0 13" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 9.5a9.2 9.2 0 0 0 0 13" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M27.5 5a15.5 15.5 0 0 1 0 22" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity=".38" />
      <path d="M4.5 5a15.5 15.5 0 0 0 0 22" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity=".38" />
    </svg>
  )
}

/** A marca da emissora. Vem da configuração do tenant — cada rádio com a sua. */
export function LogoRadio({ nome }: { nome: string }) {
  return (
    <span
      style={{
        fontSize: 15,
        fontWeight: 500,
        padding: '5px 12px',
        borderRadius: 999,
        border: '1px solid var(--borda-forte)',
        color: 'var(--texto)',
        whiteSpace: 'nowrap',
      }}
    >
      {nome}
    </span>
  )
}

export function Rodape() {
  return (
    <footer
      style={{
        marginTop: 56,
        padding: '20px 0 36px',
        borderTop: '1px solid var(--borda)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--texto-3)',
        fontSize: 12,
      }}
    >
      <span>powered by</span>
      <LogoTechNow tamanho={13} />
    </footer>
  )
}
