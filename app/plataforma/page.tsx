'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio } from 'lucide-react'
import { chamarPlataforma, guardarPlataforma, tokenPlataforma, type OperadorPlataforma } from '../../lib/plataforma'
import { PoweredByTechNow } from '../marca'

/**
 * A entrada da TechNow.
 *
 * Porta separada da do Studio, e não uma tela escondida atrás de um papel. Quem opera
 * uma rádio não consegue um token de plataforma nem por engano de programação — a
 * barreira está na assinatura do token, no servidor. Esta tela só reflete isso.
 */
export default function EntrarPlataforma() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (tokenPlataforma()) router.replace('/plataforma/radios')
  }, [router])

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <Radio size={26} style={{ color: 'var(--rosa)' }} />
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: 'var(--rosa)', marginTop: 8 }}>
            TECHNOW
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -.3, marginTop: 4 }}>
            Painel da plataforma
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--texto-3)', marginTop: 6 }}>
            Rádios, anunciantes e campanhas.
          </p>
        </div>

        <form
          className="cartao"
          style={{ padding: 22, display: 'grid', gap: 14 }}
          onSubmit={async (ev) => {
            ev.preventDefault()
            setCarregando(true); setErro('')
            try {
              const r = await chamarPlataforma<{ token: string; operador: OperadorPlataforma }>('/entrar', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase(), senha: senha.trim() }),
              })
              guardarPlataforma(r.token, r.operador)
              router.replace('/plataforma/radios')
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para entrar agora.')
              setCarregando(false)
            }
          }}
        >
          <div>
            <label className="rotulo" htmlFor="email">E-mail</label>
            {/* Sem `type="email"`: o navegador bloqueia o envio antes de o JavaScript
                rodar quando há um espaço colado junto, e a pessoa fica olhando um
                endereço visivelmente correto sem nenhuma mensagem. Já aconteceu no
                Studio. Aqui o espaço é removido enquanto se digita. */}
            <input id="email" className="campo" value={email} autoFocus
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))} />
          </div>
          <div>
            <label className="rotulo" htmlFor="senha">Senha</label>
            <input id="senha" className="campo" type="password" value={senha}
              onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro && <div className="erro">{erro}</div>}
          <button className="btn" disabled={carregando} type="submit">
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
          <PoweredByTechNow tamanho={13} />
        </div>
      </div>
    </main>
  )
}
