/**
 * O campo de ondas.
 *
 * Uma superfície de pontos vista de lado — som virando relevo. O truque que dá volume
 * não é sombra nem perspectiva: é a **densidade**. Onde as linhas se aproximam, a
 * superfície está dobrando, e ali os pontos ficam maiores e mais claros. Onde se afastam,
 * some. É assim que a referência funciona, e é barato de desenhar.
 *
 * SVG determinístico, sem canvas e sem animação: não custa quadro de renderização. O
 * Studio fica horas aberto na mesa da produção e precisa ser leve.
 */

const L = 1600 // largura do viewBox
const A = 620 // altura do viewBox
const LINHAS = 62
const PONTOS = 190

/** Duas senóides sobrepostas com fases diferentes por linha — é o que cria as dobras. */
function altura(t: number, p: number): number {
  // Fases que giram muito com a linha: é isso que faz as dobras cruzarem em lugares
  // diferentes ao longo do eixo, em vez de formarem uma banda só.
  return (
    Math.sin(t * 6.2 + p * 6.0) * (46 + p * 58) +
    Math.sin(t * 3.4 - p * 4.3) * (38 + p * 46) +
    Math.sin(t * 9.9 + p * 9.1) * (13 + p * 20) +
    Math.sin(t * 1.7 + p * 2.6) * (26 + p * 34)
  )
}

export function FundoOndas() {
  type Ponto = { x: number; y: number; r: number; o: number }
  const pontos: Ponto[] = []

  // Guarda a linha anterior para medir o quanto as linhas se aproximam.
  let anterior: number[] | null = null

  for (let l = 0; l < LINHAS; l++) {
    const p = l / (LINHAS - 1)
    // Espaçamento crescente: as linhas de baixo estão "mais perto do observador".
    const base = A * 0.08 + Math.pow(p, 1.5) * A * 1.02
    const atual: number[] = []

    for (let i = 0; i <= PONTOS; i++) {
      const t = i / PONTOS
      const y = base + altura(t, p) * (0.2 + p * 0.9)
      atual.push(y)
    }

    for (let i = 0; i <= PONTOS; i++) {
      const y = atual[i]!
      if (y < -40 || y > A + 40) continue

      // Distância até a linha anterior: pequena = dobra = brilho.
      const dist = anterior ? Math.abs(y - anterior[i]!) : 14
      const aperto = Math.max(0, 1 - dist / 26) // 1 = coladas, 0 = espalhadas

      // Profundidade: o que está embaixo aparece mais.
      const prof = Math.pow(p, 1.2)

      const o = Math.min(0.5, 0.015 + prof * 0.1 + Math.pow(aperto, 1.7) * 0.44)
      if (o < 0.02) continue

      pontos.push({
        x: (i / PONTOS) * L,
        y,
        r: 0.4 + prof * 0.6 + Math.pow(aperto, 1.5) * 0.95,
        o,
      })
    }

    anterior = atual
  }

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${L} ${A}`}
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70vh',
          maskImage: 'linear-gradient(to top, #000 0%, rgba(0,0,0,.9) 26%, rgba(0,0,0,.28) 62%, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(to top, #000 0%, rgba(0,0,0,.9) 26%, rgba(0,0,0,.28) 62%, transparent 88%)',
        }}
      >
        <defs>
          <linearGradient id="ondaCor" x1="0" y1="1" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#81d8d0" />
            <stop offset="55%" stopColor="#dff1ef" />
            <stop offset="100%" stopColor="#e8437b" />
          </linearGradient>
        </defs>
        <g fill="url(#ondaCor)">
          {pontos.map((pt, i) => (
            <circle key={i} cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)} r={pt.r.toFixed(2)} opacity={pt.o.toFixed(3)} />
          ))}
        </g>
      </svg>

      {/* Halo na base: evita que o campo termine em corte seco. */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '130%', height: '46vh',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(129,216,208,.09), transparent 70%)',
      }} />
    </div>
  )
}
