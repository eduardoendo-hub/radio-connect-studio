'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Trash2, Mic, Radio } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar } from '../../lib/api'
import { equipeDaEdicao } from '../avatar'

type Locutor = { id: string; nome: string; bio: string | null; ativo: boolean }
type Programa = {
  id: string
  nome: string
  corDestaque: string | null
  ativo: boolean
  anunciosAtivos: boolean
  locutorTitular: { id: string; nome: string } | null
  equipe: { id: string; nome: string }[]
  faixas: number
}
type Slot = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFim: string
  programa: { id: string; nome: string; corDestaque: string | null; locutorTitular: { nome: string } | null }
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * A grade da semana.
 *
 * **Uma coluna por dia, e não uma lista.** Grade de rádio é uma coisa que se lê de
 * relance procurando buraco: onde não tem programa, o que se repete de segunda a sexta,
 * o que muda no fim de semana. Lista ordenada por hora esconde exatamente isso.
 *
 * Os buracos aparecem de propósito. Faixa vazia no meio da tarde é a informação mais
 * útil desta tela — é lá que o aplicativo mostra "a programação continua" em vez de um
 * programa.
 */
export default function Grade() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [programas, setProgramas] = useState<Programa[]>([])
  const [locutores, setLocutores] = useState<Locutor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<'grade' | 'programas' | 'locutores'>('grade')
  const [novaFaixa, setNovaFaixa] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const [g, p, l] = await Promise.all([
        chamar<{ slots: Slot[] }>('/studio/grade'),
        chamar<{ programas: Programa[] }>('/studio/programas'),
        chamar<{ locutores: Locutor[] }>('/studio/locutores'),
      ])
      setSlots(g.slots ?? [])
      setProgramas(p.programas ?? [])
      setLocutores(l.locutores ?? [])
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para carregar.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() }, [])

  return (
    <CascaStudio>
      <main style={{ padding: '22px 26px 40px', maxWidth: 1180 }}>
        <CabecalhoTela
          titulo="Programação"
          apoio="A grade vira a programação do aplicativo, sete dias à frente."
          acoes={
            aba === 'grade' ? (
              <button className="btn-vazio" onClick={() => setNovaFaixa(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
                <Plus size={14} /> Nova faixa
              </button>
            ) : undefined
          }
        />

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([['grade', 'Grade'], ['programas', 'Programas'], ['locutores', 'Locutores']] as const).map(
            ([v, r]) => (
              <button key={v} className={aba === v ? 'btn' : 'btn-vazio'}
                style={{ fontSize: 12.5, padding: '6px 13px' }}
                onClick={() => setAba(v)}>
                {r}
              </button>
            ),
          )}
        </div>

        {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}
        {erro && <p style={{ color: '#FF9A95', fontSize: 13 }}>{erro}</p>}

        {aba === 'grade' && !carregando && (
          <Semana slots={slots} aoRemover={async (id) => {
            if (!confirm('Tirar esta faixa da grade?')) return
            await chamar(`/studio/grade/${id}`, { method: 'DELETE' })
            await carregar()
          }} />
        )}

        {aba === 'programas' && !carregando && (
          <Programas programas={programas} locutores={locutores} aoMudar={carregar} />
        )}

        {aba === 'locutores' && !carregando && (
          <Locutores locutores={locutores} aoMudar={carregar} />
        )}

        {novaFaixa && (
          <NovaFaixa
            programas={programas.filter((p) => p.ativo)}
            aoFechar={() => setNovaFaixa(false)}
            aoCriar={async () => { setNovaFaixa(false); await carregar() }}
          />
        )}
      </main>
    </CascaStudio>
  )
}

const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
const relogio = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`


/**
 * O que existe no dia, com os buracos entre uma faixa e outra.
 *
 * **O buraco é a informação.** Quem abre esta tela quase sempre está procurando onde
 * cabe o programa novo, e uma lista de faixas coladas esconde exatamente isso: a grade
 * da Band não tem nada das 20h às 21h e ninguém percebia. É lá que o aplicativo mostra
 * "a programação continua" em vez de um programa.
 *
 * Menos de 15 minutos não conta. A grade termina às 23:59 e recomeça à 01:00 — marcar o
 * minuto que sobra antes da meia-noite encheria as sete colunas de ruído para esconder
 * a hora inteira que importa de verdade.
 */
function comBuracos(doDia: Slot[]) {
  const linhas: ({ tipo: 'faixa'; slot: Slot } | { tipo: 'livre'; de: string; ate: string })[] = []
  let cursor = 0
  for (const slot of doDia) {
    const comeca = minutos(slot.horaInicio)
    if (comeca - cursor >= 15) {
      linhas.push({ tipo: 'livre', de: relogio(cursor), ate: slot.horaInicio })
    }
    linhas.push({ tipo: 'faixa', slot })
    cursor = Math.max(cursor, minutos(slot.horaFim))
  }
  if (24 * 60 - cursor >= 15) linhas.push({ tipo: 'livre', de: relogio(cursor), ate: '24:00' })
  return linhas
}

function Semana({ slots, aoRemover }: { slots: Slot[]; aoRemover: (id: string) => void }) {
  const hoje = new Date().getDay()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {DIAS.map((_, dia) => {
        const doDia = slots.filter((s) => s.diaSemana === dia)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        return (
          <div key={dia}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: .8, marginBottom: 8,
              color: dia === hoje ? 'var(--accent)' : 'var(--texto-3)',
            }}>
              {CURTO[dia].toUpperCase()}
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              {comBuracos(doDia).map((linha, i) =>
                linha.tipo === 'livre' ? (
                  <div key={`livre-${i}`} title="Nada na grade neste horário"
                    style={{
                      fontSize: 10, color: 'var(--texto-3)', padding: '7px 8px',
                      border: '1px dashed var(--borda)', borderRadius: 8, textAlign: 'center',
                      lineHeight: 1.35,
                    }}>
                    <span className="numerico">{linha.de}–{linha.ate}</span>
                    <br />livre
                  </div>
                ) : (
                  <div key={linha.slot.id} className="linha"
                    style={{
                      padding: '8px 9px',
                      borderLeft: `3px solid ${linha.slot.programa.corDestaque ?? 'var(--borda-forte)'}`,
                    }}>
                    <div className="numerico" style={{ fontSize: 10.5, color: 'var(--texto-3)' }}>
                      {linha.slot.horaInicio}–{linha.slot.horaFim}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, lineHeight: 1.25 }}>
                      {linha.slot.programa.nome}
                    </div>
                    {linha.slot.programa.locutorTitular && (
                      <div style={{ fontSize: 10, color: 'var(--texto-3)', marginTop: 2 }}>
                        {linha.slot.programa.locutorTitular.nome}
                      </div>
                    )}
                    <button className="btn-vazio" title="Tirar da grade"
                      style={{ marginTop: 6, fontSize: 10.5, padding: '3px 7px', color: 'var(--texto-3)' }}
                      onClick={() => aoRemover(linha.slot.id)}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Janela({ children, titulo, apoio, aoFechar }: {
  children: React.ReactNode; titulo: string; apoio?: string; aoFechar: () => void
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

function NovaFaixa({ programas, aoFechar, aoCriar }: {
  programas: Programa[]; aoFechar: () => void; aoCriar: () => void
}) {
  const [programaId, setProgramaId] = useState(programas[0]?.id ?? '')
  // Segunda a sexta pré-marcado: é como quase toda faixa de rádio nasce.
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5])
  const [horaInicio, setHoraInicio] = useState('06:00')
  const [horaFim, setHoraFim] = useState('09:00')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  return (
    <Janela titulo="Nova faixa" apoio="O mesmo horário em vários dias, de uma vez." aoFechar={aoFechar}>
      <label className="rotulo">Programa</label>
      <select className="campo" value={programaId} onChange={(e) => setProgramaId(e.target.value)}>
        {programas.length === 0 && <option value="">Cadastre um programa primeiro</option>}
        {programas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>

      <label className="rotulo" style={{ marginTop: 15 }}>Dias</label>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {CURTO.map((r, i) => {
          const marcado = dias.includes(i)
          return (
            <button key={i}
              onClick={() => setDias(marcado ? dias.filter((d) => d !== i) : [...dias, i])}
              style={{
                padding: '7px 12px', borderRadius: 999, fontSize: 12.5,
                border: `1px solid ${marcado ? 'var(--accent)' : 'var(--borda-forte)'}`,
                background: marcado ? 'rgba(129,216,208,.13)' : 'transparent',
                color: marcado ? 'var(--accent)' : 'var(--texto-2)',
              }}>
              {r}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 15 }}>
        <div>
          <label className="rotulo">Começa</label>
          <input className="campo numerico" type="time" value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)} />
        </div>
        <div>
          <label className="rotulo">Termina</label>
          <input className="campo numerico" type="time" value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)} />
        </div>
      </div>

      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 14 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={!programaId || dias.length === 0 || salvando}
          style={{ opacity: programaId && dias.length && !salvando ? 1 : .5 }}
          onClick={async () => {
            setSalvando(true); setErro('')
            try {
              await chamar('/studio/grade', {
                method: 'POST',
                body: JSON.stringify({ programaId, dias, horaInicio, horaFim }),
              })
              aoCriar()
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para criar.')
              setSalvando(false)
            }
          }}>
          {salvando ? 'Criando…' : 'Pôr na grade'}
        </button>
        <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
      </div>
    </Janela>
  )
}

function Programas({ programas, locutores, aoMudar }: {
  programas: Programa[]; locutores: Locutor[]; aoMudar: () => void
}) {
  const [editando, setEditando] = useState<Programa | 'novo' | null>(null)
  return (
    <>
      <div style={{ display: 'flex', marginBottom: 12 }}>
        <div style={{ flex: 1 }} />
        <button className="btn-vazio" onClick={() => setEditando('novo')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
          <Plus size={14} /> Novo programa
        </button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {programas.map((p) => (
          <div key={p.id} className="linha" onClick={() => setEditando(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              cursor: 'pointer', opacity: p.ativo ? 1 : .5,
              borderLeft: `3px solid ${p.corDestaque ?? 'var(--borda-forte)'}`,
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
              <div style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 1 }}>
                {equipeDaEdicao(p.locutorTitular, p.equipe).map((e) => e.nome).join(', ') || 'sem equipe'}
                {!p.anunciosAtivos && ' · sem publicidade'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="numerico" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
                {p.faixas}
              </div>
              <div style={{ fontSize: 10, color: 'var(--texto-3)', marginTop: 2 }}>
                {p.faixas === 1 ? 'faixa' : 'faixas'}
              </div>
            </div>
          </div>
        ))}
      </div>
      {editando && (
        <EditorPrograma
          programa={editando === 'novo' ? null : editando}
          locutores={locutores.filter((l) => l.ativo)}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => { setEditando(null); aoMudar() }}
        />
      )}
    </>
  )
}

function EditorPrograma({ programa, locutores, aoFechar, aoSalvar }: {
  programa: Programa | null
  locutores: Locutor[]
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const editando = programa !== null
  const [nome, setNome] = useState(programa?.nome ?? '')
  const [cor, setCor] = useState(programa?.corDestaque ?? '#F6821F')
  const [titular, setTitular] = useState(programa?.locutorTitular?.id ?? '')
  // Abre mostrando a realidade e não o recorte: a grade que veio do documento da Band
  // grava `equipe` como "os outros além do titular", esta tela grava "todo mundo". As
  // duas telas do Studio e o aplicativo já resolvem isso na mesma função — reusá-la aqui
  // evita que "A Hora do Ronco" abra sem o Tadeu, que é justamente quem o ouvinte conhece.
  const [equipe, setEquipe] = useState<string[]>(
    programa ? equipeDaEdicao(programa.locutorTitular, programa.equipe).map((e) => e.id!) : [],
  )
  const [anuncios, setAnuncios] = useState(programa?.anunciosAtivos ?? true)
  const [ativo, setAtivo] = useState(programa?.ativo ?? true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  return (
    <Janela titulo={editando ? 'Editar programa' : 'Novo programa'} aoFechar={aoFechar}>
      <label className="rotulo">Nome</label>
      <input className="campo" value={nome} autoFocus onChange={(e) => setNome(e.target.value)}
        placeholder="A Hora do Ronco" />

      <label className="rotulo" style={{ marginTop: 15 }}>Cor</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
          style={{ width: 44, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
        <span className="numerico" style={{ fontSize: 12.5, color: 'var(--texto-3)' }}>{cor}</span>
      </div>

      <label className="rotulo" style={{ marginTop: 15 }}>Quem assina</label>
      <select className="campo" value={titular} onChange={(e) => {
        setTitular(e.target.value)
        // Quem assina está na equipe por definição — ele apresenta. Deixar de fora seria
        // pedir que a pessoa marcasse a mesma coisa duas vezes.
        if (e.target.value && !equipe.includes(e.target.value)) setEquipe([...equipe, e.target.value])
      }}>
        <option value="">Ninguém</option>
        {locutores.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
      </select>

      <label className="rotulo" style={{ marginTop: 15 }}>No microfone</label>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {locutores.map((l) => {
          const marcado = equipe.includes(l.id)
          return (
            <button key={l.id}
              onClick={() => setEquipe(marcado ? equipe.filter((i) => i !== l.id) : [...equipe, l.id])}
              style={{
                padding: '6px 11px', borderRadius: 999, fontSize: 12,
                border: `1px solid ${marcado ? 'var(--accent)' : 'var(--borda-forte)'}`,
                background: marcado ? 'rgba(129,216,208,.13)' : 'transparent',
                color: marcado ? 'var(--accent)' : 'var(--texto-2)',
              }}>
              {l.nome}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 7, lineHeight: 1.5 }}>
        Rádio quase nunca é uma voz só. O aplicativo mostra todos, com quem assina
        primeiro.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, cursor: 'pointer' }}>
        <input type="checkbox" checked={anuncios} onChange={(e) => setAnuncios(e.target.checked)}
          style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
        <span style={{ fontSize: 13.5 }}>Aceita publicidade</span>
      </label>
      <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, marginLeft: 27, lineHeight: 1.5 }}>
        Desligue no horário político eleitoral, no religioso, ou num especial vendido com
        exclusividade. Sem isso, banner e pré-roll entram normalmente.
      </p>

      {editando && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)}
            style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: 13.5 }}>{ativo ? 'Na grade' : 'Fora do ar'}</span>
        </label>
      )}

      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 14 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={nome.trim().length < 2 || salvando}
          style={{ opacity: nome.trim().length < 2 || salvando ? .5 : 1 }}
          onClick={async () => {
            setSalvando(true); setErro('')
            const corpo = {
              nome: nome.trim(),
              corDestaque: cor,
              locutorTitularId: titular || null,
              equipeIds: equipe,
              anunciosAtivos: anuncios,
              ...(editando ? { ativo } : {}),
            }
            try {
              await chamar(
                editando ? `/studio/programas/${programa!.id}` : '/studio/programas',
                { method: editando ? 'PATCH' : 'POST', body: JSON.stringify(corpo) },
              )
              aoSalvar()
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para salvar.')
              setSalvando(false)
            }
          }}>
          {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
        </button>
        <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
      </div>
    </Janela>
  )
}

function Locutores({ locutores, aoMudar }: { locutores: Locutor[]; aoMudar: () => void }) {
  const [editando, setEditando] = useState<Locutor | 'novo' | null>(null)
  return (
    <>
      <div style={{ display: 'flex', marginBottom: 12 }}>
        <div style={{ flex: 1 }} />
        <button className="btn-vazio" onClick={() => setEditando('novo')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
          <Plus size={14} /> Novo locutor
        </button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {locutores.map((l) => (
          <div key={l.id} className="linha" onClick={() => setEditando(l)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              cursor: 'pointer', opacity: l.ativo ? 1 : .5,
            }}>
            <Mic size={14} style={{ color: 'var(--texto-3)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{l.nome}</div>
              {l.bio && (
                <div style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 1 }}>{l.bio}</div>
              )}
            </div>
            {!l.ativo && <span style={{ fontSize: 10.5, color: 'var(--texto-3)' }}>fora da escala</span>}
          </div>
        ))}
        {locutores.length === 0 && (
          <div className="cartao" style={{ padding: 26, textAlign: 'center' }}>
            <Radio size={20} style={{ color: 'var(--texto-3)' }} />
            <p style={{ marginTop: 10, fontSize: 14, color: 'var(--texto-3)' }}>
              Cadastre quem vai ao microfone antes de montar a grade.
            </p>
          </div>
        )}
      </div>
      {editando && (
        <EditorLocutor
          locutor={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => { setEditando(null); aoMudar() }}
        />
      )}
    </>
  )
}

function EditorLocutor({ locutor, aoFechar, aoSalvar }: {
  locutor: Locutor | null; aoFechar: () => void; aoSalvar: () => void
}) {
  const editando = locutor !== null
  const [nome, setNome] = useState(locutor?.nome ?? '')
  const [bio, setBio] = useState(locutor?.bio ?? '')
  const [ativo, setAtivo] = useState(locutor?.ativo ?? true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  return (
    <Janela titulo={editando ? 'Editar locutor' : 'Novo locutor'} aoFechar={aoFechar}>
      <label className="rotulo">Nome</label>
      <input className="campo" value={nome} autoFocus onChange={(e) => setNome(e.target.value)} />

      <label className="rotulo" style={{ marginTop: 15 }}>Uma linha sobre ele</label>
      <input className="campo" value={bio} onChange={(e) => setBio(e.target.value)}
        placeholder="A manhã não começa sem ele." />
      <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6 }}>
        Aparece no aplicativo, na tela do programa.
      </p>

      {editando && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)}
            style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: 13.5 }}>{ativo ? 'Na escala' : 'Fora da escala'}</span>
        </label>
      )}

      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 14 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={nome.trim().length < 2 || salvando}
          style={{ opacity: nome.trim().length < 2 || salvando ? .5 : 1 }}
          onClick={async () => {
            setSalvando(true); setErro('')
            try {
              await chamar(
                editando ? `/studio/locutores/${locutor!.id}` : '/studio/locutores',
                {
                  method: editando ? 'PATCH' : 'POST',
                  body: JSON.stringify({
                    nome: nome.trim(),
                    bio: bio.trim() || undefined,
                    ...(editando ? { ativo } : {}),
                  }),
                },
              )
              aoSalvar()
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para salvar.')
              setSalvando(false)
            }
          }}>
          {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
        </button>
        <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
      </div>
    </Janela>
  )
}
