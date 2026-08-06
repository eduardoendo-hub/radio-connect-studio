'use client'

import { useCallback, useEffect, useState } from 'react'
import { chamar, contagem, hora, lerToken, sair } from '../../../lib/api'
import { LogoStudio, LogoRadio, Rodape } from '../../marca'

type Opcao = { id: string; ordem: number; rotulo: string; emoji: string | null; votos: number }
type Momento = {
  id: string
  tipo: string
  titulo: string
  texto: string | null
  estado: string
  inicioEm: string
  fimEm: string
  campanhaPatrocinadoraId: string | null
  opcoes: Opcao[]
}
type Edicao = {
  id: string
  inicioEm: string
  fimEm: string
  titulo: string | null
  programa: { nome: string; corDestaque: string | null }
  locutor: { nome: string } | null
  momentos: Momento[]
}
type Template = {
  id: string
  nome: string
  tipo: string
  titulo: string
  opcoesPadrao: { rotulo: string; emoji?: string }[]
  duracaoSegundos: number
  favorito: boolean
}

export default function Pagina({ params }: { params: { id: string } }) {
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())

  const carregar = useCallback(async () => {
    const [e, t] = await Promise.all([
      chamar<{ edicao: Edicao }>(`/studio/edicoes/${params.id}`),
      chamar<{ templates: Template[] }>('/studio/templates'),
    ])
    setEdicao(e.edicao)
    setTemplates(t.templates)
  }, [params.id])

  useEffect(() => {
    if (!lerToken()) { location.href = '/'; return }
    carregar().catch((e) => setErro(e.message))
  }, [carregar])

  // No modo Ao Vivo o produtor acompanha os votos chegando. Recarrega sozinho.
  useEffect(() => {
    const t = setInterval(() => {
      setAgora(Date.now())
      carregar().catch(() => {})
    }, 3000)
    return () => clearInterval(t)
  }, [carregar])

  async function publicar(t: Template) {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await chamar('/studio/momentos', {
        method: 'POST',
        body: JSON.stringify({
          edicaoId: params.id,
          tipo: t.tipo,
          titulo: t.titulo,
          duracaoSegundos: t.duracaoSegundos,
          opcoes: t.opcoesPadrao,
          templateId: t.id,
          publicarAgora: true,
        }),
      })
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível publicar.')
    } finally {
      setOcupado(false)
    }
  }

  async function encerrar(id: string) {
    setOcupado(true)
    try {
      await chamar(`/studio/momentos/${id}/encerrar`, { method: 'POST' })
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível encerrar.')
    } finally {
      setOcupado(false)
    }
  }

  if (erro && !edicao) return <main className="container" style={{ paddingTop: 40 }}><div className="erro">{erro}</div></main>
  if (!edicao) return <main className="container" style={{ paddingTop: 40, color: 'var(--texto-3)' }}>Carregando…</main>

  const noAr = new Date(edicao.inicioEm).getTime() <= agora && new Date(edicao.fimEm).getTime() >= agora
  const ativo = edicao.momentos.find(
    (m) => m.estado === 'ATIVO' && new Date(m.fimEm).getTime() > agora,
  )
  const passados = edicao.momentos.filter((m) => m.id !== ativo?.id).reverse()

  return (
    <main className="container" style={{ paddingTop: 22, paddingBottom: 40 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
        <a href="/hoje" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LogoStudio tamanho={26} />
          <span style={{ fontWeight: 500 }}>
            Radio Connect <span style={{ color: 'var(--texto-3)', fontWeight: 400 }}>Studio</span>
          </span>
        </a>
        <LogoRadio nome="Band FM" />
        <div style={{ flex: 1 }} />
        <a href="/hoje" className="btn-vazio" style={{ padding: '7px 13px', fontSize: 13 }}>Voltar ao dia</a>
        <button className="btn-vazio" style={{ padding: '7px 13px', fontSize: 13 }} onClick={sair}>Sair</button>
      </header>

      {/*
        No modo Ao Vivo a tela inteira muda: o produtor não navega por menus, ele opera
        o que está acontecendo naquele instante.
      */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        {noAr && <span className="etiqueta-ao-vivo"><span className="pulso" />AO VIVO</span>}
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-.02em' }}>
          {edicao.titulo ?? edicao.programa.nome}
        </h1>
        <span style={{ color: 'var(--texto-2)', fontSize: 14.5 }}>
          {edicao.locutor ? `com ${edicao.locutor.nome} · ` : ''}
          {hora(edicao.inicioEm)} às {hora(edicao.fimEm)}
        </span>
      </div>

      {erro && <div className="erro" style={{ marginTop: 18 }}>{erro}</div>}

      {/* Momento ativo: uma ação clara, com o tempo correndo e os votos chegando. */}
      {ativo ? (
        <section className="cartao" style={{ marginTop: 24, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                Momento no ar
              </div>
              <div style={{ fontSize: 21, fontWeight: 500, marginTop: 9 }}>{ativo.titulo}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 27, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                {contagem(ativo.fimEm)}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--texto-3)' }}>restam</div>
            </div>
          </div>

          {ativo.opcoes.length > 0 && (
            <div style={{ marginTop: 20, display: 'grid', gap: 9 }}>
              {(() => {
                const total = ativo.opcoes.reduce((s, o) => s + o.votos, 0)
                return ativo.opcoes.map((o) => {
                  const pct = total ? Math.round((o.votos / total) * 100) : 0
                  return (
                    <div key={o.id} style={{ position: 'relative', background: 'var(--fundo)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute', inset: 0, width: `${pct}%`,
                        background: 'rgba(129,216,208,.14)', transition: 'width .5s ease',
                      }} />
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
                        <span>{o.emoji}</span>
                        <span style={{ flex: 1, fontSize: 14.5 }}>{o.rotulo}</span>
                        <span style={{ color: 'var(--texto-2)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {o.votos} · {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })
              })()}
              <div style={{ color: 'var(--texto-3)', fontSize: 12.5, marginTop: 2 }}>
                {ativo.opcoes.reduce((s, o) => s + o.votos, 0)} participações
              </div>
            </div>
          )}

          <button className="btn-vazio" style={{ marginTop: 18 }} disabled={ocupado} onClick={() => encerrar(ativo.id)}>
            Encerrar e publicar resultado
          </button>
        </section>
      ) : (
        <div className="cartao" style={{ marginTop: 24, color: 'var(--texto-2)', fontSize: 14.5 }}>
          Nenhum Momento no ar. O aplicativo segue vivo com o programa, o locutor e a promoção.
        </div>
      )}

      {/*
        Templates: a meta é criar um Momento em menos de 20 segundos.
        O produtor escolhe um acontecimento, não preenche um formulário.
      */}
      <h2 style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--texto-2)', margin: '34px 0 14px' }}>
        Publicar agora
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 10 }}>
        {templates.map((t) => (
          <button key={t.id} className="cartao" disabled={ocupado} onClick={() => publicar(t)}
            style={{ textAlign: 'left', padding: 16, opacity: ocupado ? .5 : 1 }}>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{t.nome}</div>
            <div style={{ color: 'var(--texto-3)', fontSize: 12.5, marginTop: 6 }}>
              {t.tipo.toLowerCase()} · {Math.round(t.duracaoSegundos / 60)} min
              {t.opcoesPadrao.length > 0 && ` · ${t.opcoesPadrao.length} opções`}
            </div>
          </button>
        ))}
      </div>

      {passados.length > 0 && (
        <>
          <h2 style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--texto-2)', margin: '34px 0 14px' }}>
            Linha do tempo
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {passados.map((m) => {
              const total = m.opcoes.reduce((s, o) => s + o.votos, 0)
              const vencedora = [...m.opcoes].sort((a, b) => b.votos - a.votos)[0]
              return (
                <div key={m.id} className="cartao" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px' }}>
                  <div style={{ width: 52, color: 'var(--texto-3)', fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>
                    {hora(m.inicioEm)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5 }}>{m.titulo}</div>
                    {vencedora && total > 0 && (
                      <div style={{ color: 'var(--texto-3)', fontSize: 12.5, marginTop: 3 }}>
                        {vencedora.emoji} {vencedora.rotulo} venceu · {total} participações
                      </div>
                    )}
                  </div>
                  {m.campanhaPatrocinadoraId && (
                    <span style={{
                      fontSize: 11, color: 'var(--rosa)', border: '1px solid rgba(232,67,123,.3)',
                      borderRadius: 999, padding: '3px 9px',
                    }}>patrocinado</span>
                  )}
                  <span style={{ color: 'var(--texto-3)', fontSize: 12 }}>{m.estado.toLowerCase().replace(/_/g, ' ')}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Rodape />
    </main>
  )
}
