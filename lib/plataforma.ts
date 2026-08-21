'use client'

import { API } from './api'

/**
 * A sessão da TechNow, separada da sessão do Studio.
 *
 * Chave de armazenamento própria, token próprio, e nenhuma linha compartilhada com o
 * `lerToken()` do Studio. Não é organização: é a mesma decisão do servidor, onde o
 * `exigirPlataforma` recusa token de emissora. Se as duas sessões dividissem a chave,
 * bastaria um engano de programação para uma virar a outra — e esta atravessa todas as
 * rádios.
 */

const CHAVE = 'rc.plataforma.token'
const CHAVE_QUEM = 'rc.plataforma.operador'

export type OperadorPlataforma = { id: string; nome: string; email: string }
export type EmissoraResumo = { id: string; slug: string; nome: string }

export function guardarPlataforma(token: string, operador: OperadorPlataforma) {
  localStorage.setItem(CHAVE, token)
  localStorage.setItem(CHAVE_QUEM, JSON.stringify(operador))
}

export function tokenPlataforma(): string | null {
  try { return localStorage.getItem(CHAVE) } catch { return null }
}

export function operadorPlataforma(): OperadorPlataforma | null {
  try {
    const cru = localStorage.getItem(CHAVE_QUEM)
    return cru ? (JSON.parse(cru) as OperadorPlataforma) : null
  } catch {
    return null
  }
}

export function sairPlataforma() {
  localStorage.removeItem(CHAVE)
  localStorage.removeItem(CHAVE_QUEM)
}

export class ErroPlataforma extends Error {
  constructor(public status: number, public codigo: string, mensagem: string) {
    super(mensagem)
  }
}

/**
 * Chamada à área da TechNow.
 *
 * Sem `X-Tenant`: estas rotas ficam acima do escopo de emissora, e a rádio vem no
 * caminho de cada uma. Mandar o cabeçalho aqui daria a impressão de que existe um tenant
 * corrente — e não existe, é justamente o que diferencia esta área.
 */
export async function chamarPlataforma<T = unknown>(
  caminho: string,
  opcoes: RequestInit = {},
): Promise<T> {
  const token = tokenPlataforma()
  const r = await fetch(`${API}/plataforma${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers ?? {}),
    },
  })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new ErroPlataforma(
      r.status,
      corpo.erro ?? 'erro',
      corpo.mensagem ?? 'Não deu para completar agora.',
    )
  }
  return corpo as T
}
