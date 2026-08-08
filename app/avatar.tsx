'use client'

/**
 * O rosto do locutor, no Studio.
 *
 * **A cor e o desenho são idênticos aos do app do ouvinte, e isso não é coincidência.**
 * O produtor abre o Studio e o ouvinte abre o app olhando para as mesmas pessoas; se
 * "o roxo é o Marcelo Café" aqui e o verde ali, o reconhecimento que a gente está
 * construindo se perde nos dois lados ao mesmo tempo. Por isso o hash, a paleta e a
 * silhueta são cópia fiel de `radio-connect-app/lib/widgets/avatar_locutor.dart`.
 *
 * Se um dia mudar de um lado, tem que mudar do outro.
 *
 * Enquanto as fotos oficiais não chegam, a silhueta ocupa o lugar. Quando chegarem,
 * `imagemUrl` entra e nada mais muda.
 */

export type Pessoa = { id?: string; nome: string; imagemUrl?: string | null }

/** Paleta quente, da família da marca. Nenhum cinza: rosto apagado parece conta desativada. */
const PALETAS: [string, string][] = [
  ['#F6821F', '#9A4A05'], // laranja da casa
  ['#F0574D', '#A62A22'], // vermelho no ar
  ['#6E56CF', '#3A2A78'], // roxo
  ['#22A06B', '#11543A'], // verde
  ['#1E4FD8', '#0F2A78'], // azul
  ['#D6336C', '#7A1C3D'], // magenta
  ['#0E8A9E', '#064652'], // teal
  ['#B8860B', '#6B4E06'], // âmbar
]

/**
 * O multiplicador primo importa: somar os códigos das letras fazia nomes de tamanho
 * parecido caírem todos na mesma cor.
 */
function semente(nome: string): number {
  let s = 0
  for (const c of nome.trim().toLowerCase()) {
    s = (s * 31 + c.charCodeAt(0)) % 1000003
  }
  return s
}

export function Avatar({
  pessoa,
  tamanho = 26,
  anel,
}: {
  pessoa: Pessoa
  tamanho?: number
  /** Cor do anel que separa avatares sobrepostos. */
  anel?: string
}) {
  const [claro, escuro] = PALETAS[semente(pessoa.nome) % PALETAS.length]!

  return (
    <span
      title={pessoa.nome}
      aria-label={pessoa.nome}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: '50%',
        display: 'inline-block',
        flex: 'none',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${claro}, ${escuro})`,
        boxShadow: anel ? `0 0 0 2px ${anel}` : undefined,
      }}
    >
      {pessoa.imagemUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pessoa.imagemUrl}
          alt={pessoa.nome}
          width={tamanho}
          height={tamanho}
          // Centro, igual ao app: as fotos são preparadas quadradas e já centradas no
          // rosto. Deslocar por cima disso só revelaria a borda do arquivo.
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Silhueta />
      )}
    </span>
  )
}

/**
 * A silhueta em vetor.
 *
 * Uma só, e não quatro variações de cabelo: no tamanho em que isto é realmente visto,
 * cabelo e boné viram riscos aleatórios sobre a cabeça. A cor faz a distinção.
 */
function Silhueta() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden style={{ display: 'block' }}>
      <path
        d="M4 102 C6 70 28 62 50 62 C72 62 94 70 96 102 Z"
        fill="rgba(255,255,255,.88)"
      />
      <circle cx="50" cy="38" r="17.5" fill="rgba(255,255,255,.88)" />
    </svg>
  )
}

/**
 * A equipe, em avatares levemente sobrepostos.
 *
 * A sobreposição não é enfeite: lê como "essas pessoas estão juntas no ar", enquanto
 * avatares separados leem como uma lista.
 */
export function Equipe({
  pessoas,
  tamanho = 26,
  anel = 'var(--fundo)',
}: {
  pessoas: Pessoa[]
  tamanho?: number
  anel?: string
}) {
  if (!pessoas.length) return null
  const passo = tamanho * 0.68

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        flex: 'none',
        height: tamanho,
        width: tamanho + (pessoas.length - 1) * passo,
      }}
    >
      {pessoas.map((p, i) => (
        <span
          key={p.id ?? `${p.nome}-${i}`}
          style={{ position: 'absolute', left: i * passo, top: 0, zIndex: pessoas.length - i }}
        >
          <Avatar pessoa={p} tamanho={tamanho} anel={anel} />
        </span>
      ))}
    </span>
  )
}

/**
 * Monta a lista na ordem em que a rádio escala: quem assina primeiro, a equipe depois.
 * Usada nas duas telas para não repetir a regra — e para não haver o risco de uma
 * mostrar o titular no meio da fila.
 */
export function equipeDaEdicao(
  locutor: Pessoa | null | undefined,
  equipeDoPrograma: Pessoa[] | undefined,
): Pessoa[] {
  const equipe = equipeDoPrograma ?? []
  if (!locutor) return equipe
  return [locutor, ...equipe.filter((p) => p.id !== locutor.id)]
}
