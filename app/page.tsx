'use client'

import { useState } from 'react'
import { chamar, guardarSessao, type Operador } from '../lib/api'
import { MarcaPulso, AssinaturaStudio, PoweredByTechNow } from './marca'

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
        {/* Lockup empilhado, como manda o design system para login e splash.
            Fora do ar: o pulso bate devagar, em 4 segundos. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 34 }}>
          <MarcaPulso tamanho={52} ritmo="fora-do-ar" />
          <AssinaturaStudio tamanho={23} />
          <div style={{ fontSize: 13, color: 'var(--texto-3)', textAlign: 'center' }}>
            O sistema operacional da sua rádio digital
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

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
          <PoweredByTechNow tamanho={19} />
        </div>
      </div>
    </main>
  )
}
