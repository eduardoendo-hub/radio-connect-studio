'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Star, Archive, ArchiveRestore, Trash2, Zap } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar } from '../../lib/api'

type Opcao = { rotulo: string; emoji?: string }
type Quadro = {
  id: string
  nome: string
  tipo: string
  titulo: string
  texto: string | null
  opcoesPadrao: Opcao[]
  duracaoSegundos: number
  favorito: boolean
  arquivado: boolean
  cor: string | null
  icone: string | null
  foiAoAr: number
}

/**
 * Os formatos que a rádio pode colocar no ar.
 *
 * O rótulo diz o que acontece na tela do ouvinte, não como o campo se chama no banco.
 * Quem monta o quadro está decidindo o que a pessoa vai fazer com o telefone na mão.
 */
const TIPOS: { valor: string; rotulo: string; explica: string; temOpcoes: boolean }[] = [
  { valor: 'REACAO', rotulo: 'Reação', explica: 'Um toque para dizer o que achou. Amei, gostei, passa.', temOpcoes: true },
  { valor: 'ESCOLHA', rotulo: 'Escolha', explica: 'Duas ou mais opções disputando. Tem vencedor.', temOpcoes: true },
  { valor: 'ENQUETE', rotulo: 'Enquete', explica: 'Pergunta com alternativas e placar ao vivo.', temOpcoes: true },
  { valor: 'AVISO', rotulo: 'Aviso', explica: 'Recado na tela. Não há no que tocar.', temOpcoes: false },
  { valor: 'CHAMADA_PROMOCAO', rotulo: 'Chamada de promoção', explica: 'Puxa o ouvinte para a promoção que está no ar.', temOpcoes: false },
  { valor: 'RESULTADO', rotulo: 'Resultado', explica: 'Anuncia o que deu — sorteio, votação, disputa.', temOpcoes: false },
  { valor: 'FOFOCOMETRO', rotulo: 'Fofocômetro', explica: 'Gancho agora, revelação com hora marcada. Segura audiência em vez de pedir resposta.', temOpcoes: false },
]

const tipoDe = (v: string) => TIPOS.find((t) => t.valor === v) ?? TIPOS[0]!

export default function Momentos() {
  const [quadros, setQuadros] = useState<Quadro[]>([])
  const [icones, setIcones] = useState<string[]>([])
  const [vendo, setVendo] = useState<'vitrine' | 'arquivo'>('vitrine')
  const [editando, setEditando] = useState<Quadro | 'novo' | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar(aba = vendo) {
    setCarregando(true)
    try {
      const r = await chamar<{ quadros: Quadro[]; icones: string[] }>(
        `/studio/quadros${aba === 'arquivo' ? '?arquivados=1' : ''}`,
      )
      setQuadros(r.quadros ?? [])
      setIcones(r.icones ?? [])
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para carregar.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar(vendo) }, [vendo])

  async function mexer(q: Quadro, dados: Record<string, unknown>) {
    try {
      await chamar(`/studio/quadros/${q.id}`, { method: 'PATCH', body: JSON.stringify(dados) })
      await carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não deu para salvar.')
    }
  }

  return (
    <CascaStudio>
      <main style={{ padding: '22px 26px 40px', maxWidth: 1100 }}>
        <CabecalhoTela
          titulo="Momentos"
          apoio="Os formatos que viram botão no Ao Vivo. Um Momento nasce em menos de vinte segundos porque o quadro já estava pronto."
          acoes={
            <button className="btn-vazio" onClick={() => setEditando('novo')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
              <Plus size={14} /> Novo quadro
            </button>
          }
        />

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([['vitrine', 'Na vitrine'], ['arquivo', 'Arquivados']] as const).map(([v, r]) => (
            <button key={v} className={vendo === v ? 'btn' : 'btn-vazio'}
              style={{ fontSize: 12.5, padding: '6px 13px' }} onClick={() => setVendo(v)}>
              {r}
            </button>
          ))}
        </div>

        {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}
        {erro && <p style={{ color: '#FF9A95', fontSize: 13 }}>{erro}</p>}

        {!carregando && quadros.length === 0 && (
          <div className="cartao" style={{ padding: 30, textAlign: 'center' }}>
            <Zap size={20} style={{ color: 'var(--texto-3)' }} />
            <p style={{ marginTop: 10, fontSize: 14, color: 'var(--texto-3)' }}>
              {vendo === 'arquivo'
                ? 'Nada arquivado. Quadro que sai da vitrine aparece aqui.'
                : 'Nenhum quadro ainda. Sem eles, o Ao Vivo não tem o que publicar.'}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gap: 7 }}>
          {quadros.map((q) => (
            <div key={q.id} className="linha"
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '11px 14px',
                borderLeft: `3px solid ${q.cor ?? 'transparent'}`,
              }}>
              <button onClick={() => mexer(q, { favorito: !q.favorito })}
                title={q.favorito ? 'Tirar do topo da vitrine' : 'Deixar no topo da vitrine'}
                className="btn-vazio" style={{ padding: 6, border: 'none', background: 'none' }}>
                <Star size={15} fill={q.favorito ? 'var(--accent)' : 'none'}
                  style={{ color: q.favorito ? 'var(--accent)' : 'var(--texto-3)' }} />
              </button>

              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setEditando(q)}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{q.nome}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 2 }}>
                  {tipoDe(q.tipo).rotulo} · {Math.round(q.duracaoSegundos / 60)} min
                  {q.opcoesPadrao.length > 0 && ` · ${q.opcoesPadrao.length} opções`}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 62 }}>
                <div className="numerico" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
                  {q.foiAoAr}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--texto-3)', marginTop: 2 }}>
                  {q.foiAoAr === 1 ? 'vez no ar' : 'vezes no ar'}
                </div>
              </div>

              <button className="btn-vazio" style={{ padding: 7 }}
                title={q.arquivado ? 'Devolver para a vitrine' : 'Tirar da vitrine'}
                onClick={() => mexer(q, { arquivado: !q.arquivado })}>
                {q.arquivado ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              </button>

              {/*
                Apagar só faz sentido para o quadro criado errado agora há pouco. O
                servidor recusa apagar o que já foi ao ar — e o botão some antes, para a
                pessoa não descobrir a regra levando um erro na cara.
              */}
              {q.foiAoAr === 0 && (
                <button className="btn-vazio" style={{ padding: 7, color: 'var(--texto-3)' }}
                  title="Apagar" onClick={async () => {
                    if (!confirm(`Apagar "${q.nome}"?`)) return
                    await chamar(`/studio/quadros/${q.id}`, { method: 'DELETE' })
                    await carregar()
                  }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {editando && (
          <Editor
            quadro={editando === 'novo' ? null : editando}
            icones={icones}
            aoFechar={() => setEditando(null)}
            aoSalvar={async () => { setEditando(null); await carregar() }}
          />
        )}
      </main>
    </CascaStudio>
  )
}

function Editor({ quadro, icones, aoFechar, aoSalvar }: {
  quadro: Quadro | null
  icones: string[]
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const editando = quadro !== null
  const [nome, setNome] = useState(quadro?.nome ?? '')
  const [tipo, setTipo] = useState(quadro?.tipo ?? 'ENQUETE')
  const [titulo, setTitulo] = useState(quadro?.titulo ?? '')
  const [texto, setTexto] = useState(quadro?.texto ?? '')
  const [opcoes, setOpcoes] = useState<Opcao[]>(
    quadro?.opcoesPadrao?.length ? quadro.opcoesPadrao : [{ rotulo: '' }, { rotulo: '' }],
  )
  const [minutos, setMinutos] = useState(Math.round((quadro?.duracaoSegundos ?? 180) / 60))
  const [comCor, setComCor] = useState(!!quadro?.cor)
  const [cor, setCor] = useState(quadro?.cor ?? '#E8437B')
  const [icone, setIcone] = useState(quadro?.icone ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const t = tipoDe(tipo)
  const limpas = opcoes.filter((o) => o.rotulo.trim().length > 0)

  function mudar(fn: () => void) { setErro(''); fn() }

  return (
    <div onClick={aoFechar} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,10,10,.72)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="cartao"
        style={{
          width: '100%', maxWidth: 840, maxHeight: '92vh', overflowY: 'auto', padding: 22,
          display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 26,
        }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, flex: 1 }}>
              {editando ? 'Editar quadro' : 'Novo quadro'}
            </h2>
            <button className="btn-vazio" onClick={aoFechar} style={{ padding: 7 }}><X size={15} /></button>
          </div>

          <label className="rotulo">Nome do quadro</label>
          <input className="campo" value={nome} autoFocus
            onChange={(e) => mudar(() => setNome(e.target.value))}
            placeholder="Batalha das Músicas" />
          <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6 }}>
            É o rótulo do botão no Ao Vivo. Só a produção vê.
          </p>

          <label className="rotulo" style={{ marginTop: 16 }}>O que o ouvinte faz</label>
          <select className="campo" value={tipo} onChange={(e) => mudar(() => {
            setTipo(e.target.value)
            // Trocar para um formato sem opções e deixar as antigas guardadas faria o
            // servidor recusar por um motivo que não está na tela.
            if (!tipoDe(e.target.value).temOpcoes) setOpcoes([])
            else if (limpas.length < 2) setOpcoes([{ rotulo: '' }, { rotulo: '' }])
          })}>
            {TIPOS.map((x) => <option key={x.valor} value={x.valor}>{x.rotulo}</option>)}
          </select>
          <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
            {t.explica}
          </p>

          <label className="rotulo" style={{ marginTop: 16 }}>Pergunta padrão</label>
          <input className="campo" value={titulo}
            onChange={(e) => mudar(() => setTitulo(e.target.value))}
            placeholder="Batalha! Quem leva essa?" />
          <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6 }}>
            Vem preenchida no Ao Vivo e a produção troca na hora. O que importa é não
            começar do zero às seis da manhã.
          </p>

          {t.temOpcoes && (
            <>
              <label className="rotulo" style={{ marginTop: 16 }}>Opções padrão</label>
              <div style={{ display: 'grid', gap: 6 }}>
                {opcoes.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input className="campo" value={o.emoji ?? ''} maxLength={2}
                      style={{ width: 58, textAlign: 'center' }} placeholder="🙂"
                      onChange={(e) => mudar(() => {
                        const n = [...opcoes]; n[i] = { ...o, emoji: e.target.value || undefined }; setOpcoes(n)
                      })} />
                    <input className="campo" value={o.rotulo} style={{ flex: 1 }}
                      placeholder={`Opção ${i + 1}`}
                      onChange={(e) => mudar(() => {
                        const n = [...opcoes]; n[i] = { ...o, rotulo: e.target.value }; setOpcoes(n)
                      })} />
                    {opcoes.length > 2 && (
                      <button className="btn-vazio" style={{ padding: 8 }}
                        onClick={() => mudar(() => setOpcoes(opcoes.filter((_, j) => j !== i)))}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {opcoes.length < 6 && (
                <button className="btn-vazio" style={{ marginTop: 7, fontSize: 12, padding: '5px 10px' }}
                  onClick={() => mudar(() => setOpcoes([...opcoes, { rotulo: '' }]))}>
                  <Plus size={12} /> Mais uma
                </button>
              )}
              <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 8, lineHeight: 1.5 }}>
                O emoji nunca vai sozinho: o rótulo escrito é o que o leitor de tela lê.
              </p>
            </>
          )}

          <label className="rotulo" style={{ marginTop: 16 }}>Fica no ar por</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input className="campo numerico" type="number" min={1} max={60} value={minutos}
              style={{ width: 88 }}
              onChange={(e) => mudar(() => setMinutos(Number(e.target.value)))} />
            <span style={{ fontSize: 13, color: 'var(--texto-3)' }}>minutos</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, cursor: 'pointer' }}>
            <input type="checkbox" checked={comCor} style={{ width: 17, height: 17, accentColor: 'var(--accent)' }}
              onChange={(e) => mudar(() => {
                setComCor(e.target.checked)
                if (!e.target.checked) setIcone('')
              })} />
            <span style={{ fontSize: 13.5 }}>Este quadro tem identidade própria</span>
          </label>
          <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, marginLeft: 27, lineHeight: 1.5 }}>
            Quase nenhum deveria ter. Fofocômetro e Batalha têm porque são formatos com
            ritual — hora marcada, vencedor, expectativa. Se todo quadro ganhar cor,
            nenhum se destaca: vira arco-íris e a hierarquia morre. É a mesma razão de a
            vinheta significar alguma coisa no rádio.
          </p>

          {comCor && (
            <div style={{ marginLeft: 27, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="color" value={cor} onChange={(e) => mudar(() => setCor(e.target.value))}
                  style={{ width: 44, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
                <span className="numerico" style={{ fontSize: 12.5, color: 'var(--texto-3)' }}>{cor}</span>
              </div>
              <label className="rotulo" style={{ marginTop: 13 }}>Ícone</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['', ...icones].map((n) => (
                  <button key={n || 'nenhum'} onClick={() => mudar(() => setIcone(n))}
                    style={{
                      padding: '6px 11px', borderRadius: 999, fontSize: 12,
                      border: `1px solid ${icone === n ? 'var(--accent)' : 'var(--borda-forte)'}`,
                      background: icone === n ? 'rgba(129,216,208,.13)' : 'transparent',
                      color: icone === n ? 'var(--accent)' : 'var(--texto-2)',
                    }}>
                    {n || 'nenhum'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 7, lineHeight: 1.5 }}>
                Lista fechada: o aplicativo só sabe desenhar estes sete. Qualquer outro
                nome viraria um quadrado vazio no telefone do ouvinte.
              </p>
            </div>
          )}

          {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 16, lineHeight: 1.5 }}>{erro}</p>}

          <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
            <button className="btn" disabled={nome.trim().length < 2 || titulo.trim().length < 2 || salvando}
              style={{ opacity: nome.trim().length < 2 || titulo.trim().length < 2 || salvando ? .5 : 1 }}
              onClick={async () => {
                setSalvando(true); setErro('')
                const corpo = {
                  nome: nome.trim(),
                  tipo,
                  titulo: titulo.trim(),
                  texto: texto.trim() || null,
                  opcoesPadrao: t.temOpcoes
                    ? limpas.map((o) => ({ rotulo: o.rotulo.trim(), ...(o.emoji ? { emoji: o.emoji } : {}) }))
                    : [],
                  duracaoSegundos: Math.max(30, minutos * 60),
                  cor: comCor ? cor : null,
                  icone: comCor && icone ? icone : null,
                }
                try {
                  await chamar(
                    editando ? `/studio/quadros/${quadro!.id}` : '/studio/quadros',
                    { method: editando ? 'PATCH' : 'POST', body: JSON.stringify(corpo) },
                  )
                  aoSalvar()
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Não deu para salvar.')
                  setSalvando(false)
                }
              }}>
              {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar quadro'}
            </button>
            <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
          </div>
        </div>

        <Previa titulo={titulo} opcoes={limpas} cor={comCor ? cor : null} minutos={minutos} tipo={tipo} />
      </div>
    </div>
  )
}

/**
 * O quadro no telefone de quem está ouvindo.
 *
 * **Vale a coluna que ocupa.** Quem escreve a pergunta está olhando para um formulário e
 * decidindo por alguém que vai ler aquilo no ônibus, com o rádio ligado. A prévia é o
 * único lugar do Studio onde as duas coisas aparecem juntas — e é onde se percebe que a
 * pergunta não cabe, que a opção ficou comprida, que quatro alternativas viram quatro
 * tiras ilegíveis.
 */
function Previa({ titulo, opcoes, cor, minutos, tipo }: {
  titulo: string; opcoes: Opcao[]; cor: string | null; minutos: number; tipo: string
}) {
  return (
    <div>
      <div style={{
        fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase',
        color: 'var(--texto-3)', marginBottom: 10, fontWeight: 600,
      }}>
        No telefone do ouvinte
      </div>
      <div style={{
        background: '#0B0F10', border: '1px solid rgba(255,255,255,.09)',
        borderRadius: 22, padding: 14,
      }}>
        <div style={{
          border: `1px solid ${cor ? cor + '73' : 'rgba(246,130,31,.45)'}`,
          borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: cor ?? '#F6821F', display: 'inline-block',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.3, color: cor ?? '#F6821F',
            }}>
              AGORA
            </span>
            <span style={{ flex: 1 }} />
            <span className="numerico" style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>
              {minutos}min 00s
            </span>
          </div>

          <div style={{
            fontSize: 17, fontWeight: 800, lineHeight: 1.2, letterSpacing: -.3,
            marginTop: 11, color: '#fff', wordBreak: 'break-word',
          }}>
            {titulo || 'A pergunta aparece aqui'}
          </div>

          {opcoes.length > 0 ? (
            <div style={{ display: 'flex', gap: 7, marginTop: 13 }}>
              {opcoes.map((o, i) => (
                <div key={i} style={{
                  flex: 1, minWidth: 0, textAlign: 'center', padding: '11px 5px',
                  background: 'rgba(255,255,255,.2)', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,.28)',
                  fontSize: 11.5, color: '#fff', lineHeight: 1.3, wordBreak: 'break-word',
                }}>
                  {o.emoji && <div style={{ fontSize: 17, marginBottom: 3 }}>{o.emoji}</div>}
                  {o.rotulo}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', marginTop: 12, lineHeight: 1.5 }}>
              {tipo === 'FOFOCOMETRO'
                ? 'O relógio corre na tela. A revelação só chega na hora marcada — o servidor não manda antes.'
                : 'Sem nada para tocar: o quadro fica na tela e o ouvinte volta para o rádio.'}
            </div>
          )}
        </div>
      </div>
      {opcoes.length > 3 && (
        <p style={{ fontSize: 11, color: '#E8A33D', marginTop: 10, lineHeight: 1.5 }}>
          Com {opcoes.length} opções lado a lado, cada uma fica estreita demais para ler
          de relance. Duas ou três é o que costuma funcionar.
        </p>
      )}
    </div>
  )
}
