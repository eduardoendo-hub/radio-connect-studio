'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Radio, LogOut, KeyRound, ArrowLeft } from 'lucide-react'
import { chamarPlataforma, operadorPlataforma, sairPlataforma, tokenPlataforma } from '../../lib/plataforma'
import { PoweredByTechNow } from '../marca'

/**
 * A casca da área da TechNow.
 *
 * **Deliberadamente diferente do Studio.** Quem opera a Band FM e quem opera a
 * plataforma são pessoas distintas com poderes distintos, e a tela precisa dizer isso
 * antes de qualquer texto: barra escura no topo, sem a marca da emissora, sem o menu do
 * dia a dia. Se as duas áreas parecessem a mesma coisa, alguém acabaria cadastrando
 * campanha achando que está no Studio de uma rádio específica — e aqui não existe rádio
 * corrente.
 */
export function CascaPlataforma({
  children,
  titulo,
  voltarPara,
}: {
  children: React.ReactNode
  titulo: string
  voltarPara?: string
}) {
  const router = useRouter()
  const caminho = usePathname()
  const [quem, setQuem] = useState<{ nome: string; email: string } | null>(null)
  const [trocando, setTrocando] = useState(false)

  useEffect(() => {
    if (!tokenPlataforma()) {
      router.replace('/plataforma')
      return
    }
    setQuem(operadorPlataforma())
  }, [router, caminho])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fundo)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 26px',
        borderBottom: '1px solid var(--borda)',
        background: 'linear-gradient(180deg, rgba(129,216,208,.06), transparent)',
      }}>
        {voltarPara && (
          <Link href={voltarPara} className="btn-vazio"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 10px' }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Radio size={16} style={{ color: 'var(--rosa)' }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: 'var(--rosa)' }}>
            TECHNOW
          </span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -.2 }}>{titulo}</span>

        <div style={{ flex: 1 }} />

        {quem && (
          <span style={{ fontSize: 12, color: 'var(--texto-3)' }}>{quem.email}</span>
        )}
        <button className="btn-vazio" title="Trocar senha"
          style={{ fontSize: 12, padding: '6px 9px' }}
          onClick={() => setTrocando(true)}>
          <KeyRound size={14} />
        </button>
        <button className="btn-vazio" title="Sair"
          style={{ fontSize: 12, padding: '6px 9px' }}
          onClick={() => { sairPlataforma(); router.replace('/plataforma') }}>
          <LogOut size={14} />
        </button>
      </header>

      <main style={{ padding: '24px 26px 48px', maxWidth: 1080 }}>{children}</main>

      <div style={{ padding: '0 26px 26px' }}><PoweredByTechNow tamanho={12} /></div>

      {trocando && <TrocarSenha aoFechar={() => setTrocando(false)} />}
    </div>
  )
}

/**
 * Trocar a própria senha.
 *
 * Está aqui desde o primeiro dia porque a primeira conta nasce com uma senha combinada
 * por fora — escrita numa conversa, num bilhete, num e-mail. Senha combinada por fora
 * precisa de um caminho para deixar de existir, senão ela é a senha para sempre.
 */
function TrocarSenha({ aoFechar }: { aoFechar: () => void }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  return (
    <div onClick={aoFechar} style={{
      position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,10,10,.72)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="cartao"
        style={{ width: '100%', maxWidth: 380, padding: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>Trocar senha</h2>
        <p style={{ fontSize: 12.5, color: 'var(--texto-3)', margin: '0 0 18px' }}>
          Esta conta enxerga todas as rádios. Vale uma senha que só você conheça.
        </p>

        {pronto ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--accent)' }}>Senha trocada.</p>
            <button className="btn" onClick={aoFechar} style={{ marginTop: 16 }}>Fechar</button>
          </>
        ) : (
          <>
            <label className="rotulo">Senha atual</label>
            <input className="campo" type="password" value={atual}
              onChange={(e) => setAtual(e.target.value)} />
            <label className="rotulo" style={{ marginTop: 14 }}>Nova senha</label>
            <input className="campo" type="password" value={nova}
              onChange={(e) => setNova(e.target.value)} placeholder="ao menos 8 caracteres" />
            {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 12 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
              <button className="btn" disabled={salvando || nova.length < 8}
                style={{ opacity: salvando || nova.length < 8 ? .5 : 1 }}
                onClick={async () => {
                  setSalvando(true); setErro('')
                  try {
                    await chamarPlataforma('/senha', {
                      method: 'POST',
                      body: JSON.stringify({ atual, nova }),
                    })
                    setPronto(true)
                  } catch (e) {
                    setErro(e instanceof Error ? e.message : 'Não deu para trocar agora.')
                  } finally {
                    setSalvando(false)
                  }
                }}>
                {salvando ? 'Trocando…' : 'Trocar'}
              </button>
              <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
