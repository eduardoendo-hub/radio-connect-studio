'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, MapPin, Phone, Radio, Inbox } from 'lucide-react'
import { chamar, hora, lerToken } from '../../lib/api'
import { CascaStudio, CabecalhoTela } from '../casca'

/**
 * Chat — o lado da produção.
 *
 * Duas colunas: a fila à esquerda, a conversa à direita. É o formato de qualquer
 * ferramenta de atendimento, e é assim de propósito — a produção da rádio não deveria
 * precisar aprender um jeito novo de responder mensagem.
 *
 * O que **não** é padrão de mensageiro está aqui por ser rádio: cada mensagem carrega o
 * programa em que nasceu. "Chegou durante o Bom Dia Band" é a informação que faz o
 * produtor decidir se o alô ainda faz sentido no ar ou se já passou o tempo.
 */

type Ouvinte = { id: string; nome: string | null; telefone: string | null; cidade: string | null }
type Resumo = {
  id: string
  ultimaMensagemEm: string | null
  ouvinte: Ouvinte
  ultima: { conteudo: string | null; direcao: string; tipo: string; enviadaEm: string } | null
  esperando: boolean
}
type Mensagem = {
  id: string
  direcao: string
  tipo: string
  conteudo: string | null
  enviadaEm: string
  edicao?: { programa: { nome: string } } | null
}

function quando(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const min = Math.floor((Date.now() - d.getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function Pagina() {
  const [conversas, setConversas] = useState<Resumo[]>([])
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [ouvinte, setOuvinte] = useState<Ouvinte | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const fim = useRef<HTMLDivElement>(null)

  const carregarFila = useCallback(async () => {
    const r = await chamar<{ conversas: Resumo[] }>('/studio/conversas')
    setConversas(r.conversas)
    return r.conversas
  }, [])

  useEffect(() => {
    if (!lerToken()) { location.href = '/'; return }
    carregarFila()
      .then((c) => setSelecionada((s) => s ?? c[0]?.id ?? null))
      .catch((e) => setErro(e.message))
  }, [carregarFila])

  // A fila se atualiza sozinha: mensagem que chega enquanto o produtor lê outra
  // conversa não pode depender de alguém lembrar de apertar F5.
  useEffect(() => {
    const t = setInterval(() => { carregarFila().catch(() => {}) }, 5000)
    return () => clearInterval(t)
  }, [carregarFila])

  const carregarConversa = useCallback(async (id: string) => {
    const r = await chamar<{ conversa: { ouvinte: Ouvinte }; mensagens: Mensagem[] }>(
      `/studio/conversas/${id}`,
    )
    setOuvinte(r.conversa.ouvinte)
    setMensagens(r.mensagens)
  }, [])

  useEffect(() => {
    if (!selecionada) return
    carregarConversa(selecionada).catch((e) => setErro(e.message))
    const t = setInterval(() => { carregarConversa(selecionada).catch(() => {}) }, 5000)
    return () => clearInterval(t)
  }, [selecionada, carregarConversa])

  useEffect(() => { fim.current?.scrollIntoView({ block: 'end' }) }, [mensagens.length])

  async function responder(e: React.FormEvent) {
    e.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo || !selecionada || enviando) return
    setEnviando(true)
    setErro('')
    try {
      await chamar(`/studio/conversas/${selecionada}/responder`, {
        method: 'POST',
        body: JSON.stringify({ conteudo }),
      })
      setTexto('')
      await Promise.all([carregarConversa(selecionada), carregarFila()])
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar.')
    } finally {
      setEnviando(false)
    }
  }

  const esperando = conversas.filter((c) => c.esperando).length

  return (
    <CascaStudio>
      <main style={{ padding: '22px 26px 0', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CabecalhoTela
          titulo="Chat"
          apoio={
            esperando > 0 ? (
              <><MessageSquare size={14} /> {esperando} {esperando === 1 ? 'esperando resposta' : 'esperando resposta'}</>
            ) : (
              <>Nenhuma conversa esperando</>
            )
          }
        />

        {erro && <div className="erro" style={{ marginBottom: 14 }}>{erro}</div>}

        <div className="chat-grade">
          {/* A fila. Ordenada por quem falou por último, com quem espera destacado. */}
          <div className="chat-fila">
            {conversas.length === 0 ? (
              <div style={{ padding: '30px 16px', color: 'var(--texto-3)', fontSize: 13.5, textAlign: 'center' }}>
                <Inbox size={22} style={{ marginBottom: 10, opacity: .6 }} />
                <div>Nenhuma conversa ainda.</div>
                <div style={{ marginTop: 6, fontSize: 12.5 }}>
                  Quando um ouvinte escrever pelo app, ele aparece aqui.
                </div>
              </div>
            ) : (
              conversas.map((c) => {
                const ativa = c.id === selecionada
                const nome = c.ouvinte.nome ?? 'Ouvinte'
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelecionada(c.id)}
                    className={`chat-fila-item${ativa ? ' ativa' : ''}`}
                  >
                    <span className="chat-avatar">{nome.charAt(0).toUpperCase()}</span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{
                          fontSize: 14, fontWeight: c.esperando ? 600 : 500,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                        }}>
                          {nome}
                        </span>
                        <span className="numerico" style={{ fontSize: 11, color: 'var(--texto-3)', flex: 'none' }}>
                          {quando(c.ultimaMensagemEm)}
                        </span>
                      </span>
                      <span style={{
                        display: 'block', marginTop: 3, fontSize: 12.5,
                        color: c.esperando ? 'var(--texto)' : 'var(--texto-3)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {c.ultima?.direcao === 'radio_para_ouvinte' && (
                          <span style={{ color: 'var(--texto-3)' }}>Você: </span>
                        )}
                        {c.ultima?.tipo === 'audio' ? 'Áudio' : c.ultima?.conteudo ?? '—'}
                      </span>
                    </span>
                    {c.esperando && <span className="chat-ponto" />}
                  </button>
                )
              })
            )}
          </div>

          {/* A conversa. */}
          <div className="chat-conversa">
            {!selecionada || !ouvinte ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--texto-3)', fontSize: 14,
              }}>
                Escolha uma conversa à esquerda.
              </div>
            ) : (
              <>
                <div className="chat-cabecalho">
                  <span className="chat-avatar" style={{ width: 38, height: 38, fontSize: 15 }}>
                    {(ouvinte.nome ?? 'O').charAt(0).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{ouvinte.nome ?? 'Ouvinte'}</div>
                    <div style={{
                      display: 'flex', gap: 14, marginTop: 2, flexWrap: 'wrap',
                      fontSize: 12, color: 'var(--texto-3)',
                    }}>
                      {ouvinte.telefone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={11} /> <span className="numerico">{ouvinte.telefone}</span>
                        </span>
                      )}
                      {ouvinte.cidade && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={11} /> {ouvinte.cidade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chat-corpo">
                  {mensagens.map((m, i) => {
                    const minha = m.direcao === 'radio_para_ouvinte'
                    // O programa só aparece quando muda: repetir a cada balão vira ruído.
                    const programa = m.edicao?.programa.nome
                    const anterior = mensagens[i - 1]?.edicao?.programa.nome
                    return (
                      <div key={m.id}>
                        {programa && programa !== anterior && (
                          <div className="chat-marco">
                            <Radio size={11} /> durante {programa}
                          </div>
                        )}
                        <div className={`chat-balao${minha ? ' minha' : ''}`}>
                          <div style={{ fontSize: 14, lineHeight: 1.4 }}>{m.conteudo}</div>
                          <div className="numerico chat-hora">{hora(m.enviadaEm)}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={fim} />
                </div>

                <form onSubmit={responder} className="chat-barra">
                  <input
                    className="campo"
                    placeholder="Responder para o ouvinte…"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    autoFocus
                  />
                  <button className="btn" disabled={enviando || !texto.trim()} style={{
                    display: 'flex', alignItems: 'center', gap: 8, flex: 'none',
                  }}>
                    <Send size={15} /> Enviar
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </CascaStudio>
  )
}
