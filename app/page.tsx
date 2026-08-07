'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { chamar, guardarSessao, lerToken, armazenamentoVolatil, type Operador } from '../lib/api'
import { MarcaPulso, AssinaturaStudio, PoweredByTechNow } from './marca'

export default function Entrar() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    try {
      // O espaço que veio junto na colagem não é problema de quem digitou.
      const r = await chamar<{ token: string; operador: Operador }>('/studio/entrar', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha: senha.trim() }),
      })
      guardarSessao(r.token, r.operador)

      // Confere que a sessão realmente ficou guardada ANTES de sair da tela. Sem isso,
      // quando o armazenamento está bloqueado, a pessoa era jogada em /hoje, a página
      // não achava token nenhum e devolvia ela para cá — um pisca-pisca sem mensagem,
      // com a senha certa.
      if (!lerToken()) {
        setErro(
          'Seu navegador está bloqueando o armazenamento do site, então a sessão não ' +
            'se mantém. Saia da navegação privada ou libere os dados de site para ' +
            'studio.radioconnect.technowhub.ai.',
        )
        setCarregando(false)
        return
      }

      if (armazenamentoVolatil) {
        setAviso('A sessão vale só até você recarregar a página.')
      }

      // Navegação do lado do cliente: `location.href` recarrega tudo e apagaria a
      // sessão guardada em memória quando o localStorage não está disponível.
      router.push('/hoje')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.')
      setCarregando(false)
    }
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 2px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Lockup empilhado, como manda o design system para login e splash.
            Ritmo "no ar" aqui de propósito: a marca precisa estar viva antes mesmo de
            alguém entrar — é a primeira coisa que o produtor vê todo dia. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginBottom: 38 }}>
          <MarcaPulso tamanho={68} ritmo="no-ar" />
          <AssinaturaStudio tamanho={25} />
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
          {aviso && (
            <div style={{
              fontSize: 13, color: 'var(--texto-2)', background: 'rgba(129,216,208,.08)',
              border: '1px solid rgba(129,216,208,.25)', borderRadius: 'var(--raio)', padding: '11px 14px',
            }}>{aviso}</div>
          )}

          <button className="btn" disabled={carregando} type="submit">
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
          <PoweredByTechNow tamanho={14} />
        </div>
      </div>
    </main>
  )
}
