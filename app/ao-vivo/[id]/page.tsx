'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, LogOut, Mic2, Timer, Zap, CheckCircle2, Radio, Megaphone } from 'lucide-react'
import { chamar, contagem, hora, lerToken, sair } from '../../../lib/api'
import { EditorMomento, type MomentoParaPublicar } from './editor'
import { CabecalhoMarca, Rodape } from '../../marca'

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
import type { Template } from './editor'

export default function Pagina({ params }: { params: { id: string } }) {
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [editando, setEditando] = useState<Template | null>(null)
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

  async function publicar(m: MomentoParaPublicar) {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await chamar('/studio/momentos', {
        method: 'POST',
        body: JSON.stringify({ edicaoId: params.id, ...m, publicarAgora: true }),
      })
      setEditando(null)
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
        {/* Com Momento no ar o pulso acelera para 1,1s — dá para ler o estado da
            operação pelo batimento da marca, sem olhar o texto. */}
        <CabecalhoMarca compacto ritmo={ativo ? 'momento-ativo' : noAr ? 'no-ar' : 'fora-do-ar'} />
        <div style={{ flex: 1 }} />
        <a href="/hoje" className="btn-vazio" style={{ padding: '7px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Voltar ao dia
        </a>
        <button className="btn-vazio" style={{ padding: '7px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={sair}>
          <LogOut size={15} /> Sair
        </button>
      </header>

      {/*
        No modo Ao Vivo a tela inteira muda: o produtor não navega por menus, ele opera
        o que está acontecendo naquele instante.
      */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        {noAr && <span className="etiqueta-ao-vivo"><span className="pulso" />AO VIVO</span>}
        <h1 style={{ fontSize: 32, fontWeight: 600 }}>
          {edicao.titulo ?? edicao.programa.nome}
        </h1>
        <span style={{ color: 'var(--texto-2)', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 7 }}>
          {edicao.locutor && <><Mic2 size={14} /> {edicao.locutor.nome} ·</>}
          <span className="numerico">{hora(edicao.inicioEm)} às {hora(edicao.fimEm)}</span>
        </span>
      </div>

      {erro && <div className="erro" style={{ marginTop: 18 }}>{erro}</div>}

      {/* Momento ativo: uma ação clara, com o tempo correndo e os votos chegando. */}
      {ativo ? (
        <section className="cartao" style={{ marginTop: 24, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500 }}>
                <Radio size={13} /> Momento no ar
              </div>
              <div className="display" style={{ fontSize: 23, fontWeight: 600, marginTop: 10 }}>{ativo.titulo}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="numerico display" style={{ fontSize: 30, fontWeight: 600 }}>
                {contagem(ativo.fimEm)}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--texto-3)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <Timer size={12} /> restam
              </div>
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
                        <span className="numerico" style={{ color: 'var(--texto-2)', fontSize: 13 }}>
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

          <button className="btn-vazio" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8 }} disabled={ocupado} onClick={() => encerrar(ativo.id)}>
            <CheckCircle2 size={16} /> Encerrar e publicar resultado
          </button>
        </section>
      ) : (
        <div className="cartao" style={{ marginTop: 24, color: 'var(--texto-2)', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 11 }}>
          <Radio size={17} style={{ color: 'var(--texto-3)', flex: 'none' }} />
          Nenhum Momento no ar. O aplicativo segue vivo com o programa, o locutor e a promoção.
        </div>
      )}

      {/*
        Templates: a meta é criar um Momento em menos de 20 segundos.
        O produtor escolhe um acontecimento, não preenche um formulário.
      */}
      <h2 style={{ fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--texto-2)', margin: '36px 0 6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={14} /> Publicar agora
      </h2>
      <p style={{ color: 'var(--texto-3)', fontSize: 13, marginBottom: 14 }}>
        Escolha um formato, ajuste o que precisa e publique.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 10 }}>
        {templates.map((t) => (
          <button key={t.id} className="linha" disabled={ocupado} onClick={() => setEditando(t)}
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
          <h2 style={{ fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--texto-2)', margin: '36px 0 14px', fontWeight: 500 }}>
            Já aconteceu nesta edição
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {passados.map((m) => {
              const total = m.opcoes.reduce((s, o) => s + o.votos, 0)
              const vencedora = [...m.opcoes].sort((a, b) => b.votos - a.votos)[0]
              return (
                <div key={m.id} className="linha" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px' }}>
                  <div className="numerico" style={{ width: 52, color: 'var(--texto-3)', fontSize: 13.5 }}>
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
                      borderRadius: 999, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 5,
                    }}><Megaphone size={11} /> patrocinado</span>
                  )}
                  <span style={{ color: 'var(--texto-3)', fontSize: 12 }}>{m.estado.toLowerCase().replace(/_/g, ' ')}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {editando && (
        <EditorMomento
          template={editando}
          ocupado={ocupado}
          aoPublicar={publicar}
          aoFechar={() => setEditando(null)}
        />
      )}

      <Rodape />
    </main>
  )
}
