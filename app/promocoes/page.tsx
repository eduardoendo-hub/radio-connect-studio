'use client'

import { useEffect, useState } from 'react'
import { Gift, Plus, Upload, Users, Clock, X } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar, enviarImagem, hora } from '../../lib/api'
import { SeletorPatrocinador } from '../patrocinador'

type Promocao = {
  id: string
  titulo: string
  descricao: string | null
  imagemUrl: string | null
  seloUrl: string | null
  sorteioEm: string | null
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
 * O bloco do ouvinte ficou pronto antes desta tela, e a promoção da demonstração só
 * existia porque estava escrita no seed. Isto é o que faltava para a rádio operar
 * sozinha — e é o formato que ela mais usa.
 */
export default function PaginaPromocoes() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)

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
          <button className="btn" onClick={() => setCriando(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Nova promoção
          </button>
        }
      />

      {carregando && <p style={{ color: 'var(--texto-3)' }}>Carregando…</p>}

      {!carregando && promocoes.length === 0 && (
        <div className="cartao" style={{ padding: 34, textAlign: 'center' }}>
          <Gift size={26} style={{ color: 'var(--texto-3)' }} />
          <p style={{ marginTop: 12, marginBottom: 4, fontSize: 15.5, fontWeight: 700 }}>
            Nenhuma promoção ainda
          </p>
          <p style={{ color: 'var(--texto-3)', fontSize: 13.5, margin: 0 }}>
            A promoção ocupa o bloco principal do aplicativo enquanto estiver no ar.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {promocoes.map((p) => (
          <div key={p.id} className="cartao" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
            {/* A arte é a mesma que o ouvinte vê. Miniatura genérica faria o produtor
                conferir um ícone em vez do que foi ao ar. */}
            {p.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imagemUrl} alt="" style={{ width: 116, objectFit: 'cover', alignSelf: 'stretch' }} />
            ) : (
              <div style={{ width: 116, background: 'var(--linha)' }} />
            )}
            <div style={{ flex: 1, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 1.1,
                  textTransform: 'uppercase', color: ROTULO[p.estado].cor,
                }}>
                  {ROTULO[p.estado].texto}
                </span>
                {p.patrocinador && (
                  <span style={{ fontSize: 11.5, color: 'var(--texto-3)' }}>
                    · oferecimento {p.patrocinador}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 5, letterSpacing: -.2 }}>
                {p.titulo}
              </div>
              <div style={{
                display: 'flex', gap: 18, marginTop: 9,
                fontSize: 12.5, color: 'var(--texto-3)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={13} /> {p.participantes}{' '}
                  {p.participantes === 1 ? 'inscrito' : 'inscritos'}
                </span>
                {p.sorteioEm && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} /> sorteio {hora(p.sorteioEm)}
                  </span>
                )}
              </div>
            </div>
            {p.estado === 'no_ar' && (
              <button
                className="btn-vazio"
                style={{ alignSelf: 'center', marginRight: 14, fontSize: 13, padding: '8px 13px' }}
                onClick={async () => {
                  if (!confirm(`Encerrar "${p.titulo}"? Ela sai do ar no aplicativo.`)) return
                  await chamar(`/studio/promocoes/${p.id}/encerrar`, { method: 'POST' })
                  await carregar()
                }}
              >
                Encerrar
              </button>
            )}
          </div>
        ))}
      </div>

      {criando && (
        <EditorPromocao
          aoFechar={() => setCriando(false)}
          aoCriar={async () => { setCriando(false); await carregar() }}
        />
      )}
    </CascaStudio>
  )
}

/** Um texto de partida para o regulamento. */
const REGRAS_PADRAO =
  'Promoção válida para maiores de 18 anos. Cada ouvinte concorre uma única vez. '
  + 'O sorteio acontece ao vivo e o nome do contemplado é anunciado pelo locutor. '
  + 'O prêmio é pessoal e intransferível.'

function EditorPromocao({ aoFechar, aoCriar }: { aoFechar: () => void; aoCriar: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  // Regulamento já vem preenchido de propósito. Em branco, a pressa do ao vivo faz a
  // promoção ir ao ar sem regra nenhuma — e regra de sorteio é a parte que a emissora
  // não pode improvisar depois.
  const [regras, setRegras] = useState(REGRAS_PADRAO)
  const [imagemUrl, setImagemUrl] = useState('')
  const [seloUrl, setSeloUrl] = useState('')
  const [enviando, setEnviando] = useState<'arte' | 'selo' | null>(null)
  const [patrocinio, setPatrocinio] = useState<string | null>(null)
  const [sorteio, setSorteio] = useState(() => sugestaoDeSorteio())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const valido = titulo.trim().length > 0 && sorteio.length > 0

  async function criar() {
    if (!valido || salvando) return
    setSalvando(true); setErro('')
    try {
      await chamar('/studio/promocoes', {
        method: 'POST',
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
      aoCriar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para criar agora.')
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
        style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
              <Gift size={15} />
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.1 }}>NOVA PROMOÇÃO</span>
            </div>
            <p style={{ color: 'var(--texto-3)', fontSize: 13, margin: '6px 0 0' }}>
              Vai ao ar assim que você criar, e ocupa o bloco principal do aplicativo.
            </p>
          </div>
          <button className="btn-vazio" onClick={aoFechar} style={{ padding: 8 }}><X size={16} /></button>
        </div>

        <label className="rotulo">O prêmio, em uma linha</label>
        <input className="campo" value={titulo} autoFocus
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="De Pertinho com Zé Neto e Cristiano" />

        <label className="rotulo" style={{ marginTop: 16 }}>Chamada</label>
        <input className="campo" value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Você e um acompanhante dentro da Band, num show exclusivo." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <ArteDaPromocao
            rotulo="Arte" ajuda="A foto que ocupa o topo do bloco"
            url={imagemUrl} enviando={enviando === 'arte'}
            aoEscolher={async (f) => {
              setEnviando('arte')
              try { setImagemUrl(await enviarImagem(f)) } finally { setEnviando(null) }
            }}
            aoLimpar={() => setImagemUrl('')}
          />
          <ArteDaPromocao
            rotulo="Selo" ajuda="A marca do quadro, se houver"
            url={seloUrl} enviando={enviando === 'selo'}
            aoEscolher={async (f) => {
              setEnviando('selo')
              try { setSeloUrl(await enviarImagem(f)) } finally { setEnviando(null) }
            }}
            aoLimpar={() => setSeloUrl('')}
          />
        </div>

        <label className="rotulo" style={{ marginTop: 18 }}>Sorteio</label>
        <input className="campo" type="datetime-local" value={sorteio}
          onChange={(e) => setSorteio(e.target.value)} />
        <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 7, lineHeight: 1.5 }}>
          As inscrições fecham na hora do sorteio — é como acontece no ar. Esta data é o
          que faz o ouvinte voltar: o aplicativo mostra a contagem e avisa quem se inscreveu.
        </p>

        <label className="rotulo" style={{ marginTop: 18 }}>Regulamento</label>
        <textarea className="campo" rows={5} value={regras}
          onChange={(e) => setRegras(e.target.value)} style={{ resize: 'vertical', lineHeight: 1.5 }} />
        <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 7, lineHeight: 1.5 }}>
          Aparece na tela da promoção, acima do botão — quem participa aceita este texto.
        </p>

        <SeletorPatrocinador
          valor={patrocinio} aoMudar={setPatrocinio}
          rotulo="Esta promoção tem patrocinador"
          ajuda="A assinatura aparece no bloco da promoção enquanto ela estiver no ar."
        />

        {erro && <p style={{ color: '#FF9A95', fontSize: 13, marginTop: 14 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, alignItems: 'center' }}>
          <button className="btn" onClick={criar} disabled={!valido || salvando}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: valido && !salvando ? 1 : .5 }}>
            <Gift size={16} /> {salvando ? 'Criando…' : 'Colocar no ar'}
          </button>
          <button className="btn-vazio" onClick={aoFechar} disabled={salvando}>Cancelar</button>
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
            width: '100%', height: 92, objectFit: 'cover',
            borderRadius: 10, background: '#000',
          }} />
          <button className="btn-vazio" onClick={aoLimpar}
            style={{ position: 'absolute', top: 6, right: 6, padding: '5px 9px', fontSize: 12 }}>
            Trocar
          </button>
        </div>
      ) : (
        <label className="linha" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, height: 92, cursor: 'pointer', color: 'var(--texto-3)', fontSize: 12.5,
          borderRadius: 10,
        }}>
          <Upload size={16} />
          {enviando ? 'Enviando…' : ajuda}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) aoEscolher(f) }} />
        </label>
      )}
    </div>
  )
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
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
