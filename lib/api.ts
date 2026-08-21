'use client'

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.radioconnect.technowhub.ai/v1'
/**
 * A emissora vem da **sessão**, não do build.
 *
 * `NEXT_PUBLIC_TENANT` era constante de compilação: funcionava com uma rádio e cobrava
 * caro na segunda — cada emissora exigiria um Studio inteiro, com deploy, domínio e
 * variáveis próprios, e toda correção viraria três deploys. Agora quem descobre a rádio
 * é o e-mail de quem entra, e o `slug` que volta do login é o que viaja em `X-Tenant`.
 *
 * O valor de reserva existe só para a primeira chamada de quem ainda não entrou.
 */
const CHAVE_TOKEN = 'rc.studio.token'
const CHAVE_OPERADOR = 'rc.studio.operador'
const CHAVE_EMISSORA = 'rc.studio.emissora'

export type Emissora = { id: string; slug: string; nome: string }

export function guardarEmissora(e: Emissora) {
  try { localStorage.setItem(CHAVE_EMISSORA, JSON.stringify(e)) } catch { armazenamentoVolatil = true }
  emissoraNaMemoria = e
}

export function lerEmissora(): Emissora | null {
  if (emissoraNaMemoria) return emissoraNaMemoria
  try {
    const cru = localStorage.getItem(CHAVE_EMISSORA)
    return cru ? (JSON.parse(cru) as Emissora) : null
  } catch {
    return null
  }
}

let emissoraNaMemoria: Emissora | null = null

/** O tenant de agora. Sem sessão, cai no padrão só para a tela de entrada existir. */
export function tenantAtual(): string {
  return lerEmissora()?.slug ?? process.env.NEXT_PUBLIC_TENANT ?? 'bandfm'
}

export type Operador = { id: string; nome: string; email: string; papel: string }

/**
 * Onde a sessão mora.
 *
 * `localStorage` é o lugar certo, mas nem sempre está disponível: navegação privada
 * no Safari, cookies de terceiros bloqueados, política de empresa. Quando ele falha,
 * falha **lançando** — e o login inteiro ia junto.
 *
 * O sintoma era o pior possível para diagnosticar: a pessoa digitava a senha certa,
 * a API respondia 200 com o token, e a tela voltava para o login sem dizer nada. Não
 * havia mensagem de erro porque, do ponto de vista da API, tinha dado tudo certo.
 *
 * Agora existe um plano B em memória. Ele não sobrevive a um F5 — e por isso a tela
 * avisa —, mas permite trabalhar a sessão inteira sem entrar em loop.
 */
let memoria: Record<string, string> = {}

export let armazenamentoVolatil = false

function guardar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    armazenamentoVolatil = true
    memoria[chave] = valor
  }
}

function ler(chave: string): string | null {
  try {
    const v = localStorage.getItem(chave)
    if (v !== null) return v
  } catch {
    armazenamentoVolatil = true
  }
  return memoria[chave] ?? null
}

function remover(chave: string) {
  try {
    localStorage.removeItem(chave)
  } catch {
    /* nada a fazer: o plano B é limpo logo abaixo */
  }
  delete memoria[chave]
}

export function guardarSessao(token: string, operador: Operador) {
  guardar(CHAVE_TOKEN, token)
  guardar(CHAVE_OPERADOR, JSON.stringify(operador))
}

export function lerToken(): string | null {
  if (typeof window === 'undefined') return null
  return ler(CHAVE_TOKEN)
}

export function lerOperador(): Operador | null {
  if (typeof window === 'undefined') return null
  const bruto = ler(CHAVE_OPERADOR)
  if (!bruto) return null
  // Um JSON corrompido não pode derrubar a tela inteira — melhor perder o nome do
  // operador do que perder o Studio.
  try {
    return JSON.parse(bruto) as Operador
  } catch {
    return null
  }
}

export function sair() {
  remover(CHAVE_TOKEN)
  remover(CHAVE_OPERADOR)
  memoria = {}
  location.href = '/'
}

export class ErroApi extends Error {
  constructor(readonly status: number, readonly codigo: string, mensagem: string) {
    super(mensagem)
  }
}

export async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = lerToken()
  const r = await fetch(`${API}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant': tenantAtual(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers ?? {}),
    },
  })

  if (r.status === 401) {
    sair()
    throw new ErroApi(401, 'nao_autenticado', 'Sua sessão expirou.')
  }

  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new ErroApi(r.status, corpo.erro ?? 'erro', corpo.mensagem ?? 'Algo deu errado.')
  }
  return corpo as T
}

/** Formata como a produção lê: 08h15, não 8:15:00. */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function contagem(ate: string): string {
  const s = Math.max(0, Math.floor((new Date(ate).getTime() - Date.now()) / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Envia uma imagem e devolve a URL.
 *
 * O corpo vai cru, sem multipart: é exatamente um arquivo, e um envelope de formulário
 * só acrescentaria dependência dos dois lados para transportar a mesma coisa.
 */
export async function enviarImagem(arquivo: File): Promise<string> {
  const token = lerToken()
  const r = await fetch(`${API}/studio/imagens`, {
    method: 'POST',
    headers: {
      'Content-Type': arquivo.type,
      'X-Tenant': tenantAtual(),
      'X-Nome-Arquivo': encodeURIComponent(arquivo.name).slice(0, 120),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: arquivo,
  })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErroApi(r.status, corpo.erro ?? 'erro', corpo.mensagem ?? 'Não deu para enviar a imagem.')
  return corpo.url as string
}
