'use client'

import { useState } from 'react'
import { chamar, guardarSessao, type Operador } from '../lib/api'
import { LogoStudio, LogoTechNow } from './marca'

export default function Entrar() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const r = await chamar<{ token: string; operador: Operador }>('/studio/entrar', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      })
      guardarSessao(r.token, r.operador)
      location.href = '/hoje'
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.')
      setCarregando(false)
    }
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 2px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
          <LogoStudio tamanho={34} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-.01em' }}>
              Radio Connect <span style={{ color: 'var(--texto-2)', fontWeight: 400 }}>Studio</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--texto-3)', marginTop: 3 }}>
              O sistema operacional da sua rádio digital
            </div>
          </div>
        </div>

        <form onSubmit={entrar} className="cartao" style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="rotulo" htmlFor="email">E-mail</label>
            <input
              id="email"
              className="campo"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@suaradio.com.br"
              required
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="campo"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <div className="erro">{erro}</div>}

          <button className="btn" disabled={carregando} type="submit">
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div
          style={{
            marginTop: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--texto-3)',
            fontSize: 12,
          }}
        >
          <span>powered by</span>
          <LogoTechNow tamanho={13} />
        </div>
      </div>
    </main>
  )
}
