'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, X, Megaphone, Users, BarChart3 } from 'lucide-react'
import { CascaPlataforma } from '../../casca'
import { chamarPlataforma } from '../../../../lib/plataforma'

type Criativo = { id: string; tipo: string; url: string; posicoes: string[] }
type Campanha = {
  id: string
  nome: string
  formato: string
  status: string
  inicioEm: string
  fimEm: string
  vendidoPor: 'RADIO' | 'TECHNOW'
  valorTotal: string | null
  criativos: Criativo[]
  impressoes: number
  vigente: boolean
}
type Anunciante = { id: string; nome: string; contato: string | null; campanhas: Campanha[] }
type Operador = { id: string; nome: string; email: string; papel: string; ativo: boolean; ultimoLogin: string | null }

const FORMATOS = [
  { valor: 'banner', rotulo: 'Banner' },
  { valor: 'preroll', rotulo: 'Pré-roll' },
  { valor: 'momento_patrocinado', rotulo: 'Momento patrocinado' },
  { valor: 'promocao_patrocinada', rotulo: 'Promoção patrocinada' },
  { valor: 'programa_patrocinado', rotulo: 'Programa patrocinado' },
  { valor: 'chat_inline', rotulo: 'Chat' },
]

export default function Carteira() {
  const { id } = useParams<{ id: string }>()
  const [anunciantes, setAnunciantes] = useState<Anunciante[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoAnunciante, setNovoAnunciante] = useState(false)
  const [novaCampanhaDe, setNovaCampanhaDe] = useState<Anunciante | null>(null)
  const [editando, setEditando] = useState<{ anunciante: Anunciante; campanha: Campanha } | null>(null)

  async function carregar() {
    try {
      const [c, o] = await Promise.all([
        chamarPlataforma<{ anunciantes: Anunciante[] }>(`/emissoras/${id}/carteira`),
        chamarPlataforma<{ operadores: Operador[] }>(`/emissoras/${id}/operadores`),
      ])
      setAnunciantes(c.anunciantes ?? [])
      setOperadores(o.operadores ?? [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id])

  return (
    <CascaPlataforma titulo="Carteira" voltarPara="/plataforma/radios">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <p style={{ color: 'var(--texto-3)', fontSize: 13, margin: 0 }}>
          Banner, pré-roll e patrocínio só são entregues se a campanha existir aqui.
        </p>
        <div style={{ flex: 1 }} />
        <a href={`/plataforma/radios/${id}/relatorio`} className="btn-vazio"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px', marginRight: 8 }}>
          <BarChart3 size={14} /> Entrega
        </a>
        <button className="btn-vazio" onClick={() => setNovoAnunciante(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
          <Plus size={14} /> Novo anunciante
        </button>
      </div>

      {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}

      {!carregando && anunciantes.length === 0 && (
        <div className="cartao" style={{ padding: 30, textAlign: 'center' }}>
          <Megaphone size={22} style={{ color: 'var(--texto-3)' }} />
          <p style={{ marginTop: 11, fontSize: 15, fontWeight: 600 }}>Nenhum anunciante ainda</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {anunciantes.map((a) => (
          <div key={a.id} className="cartao" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{a.nome}</div>
                {a.contato && (
                  <div style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 2 }}>{a.contato}</div>
                )}
              </div>
              <button className="btn-vazio" onClick={() => setNovaCampanhaDe(a)}
                style={{ fontSize: 12, padding: '6px 11px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={13} /> Campanha
              </button>
            </div>

            {a.campanhas.length > 0 && (
              <div style={{ display: 'grid', gap: 6, marginTop: 14 }}>
                {a.campanhas.map((c) => (
                  <div key={c.id} className="linha" style={{ padding: '9px 12px', cursor: 'pointer' }}
                    onClick={() => setEditando({ anunciante: a, campanha: c })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 2 }}>
                          <span style={{ color: c.vigente ? 'var(--accent)' : 'var(--texto-3)', fontWeight: 600 }}>
                            {c.vigente ? 'Vigente' : c.status.toLowerCase()}
                          </span>
                          {' · '}{FORMATOS.find((f) => f.valor === c.formato)?.rotulo ?? c.formato}
                          {' · '}até {new Date(c.fimEm).toLocaleDateString('pt-BR')}
                          {c.criativos.length === 0 && (
                            <span style={{ color: '#FF9A95' }}> · sem criativo</span>
                          )}
                        </div>
                      </div>
                      {/* Quem vendeu decide a divisão — é o dado comercial mais
                          importante da tela apesar de ser o menor. */}
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: .8,
                        padding: '3px 7px', borderRadius: 999,
                        border: '1px solid var(--borda-forte)',
                        color: c.vendidoPor === 'TECHNOW' ? 'var(--rosa)' : 'var(--texto-2)',
                      }}>
                        {c.vendidoPor}
                      </span>
                      <div style={{ textAlign: 'right', minWidth: 62 }}>
                        <div className="numerico" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
                          {c.impressoes}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--texto-3)', marginTop: 2 }}>impressões</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quem opera esta rádio. Está aqui para suporte — "não consigo entrar" — e não
          para administrar: quem entra e quem sai é decisão da emissora, pelo Studio. */}
      {operadores.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: 'var(--texto-3)',
          }}>
            <Users size={13} /> QUEM OPERA ESTA RÁDIO
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {operadores.map((o) => (
              <div key={o.id} className="linha"
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, opacity: o.ativo ? 1 : .5 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{o.nome}</span>
                <span style={{ fontSize: 11.5, color: 'var(--texto-3)' }}>{o.email}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 10.5, color: 'var(--texto-3)', letterSpacing: .6 }}>{o.papel}</span>
                {!o.ativo && <span style={{ fontSize: 10.5, color: '#FF9A95' }}>inativo</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {novoAnunciante && (
        <NovoAnunciante emissoraId={id} aoFechar={() => setNovoAnunciante(false)}
          aoCriar={async () => { setNovoAnunciante(false); await carregar() }} />
      )}
      {novaCampanhaDe && (
        <EditorCampanha emissoraId={id} anunciante={novaCampanhaDe}
          aoFechar={() => setNovaCampanhaDe(null)}
          aoSalvar={async () => { setNovaCampanhaDe(null); await carregar() }} />
      )}
      {editando && (
        <EditorCampanha emissoraId={id} anunciante={editando.anunciante} campanha={editando.campanha}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => { setEditando(null); await carregar() }} />
      )}
    </CascaPlataforma>
  )
}

function Janela({ children, aoFechar, titulo, apoio }: {
  children: React.ReactNode; aoFechar: () => void; titulo: string; apoio?: string
}) {
  return (
    <div onClick={aoFechar} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,10,10,.72)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="cartao"
        style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{titulo}</h2>
            {apoio && <p style={{ fontSize: 12.5, color: 'var(--texto-3)', margin: '5px 0 0' }}>{apoio}</p>}
          </div>
          <button className="btn-vazio" onClick={aoFechar} style={{ padding: 7 }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NovoAnunciante({ emissoraId, aoFechar, aoCriar }: {
  emissoraId: string; aoFechar: () => void; aoCriar: () => void
}) {
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  return (
    <Janela titulo="Novo anunciante" aoFechar={aoFechar}>
      <label className="rotulo">Nome</label>
      <input className="campo" value={nome} autoFocus onChange={(e) => setNome(e.target.value)}
        placeholder="Soneda" />
      <label className="rotulo" style={{ marginTop: 14 }}>Contato</label>
      <input className="campo" value={contato} onChange={(e) => setContato(e.target.value)}
        placeholder="comercial@soneda.com.br" />
      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 12 }}>{erro}</p>}
      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={nome.trim().length < 2 || salvando}
          style={{ opacity: nome.trim().length < 2 || salvando ? .5 : 1 }}
          onClick={async () => {
            setSalvando(true); setErro('')
            try {
              await chamarPlataforma(`/emissoras/${emissoraId}/anunciantes`, {
                method: 'POST',
                body: JSON.stringify({ nome: nome.trim(), contato: contato.trim() || undefined }),
              })
              aoCriar()
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para criar.')
              setSalvando(false)
            }
          }}>
          {salvando ? 'Criando…' : 'Criar'}
        </button>
        <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
      </div>
    </Janela>
  )
}

/**
 * Cria e edita, no mesmo formulário.
 *
 * Contrato se corrige: o período muda, o valor é renegociado, o formato foi cadastrado
 * errado. Antes só dava para criar de novo — e criar de novo joga fora as impressões já
 * contadas, que são justamente a base da cobrança.
 */
function EditorCampanha({ emissoraId, anunciante, campanha, aoFechar, aoSalvar }: {
  emissoraId: string
  anunciante: Anunciante
  campanha?: Campanha
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const editando = campanha !== undefined
  const hoje = new Date()
  const daquiAUmMes = new Date(hoje.getTime() + 30 * 864e5)
  const p = (n: number) => n.toString().padStart(2, '0')
  const data = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`

  const [nome, setNome] = useState(campanha?.nome ?? '')
  const [formato, setFormato] = useState(campanha?.formato ?? 'banner')
  const [inicioEm, setInicioEm] = useState(campanha ? data(new Date(campanha.inicioEm)) : data(hoje))
  const [fimEm, setFimEm] = useState(campanha ? data(new Date(campanha.fimEm)) : data(daquiAUmMes))
  const [vendidoPor, setVendidoPor] = useState<'TECHNOW' | 'RADIO'>(campanha?.vendidoPor ?? 'TECHNOW')
  const [valor, setValor] = useState(campanha?.valorTotal ?? '')
  const [status, setStatus] = useState(campanha?.status ?? 'ATIVA')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  return (
    <Janela
      titulo={editando ? 'Editar campanha' : 'Nova campanha'}
      apoio={editando ? `${anunciante.nome} · ${campanha!.impressoes} impressões já contadas` : anunciante.nome}
      aoFechar={aoFechar}>
      <label className="rotulo">Nome</label>
      <input className="campo" value={nome} autoFocus onChange={(e) => setNome(e.target.value)}
        placeholder="Soneda · Agosto" />

      <label className="rotulo" style={{ marginTop: 14 }}>Formato</label>
      <select className="campo" value={formato} onChange={(e) => setFormato(e.target.value)}>
        {FORMATOS.map((f) => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
        <div>
          <label className="rotulo">Início</label>
          <input className="campo" type="date" value={inicioEm} onChange={(e) => setInicioEm(e.target.value)} />
        </div>
        <div>
          <label className="rotulo">Fim</label>
          <input className="campo" type="date" value={fimEm} onChange={(e) => setFimEm(e.target.value)} />
        </div>
      </div>

      <label className="rotulo" style={{ marginTop: 14 }}>Quem vendeu</label>
      <select className="campo" value={vendidoPor}
        onChange={(e) => setVendidoPor(e.target.value as 'TECHNOW' | 'RADIO')}>
        <option value="TECHNOW">TechNow — receita integral</option>
        <option value="RADIO">Rádio — divisão 70/30</option>
      </select>
      <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
        É o campo que decide a divisão. Errar aqui é errar o fechamento do mês.
      </p>

      <label className="rotulo" style={{ marginTop: 14 }}>Valor total</label>
      <input className="campo numerico" value={valor} inputMode="decimal"
        onChange={(e) => setValor(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="5000" />

      {editando && (
        <>
          <label className="rotulo" style={{ marginTop: 14 }}>Situação</label>
          <select className="campo" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ATIVA">Ativa</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
            <option value="APROVADA">Aprovada</option>
            <option value="ENCERRADA">Encerrada</option>
            <option value="REJEITADA">Rejeitada</option>
          </select>
          <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
            Só campanha <strong style={{ color: 'var(--texto-2)' }}>ativa e no período</strong> é
            entregue. Encerrar aqui tira do ar sem apagar o que já foi contado.
          </p>
        </>
      )}

      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 12 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={nome.trim().length < 2 || salvando}
          style={{ opacity: nome.trim().length < 2 || salvando ? .5 : 1 }}
          onClick={async () => {
            setSalvando(true); setErro('')
            try {
              await chamarPlataforma(
                editando
                  ? `/emissoras/${emissoraId}/campanhas/${campanha!.id}`
                  : `/emissoras/${emissoraId}/campanhas`,
                {
                method: editando ? 'PATCH' : 'POST',
                body: JSON.stringify({
                  anuncianteId: anunciante.id,
                  nome: nome.trim(),
                  formato,
                  status,
                  // Data de calendário: o dia inteiro conta, então o fim vai para o
                  // último instante. Campanha que termina "no dia 30" e para de valer à
                  // meia-noite do dia 29 é reclamação garantida do anunciante.
                  inicioEm: new Date(`${inicioEm}T00:00:00`).toISOString(),
                  fimEm: new Date(`${fimEm}T23:59:59`).toISOString(),
                  vendidoPor,
                  ...(valor ? { valorTotal: Number(valor.replace(',', '.')) } : {}),
                }),
              })
              aoSalvar()
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para criar.')
              setSalvando(false)
            }
          }}>
          {salvando ? 'Criando…' : 'Criar campanha'}
        </button>
        <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
      </div>
    </Janela>
  )
}
