'use client'

import { useEffect, useState } from 'react'
import { Gift, Plus, Trash2, Upload, X } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar, enviarImagem } from '../../lib/api'
import { SeletorPatrocinador } from '../patrocinador'

type Promocao = {
  id: string
  titulo: string
  descricao: string | null
  regras: string | null
  imagemUrl: string | null
  seloUrl: string | null
  sorteioEm: string | null
  campanhaPatrocinadoraId: string | null
  participantes: number
  patrocinador: string | null
  estado: 'no_ar' | 'agendada' | 'encerrada' | 'sorteada'
}

const ROTULO = {
  no_ar: { texto: 'No ar', cor: 'var(--accent)' },
  agendada: { texto: 'Agendada', cor: 'var(--texto-2)' },
  encerrada: { texto: 'Encerrada', cor: 'var(--texto-3)' },
  sorteada: { texto: 'Sorteada', cor: 'var(--texto-3)' },
} as const

/**
 * Promoções, do lado de quem opera.
 *
 * **Lista, não vitrine.** A primeira versão dava a cada promoção um cartão da altura de
 * um pôster, com a arte inteira sangrando na lateral. Ficava bonito com uma e virava
 * rolagem com quatro — e esta tela não existe para admirar a arte, existe para o
 * produtor achar a promoção certa e ver quantos entraram. Cada linha tem a altura de
 * uma linha, a miniatura é quadrada e pequena, e o que salta é o número.
 */
export default function PaginaPromocoes() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<Promocao | 'nova' | null>(null)

  async function carregar() {
    try {
      const r = await chamar<{ promocoes: Promocao[] }>('/studio/promocoes')
      setPromocoes(r.promocoes ?? [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() }, [])

  return (
    <CascaStudio>
      <CabecalhoTela
        titulo="Promoções"
        apoio="Enquanto está no ar, a promoção ocupa o bloco principal do aplicativo."
        acoes={
          // Botão discreto, e não a pílula gorda de antes.
          //
          // Criar promoção não é o que se faz o tempo todo nesta tela — é o que se faz
          // uma vez por semana. O que se faz sempre é olhar quantos entraram. Ação rara
          // não merece o maior elemento da tela.
          <button className="btn-vazio" onClick={() => setEditando('nova')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 13.5, padding: '8px 14px',
            }}>
            <Plus size={15} /> Nova promoção
          </button>
        }
      />

      {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}

      {!carregando && promocoes.length === 0 && (
        <div className="cartao" style={{ padding: 30, textAlign: 'center' }}>
          <Gift size={24} style={{ color: 'var(--texto-3)' }} />
          <p style={{ marginTop: 11, marginBottom: 4, fontSize: 15, fontWeight: 600 }}>
            Nenhuma promoção ainda
          </p>
          <p style={{ color: 'var(--texto-3)', fontSize: 13, margin: 0 }}>
            A promoção ocupa o bloco principal do aplicativo enquanto estiver no ar.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 7 }}>
        {promocoes.map((p) => (
          <div
            key={p.id}
            className="linha"
            onClick={() => setEditando(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 13,
              padding: '10px 14px', cursor: 'pointer',
              opacity: p.estado === 'no_ar' ? 1 : .72,
            }}
          >
            {/* Miniatura quadrada e pequena: serve para reconhecer, não para admirar.
                A arte inteira já tem a tela do aplicativo. */}
            {p.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imagemUrl} alt="" style={{
                width: 40, height: 40, objectFit: 'cover',
                borderRadius: 8, flexShrink: 0, background: '#000',
              }} />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,.05)',
                display: 'grid', placeItems: 'center',
              }}>
                <Gift size={16} style={{ color: 'var(--texto-3)' }} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14.5, fontWeight: 600, letterSpacing: -.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {p.titulo}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, marginTop: 2,
                fontSize: 11.5, color: 'var(--texto-3)',
              }}>
                <span style={{ color: ROTULO[p.estado].cor, fontWeight: 600 }}>
                  {ROTULO[p.estado].texto}
                </span>
                {p.sorteioEm && <span>· sorteio {quando(p.sorteioEm)}</span>}
                {p.patrocinador && <span>· {p.patrocinador}</span>}
              </div>
            </div>

            {/* O número de inscritos é o que o produtor veio ver. É a única coisa desta
                linha com corpo grande. */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="numerico" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>
                {p.participantes}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--texto-3)', marginTop: 3 }}>
                {p.participantes === 1 ? 'inscrito' : 'inscritos'}
              </div>
            </div>

            {p.estado === 'no_ar' && (
              <button
                className="btn-vazio"
                style={{ flexShrink: 0, fontSize: 12.5, padding: '6px 11px' }}
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!confirm(`Encerrar "${p.titulo}"? Ela sai do ar no aplicativo.`)) return
                  await chamar(`/studio/promocoes/${p.id}/encerrar`, { method: 'POST' })
                  await carregar()
                }}
              >
                Encerrar
              </button>
            )}

            {/* Apagar só aparece onde é seguro: promoção que ninguém tocou. Com
                inscrito, o botão nem existe — o servidor recusa de qualquer forma, mas
                oferecer uma ação que vai ser negada é desenhar uma armadilha. */}
            {p.estado !== 'no_ar' && p.participantes === 0 && (
              <button
                className="btn-vazio"
                title="Apagar"
                style={{ flexShrink: 0, fontSize: 12.5, padding: '6px 9px', color: 'var(--texto-3)' }}
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!confirm(`Apagar "${p.titulo}"? Ninguém se inscreveu nela.`)) return
                  await chamar(`/studio/promocoes/${p.id}`, { method: 'DELETE' })
                  await carregar()
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {editando && (
        <EditorPromocao
          promocao={editando === 'nova' ? null : editando}
          jaNoAr={editando === 'nova' ? promocoes.find((p) => p.estado === 'no_ar') ?? null : null}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => { setEditando(null); await carregar() }}
        />
      )}
    </CascaStudio>
  )
}

/** "hoje às 15h", "quinta às 15h30" — como o locutor fala no ar. */
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
function quando(iso: string) {
  const d = new Date(iso)
  const agora = new Date()
  const h = d.getMinutes() === 0
    ? `${d.getHours()}h`
    : `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`
  const mesmoDia = d.toDateString() === agora.toDateString()
  return mesmoDia ? `hoje às ${h}` : `${DIAS[d.getDay()]} às ${h}`
}

/** Um texto de partida para o regulamento. */
const REGRAS_PADRAO =
  'Promoção válida para maiores de 18 anos. Cada ouvinte concorre uma única vez. '
  + 'O sorteio acontece ao vivo e o nome do contemplado é anunciado pelo locutor. '
  + 'O prêmio é pessoal e intransferível.'

function EditorPromocao({
  promocao,
  jaNoAr,
  aoFechar,
  aoSalvar,
}: {
  /// `null` cria; com promoção, edita a que já existe.
  promocao: Promocao | null
  /// A que já está no ar. Só importa ao criar — ver o aviso lá embaixo.
  jaNoAr: Promocao | null
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const editando = promocao !== null
  const [titulo, setTitulo] = useState(promocao?.titulo ?? '')
  const [descricao, setDescricao] = useState(promocao?.descricao ?? '')
  // Regulamento já vem preenchido ao criar. Em branco, a pressa do ao vivo faz a
  // promoção ir ao ar sem regra nenhuma — e regra de sorteio é a parte que a emissora
  // não pode improvisar depois.
  const [regras, setRegras] = useState(promocao?.regras ?? REGRAS_PADRAO)
  const [imagemUrl, setImagemUrl] = useState(promocao?.imagemUrl ?? '')
  const [seloUrl, setSeloUrl] = useState(promocao?.seloUrl ?? '')
  const [enviando, setEnviando] = useState<'arte' | 'selo' | null>(null)
  const [patrocinio, setPatrocinio] = useState<string | null>(promocao?.campanhaPatrocinadoraId ?? null)
  const [sorteio, setSorteio] = useState(() =>
    promocao?.sorteioEm ? paraCampo(new Date(promocao.sorteioEm)) : sugestaoDeSorteio())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const valido = titulo.trim().length > 0 && sorteio.length > 0

  async function salvar() {
    if (!valido || salvando) return
    setSalvando(true); setErro('')
    try {
      await chamar(editando ? `/studio/promocoes/${promocao!.id}` : '/studio/promocoes', {
        method: editando ? 'PATCH' : 'POST',
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          regras: regras.trim() || undefined,
          imagemUrl: imagemUrl || undefined,
          seloUrl: seloUrl || undefined,
          // `datetime-local` entrega hora de parede sem fuso. O `new Date` do navegador
          // interpreta no fuso de quem digitou, que é o da emissora — e é justamente o
          // que se quer: o produtor marcou 15h pensando nas 15h dele.
          sorteioEm: new Date(sorteio).toISOString(),
          campanhaPatrocinadoraId: patrocinio ?? undefined,
        }),
      })
      aoSalvar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para salvar agora.')
      setSalvando(false)
    }
  }

  return (
    <div
      onClick={aoFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(4, 10, 10, .72)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="cartao"
        style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--accent)' }}>
              <Gift size={14} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                {editando ? 'EDITAR PROMOÇÃO' : 'NOVA PROMOÇÃO'}
              </span>
            </div>
            <p style={{ color: 'var(--texto-3)', fontSize: 12.5, margin: '5px 0 0' }}>
              {editando
                ? `${promocao!.participantes} ${promocao!.participantes === 1 ? 'pessoa já está' : 'pessoas já estão'} concorrendo. A mudança aparece no aplicativo na hora.`
                : 'Vai ao ar assim que você criar, e ocupa o bloco principal do aplicativo.'}
            </p>
          </div>
          <button className="btn-vazio" onClick={aoFechar} style={{ padding: 7 }}><X size={15} /></button>
        </div>

        <label className="rotulo">O prêmio, em uma linha</label>
        <input className="campo" value={titulo} autoFocus
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="De Pertinho com Zé Neto e Cristiano" />

        <label className="rotulo" style={{ marginTop: 15 }}>Chamada</label>
        <input className="campo" value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Você e um acompanhante dentro da Band, num show exclusivo." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginTop: 15 }}>
          <ArteDaPromocao
            rotulo="Arte" ajuda="foto do topo"
            url={imagemUrl} enviando={enviando === 'arte'}
            aoEscolher={async (f) => {
              setEnviando('arte')
              try { setImagemUrl(await enviarImagem(f)) } finally { setEnviando(null) }
            }}
            aoLimpar={() => setImagemUrl('')}
          />
          <ArteDaPromocao
            rotulo="Selo" ajuda="marca do quadro"
            url={seloUrl} enviando={enviando === 'selo'}
            aoEscolher={async (f) => {
              setEnviando('selo')
              try { setSeloUrl(await enviarImagem(f)) } finally { setEnviando(null) }
            }}
            aoLimpar={() => setSeloUrl('')}
          />
        </div>

        <label className="rotulo" style={{ marginTop: 16 }}>Sorteio</label>
        <input className="campo" type="datetime-local" value={sorteio}
          onChange={(e) => setSorteio(e.target.value)} />
        <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
          As inscrições fecham na hora do sorteio, como acontece no ar. É esta data que
          faz o ouvinte voltar.
        </p>

        <label className="rotulo" style={{ marginTop: 16 }}>Regulamento</label>
        <textarea className="campo" rows={4} value={regras}
          onChange={(e) => setRegras(e.target.value)} style={{ resize: 'vertical', lineHeight: 1.5 }} />
        <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
          Aparece acima do botão no aplicativo — quem participa aceita este texto.
        </p>

        <SeletorPatrocinador
          valor={patrocinio} aoMudar={setPatrocinio}
          rotulo="Esta promoção tem patrocinador"
          ajuda="A assinatura aparece no bloco da promoção enquanto ela estiver no ar."
        />

        {/* O aplicativo mostra UMA promoção, a mais recente.

            Duas no ar não é erro do sistema — a rádio pode ter duas campanhas correndo
            —, mas a segunda esconde a primeira do bloco principal, e isso precisa ser
            dito antes e não descoberto depois. */}
        {jaNoAr && (
          <div style={{
            marginTop: 16, padding: '11px 13px', borderRadius: 10,
            border: '1px solid rgba(246,130,31,.3)', background: 'rgba(246,130,31,.08)',
            fontSize: 12, lineHeight: 1.5, color: 'var(--texto-2)',
          }}>
            <strong style={{ color: 'var(--texto-1)' }}>{jaNoAr.titulo}</strong> está no ar.
            O aplicativo mostra uma por vez, a mais recente — se você publicar esta,
            aquela sai do bloco principal e continua aceitando inscrições por dentro.
          </div>
        )}

        {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 13 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 9, marginTop: 20, alignItems: 'center' }}>
          <button className="btn" onClick={salvar} disabled={!valido || salvando}
            style={{ fontSize: 14, padding: '10px 16px', opacity: valido && !salvando ? 1 : .5 }}>
            {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Colocar no ar'}
          </button>
          <button className="btn-vazio" onClick={aoFechar} disabled={salvando}
            style={{ fontSize: 13.5, padding: '9px 14px' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function ArteDaPromocao({
  rotulo, ajuda, url, enviando, aoEscolher, aoLimpar,
}: {
  rotulo: string
  ajuda: string
  url: string
  enviando: boolean
  aoEscolher: (f: File) => void
  aoLimpar: () => void
}) {
  return (
    <div>
      <label className="rotulo">{rotulo}</label>
      {url ? (
        <div style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" style={{
            width: '100%', height: 74, objectFit: 'cover',
            borderRadius: 9, background: '#000', display: 'block',
          }} />
          <button className="btn-vazio" onClick={aoLimpar}
            style={{ position: 'absolute', top: 5, right: 5, padding: '4px 8px', fontSize: 11.5 }}>
            Trocar
          </button>
        </div>
      ) : (
        <label className="linha" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 5, height: 74, cursor: 'pointer', color: 'var(--texto-3)', fontSize: 11.5,
          borderRadius: 9,
        }}>
          <Upload size={15} />
          {enviando ? 'Enviando…' : ajuda}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) aoEscolher(f) }} />
        </label>
      )}
    </div>
  )
}

/** O valor que o `datetime-local` entende: hora de parede, sem fuso. */
function paraCampo(d: Date) {
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Sugere o próximo horário redondo daqui a duas horas.
 *
 * Promoção de rádio quase nunca é para daqui a dez minutos nem para semana que vem:
 * é para hoje mais tarde, na hora cheia, quando o locutor abre o microfone.
 */
function sugestaoDeSorteio() {
  const d = new Date()
  d.setHours(d.getHours() + 2, 0, 0, 0)
  return paraCampo(d)
}
