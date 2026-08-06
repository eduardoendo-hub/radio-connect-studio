'use client'

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.radioconnect.technowhub.ai/v1'
export const TENANT = process.env.NEXT_PUBLIC_TENANT ?? 'bandfm'

const CHAVE_TOKEN = 'rc.studio.token'
const CHAVE_OPERADOR = 'rc.studio.operador'

export type Operador = { id: string; nome: string; email: string; papel: string }

export function guardarSessao(token: string, operador: Operador) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_OPERADOR, JSON.stringify(operador))
}

export function lerToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CHAVE_TOKEN)
}

export function lerOperador(): Operador | null {
  if (typeof window === 'undefined') return null
  const bruto = localStorage.getItem(CHAVE_OPERADOR)
  return bruto ? (JSON.parse(bruto) as Operador) : null
}

export function sair() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_OPERADOR)
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
      'X-Tenant': TENANT,
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
