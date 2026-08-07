'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Timer, Zap, CheckCircle2, Radio, Megaphone, ChevronDown, Trophy, Users } from 'lucide-react'
import { chamar, contagem, hora, lerToken } from '../../../lib/api'
import { EditorMomento, type MomentoParaPublicar } from './editor'
import { EditorFofocometro, type FofocaParaPublicar } from './fofocometro'
import { CascaStudio, CabecalhoTela } from '../../casca'
import { Equipe, equipeDaEdicao, type Pessoa } from '../../avatar'

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
  programa: { nome: string; corDestaque: string | null; equipe?: Pessoa[] }
  locutor: Pessoa | null
  momentos: Momento[]
}
import type { Template } from './editor'

export default function Pagina({ params }: { params: { id: string } }) {
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [editando, setEditando] = useState<Template | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
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

  async function publicar(m: MomentoParaPublicar | FofocaParaPublicar) {
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

  if (erro && !edicao) {
    return (
      <CascaStudio>
        <main style={{ padding: '22px 26px' }}><div className="erro">{erro}</div></main>
      </CascaStudio>
    )
  }
  if (!edicao) {
    return (
      <CascaStudio>
        <main style={{ padding: '22px 26px', color: 'var(--texto-3)' }}>Carregando…</main>
      </CascaStudio>
    )
  }

  const noAr = new Date(edicao.inicioEm).getTime() <= agora && new Date(edicao.fimEm).getTime() >= agora
  const ativo = edicao.momentos.find(
    (m) => m.estado === 'ATIVO' && new Date(m.fimEm).getTime() > agora,
  )
  const passados = edicao.momentos.filter((m) => m.id !== ativo?.id).reverse()

  return (
    /* Com Momento no ar o pulso da marca acelera para 1,1s — dá para ler o estado da
       operação pelo batimento, de qualquer tela, sem olhar o texto. */
    <CascaStudio ritmo={ativo ? 'momento-ativo' : noAr ? 'no-ar' : 'fora-do-ar'}>
    <main style={{ padding: '22px 26px 40px', maxWidth: 1080 }}>
      {/*
        O nome do programa é contexto, não manchete: quem opera já sabe onde está, e um
        corpo 32 disputava atenção com o Momento no ar, que é o que importa aqui.
      */}
      <CabecalhoTela
        etiqueta={noAr ? <span className="etiqueta-ao-vivo"><span className="pulso" />AO VIVO</span> : undefined}
        titulo={edicao.titulo ?? edicao.programa.nome}
        apoio={
          <>
            {(() => {
              const time = equipeDaEdicao(edicao.locutor, edicao.programa.equipe)
              return time.length > 0 && (
                <>
                  <Equipe pessoas={time} tamanho={24} />
                  <span>{time.map((p) => p.nome).join(', ')} ·</span>
                </>
              )
            })()}
            <span className="numerico">{hora(edicao.inicioEm)} às {hora(edicao.fimEm)}</span>
          </>
        }
      />

      {/*
        A grade vira sozinha, e o produtor não vira junto.

        Ficar com esta tela aberta enquanto o programa acaba é o cenário mais comum do
        turno — e publicar aqui depois disso cria um Momento preso a um programa que já
        saiu do ar: ativo no banco, invisível no No Ar do ouvinte. O aviso aparece no
        instante da virada, com o caminho para a operação que está valendo.
      */}
      {!noAr && (
        <div style={{
          marginTop: 18, padding: '14px 16px', borderRadius: 'var(--raio)',
          background: 'rgba(227,39,30,.08)', border: '1px solid rgba(227,39,30,.3)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <AlertTriangle size={17} style={{ color: 'var(--ao-vivo)', flex: 'none' }} />
          <span style={{ flex: 1, minWidth: 220, fontSize: 14, color: 'var(--texto)' }}>
            <strong style={{ fontWeight: 600 }}>Este programa não está mais no ar.</strong>{' '}
            <span style={{ color: 'var(--texto-2)' }}>
              O que você publicar aqui não vai aparecer no aplicativo.
            </span>
          </span>
          <a href="/hoje" className="btn" style={{ fontSize: 13.5, padding: '9px 14px', flex: 'none' }}>
            Ir para o que está no ar
          </a>
        </div>
      )}

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
            style={{
              textAlign: 'left', padding: 16, opacity: ocupado ? .5 : 1,
              // O Fofocômetro é o único formato que segura audiência em vez de pedir
              // resposta. Ganha o filete rosa para não se perder entre as enquetes.
              borderColor: t.tipo === 'FOFOCOMETRO' ? 'rgba(232,67,123,.4)' : undefined,
            }}>
            <div style={{ fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.tipo === 'FOFOCOMETRO' && <Zap size={14} style={{ color: 'var(--rosa)' }} />}
              {t.nome}
            </div>
            <div style={{ color: 'var(--texto-3)', fontSize: 12.5, marginTop: 6 }}>
              {t.tipo === 'FOFOCOMETRO'
                ? 'gancho agora · revelação com hora marcada'
                : `${t.tipo.toLowerCase()} · ${Math.round(t.duracaoSegundos / 60)} min${
                    t.opcoesPadrao.length > 0 ? ` · ${t.opcoesPadrao.length} opções` : ''
                  }`}
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
              const ordenadas = [...m.opcoes].sort((a, b) => b.votos - a.votos)
              const vencedora = ordenadas[0]
              const expandido = aberto === m.id
              const temResultado = m.opcoes.length > 0

              return (
                <div key={m.id} className="linha" style={{ overflow: 'hidden' }}>
                  {/*
                    A linha resume; o clique abre o resultado. A lista existe para o
                    produtor varrer o que aconteceu — e quando algo chama a atenção,
                    ele abre ali mesmo, sem sair da operação ao vivo.
                  */}
                  <div
                    onClick={() => temResultado && setAberto(expandido ? null : m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px',
                      cursor: temResultado ? 'pointer' : 'default',
                    }}
                  >
                    <div className="numerico" style={{ width: 52, color: 'var(--texto-3)', fontSize: 13.5 }}>
                      {hora(m.inicioEm)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5 }}>{m.titulo}</div>
                      {vencedora && total > 0 && !expandido && (
                        <div style={{ color: 'var(--texto-3)', fontSize: 12.5, marginTop: 3 }}>
                          {vencedora.emoji} {vencedora.rotulo} venceu · {total} {total === 1 ? 'participação' : 'participações'}
                        </div>
                      )}
                    </div>
                    {m.campanhaPatrocinadoraId && (
                      <span style={{
                        fontSize: 11, color: 'var(--rosa)', border: '1px solid rgba(232,67,123,.3)',
                        borderRadius: 999, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 5,
                      }}><Megaphone size={11} /> patrocinado</span>
                    )}
                    <span style={{ color: 'var(--texto-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {m.estado.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    {temResultado && (
                      <ChevronDown
                        size={16}
                        style={{
                          color: 'var(--texto-3)', flex: 'none',
                          transform: expandido ? 'rotate(180deg)' : 'none',
                          transition: 'transform .18s ease',
                        }}
                      />
                    )}
                  </div>

                  {expandido && temResultado && (
                    <div style={{ padding: '4px 18px 18px', borderTop: '1px solid var(--borda)' }}>
                      {total === 0 ? (
                        <div style={{ color: 'var(--texto-3)', fontSize: 13, paddingTop: 14 }}>
                          Ninguém participou deste Momento.
                        </div>
                      ) : (
                        <>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                            padding: '14px 0 12px', color: 'var(--texto-2)', fontSize: 13,
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Trophy size={14} style={{ color: 'var(--accent)' }} />
                              <strong style={{ color: 'var(--texto)', fontWeight: 500 }}>
                                {vencedora!.emoji} {vencedora!.rotulo}
                              </strong>
                              venceu
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Users size={14} />
                              <span className="numerico">{total}</span>
                              {total === 1 ? 'participação' : 'participações'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gap: 9 }}>
                            {ordenadas.map((o, i) => {
                              const pct = Math.round((o.votos / total) * 100)
                              const campeao = i === 0
                              return (
                                <div key={o.id} style={{
                                  position: 'relative', background: 'var(--fundo)',
                                  borderRadius: 8, overflow: 'hidden',
                                }}>
                                  <div style={{
                                    position: 'absolute', inset: 0, width: `${pct}%`,
                                    background: campeao ? 'rgba(129,216,208,.2)' : 'rgba(255,255,255,.05)',
                                  }} />
                                  <div style={{
                                    position: 'relative', display: 'flex', alignItems: 'center',
                                    gap: 10, padding: '10px 14px',
                                  }}>
                                    <span>{o.emoji}</span>
                                    <span style={{
                                      flex: 1, fontSize: 14,
                                      color: campeao ? 'var(--texto)' : 'var(--texto-2)',
                                      fontWeight: campeao ? 500 : 400,
                                    }}>{o.rotulo}</span>
                                    <span className="numerico" style={{
                                      fontSize: 13,
                                      color: campeao ? 'var(--accent)' : 'var(--texto-2)',
                                      fontWeight: campeao ? 500 : 400,
                                    }}>
                                      {o.votos} · {pct}%
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {editando && (
        // O Fofocômetro tem editor próprio: gancho, revelação, hora e fonte não cabem
        // no formulário de opções dos outros formatos.
        editando.tipo === 'FOFOCOMETRO' ? (
          <EditorFofocometro
            templateId={editando.id}
            ganchoSugerido={editando.titulo}
            ocupado={ocupado}
            aoPublicar={publicar}
            aoFechar={() => setEditando(null)}
          />
        ) : (
          <EditorMomento
            template={editando}
            ocupado={ocupado}
            aoPublicar={publicar}
            aoFechar={() => setEditando(null)}
          />
        )
      )}
    </main>
    </CascaStudio>
  )
}
