'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Gift, Plus, Trash2, Trophy, Upload, X } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar, enviarImagem } from '../../lib/api'
import { SeletorPatrocinador } from '../patrocinador'

type Vencedor = { nome: string; telefone: string | null; inscritoEm: string }

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
  resultado: string | null
  publicada: boolean
  estado: 'no_ar' | 'preparada' | 'agendada' | 'encerrada' | 'sorteada'
}

const ROTULO = {
  no_ar: { texto: 'No ar', cor: 'var(--accent)' },
  preparada: { texto: 'Preparada', cor: 'var(--texto-2)' },
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
  const [sorteando, setSorteando] = useState<Promocao | null>(null)
  const [vencedor, setVencedor] = useState<{ promocao: Promocao; quem: Vencedor } | null>(null)

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
      {/* As outras telas do Studio já faziam isto e esta não: sem o `main`, a lista
          encostava na barra lateral de um lado e na borda da janela do outro, e num
          monitor largo cada linha virava uma faixa de dois metros. */}
      <main style={{ padding: '22px 26px 40px', maxWidth: 1080 }}>
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
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12.5, padding: '6px 11px', color: 'var(--texto-2)',
            }}>
            <Plus size={14} /> Nova promoção
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

      <div style={{ display: 'grid', gap: 6 }}>
        {promocoes.map((p) => (
          <div
            key={p.id}
            className="linha"
            onClick={() => setEditando(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '7px 12px', cursor: 'pointer',
              opacity: p.estado === 'no_ar' ? 1 : .72,
            }}
          >
            {/* Miniatura quadrada e pequena: serve para reconhecer, não para admirar.
                A arte inteira já tem a tela do aplicativo. */}
            {p.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imagemUrl} alt="" style={{
                width: 34, height: 34, objectFit: 'cover',
                borderRadius: 7, flexShrink: 0, background: '#000',
              }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                background: 'rgba(255,255,255,.05)',
                display: 'grid', placeItems: 'center',
              }}>
                <Gift size={14} style={{ color: 'var(--texto-3)' }} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 600, letterSpacing: -.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {p.titulo}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 1,
                fontSize: 11, color: 'var(--texto-3)',
              }}>
                <span style={{ color: ROTULO[p.estado].cor, fontWeight: 600 }}>
                  {ROTULO[p.estado].texto}
                </span>
                {p.resultado
                  ? <span>· contemplado: <strong style={{ color: 'var(--texto-2)' }}>{p.resultado}</strong></span>
                  : p.sorteioEm && <span>· sorteio {quando(p.sorteioEm)}</span>}
                {p.patrocinador && <span>· {p.patrocinador}</span>}
              </div>
            </div>

            {/* O número de inscritos é o que o produtor veio ver. É a única coisa desta
                linha com corpo grande. */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="numerico" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
                {p.participantes}
              </div>
              <div style={{ fontSize: 10, color: 'var(--texto-3)', marginTop: 2 }}>
                {p.participantes === 1 ? 'inscrito' : 'inscritos'}
              </div>
            </div>

            {/* Preparada: o botão é pôr no ar. É a ação óbvia de uma promoção que já
                foi conferida e está esperando. */}
            {p.estado === 'preparada' && (
              <button
                className="btn"
                style={{ flexShrink: 0, fontSize: 12, padding: '6px 12px' }}
                onClick={async (e) => {
                  e.stopPropagation()
                  await chamar(`/studio/promocoes/${p.id}/publicacao`,
                    { method: 'POST', body: JSON.stringify({ publicada: true }) })
                  await carregar()
                }}
              >
                Pôr no ar
              </button>
            )}

            {/* Tirar do ar sem encerrar: some da tela do ouvinte, as inscrições ficam
                de pé. É o que a rádio faz quando acha um erro no texto no meio da
                tarde. */}
            {p.estado === 'no_ar' && (
              <button
                className="btn-vazio"
                title="Tirar do ar sem encerrar"
                style={{ flexShrink: 0, fontSize: 12, padding: '5px 9px', color: 'var(--texto-3)' }}
                onClick={async (e) => {
                  e.stopPropagation()
                  await chamar(`/studio/promocoes/${p.id}/publicacao`,
                    { method: 'POST', body: JSON.stringify({ publicada: false }) })
                  await carregar()
                }}
              >
                <EyeOff size={14} />
              </button>
            )}

            {/* Com gente inscrita, a ação é **sortear** — e sortear encerra.
                
                Encerrar sozinho deixava a promoção no limbo: fora do ar, com inscritos
                esperando um nome que nunca sairia. Encerrar sem sortear continua
                existindo, mas só onde faz sentido: quando ninguém entrou. */}
            {p.estado === 'no_ar' && p.participantes > 0 && (
              <button
                className="btn"
                style={{ flexShrink: 0, fontSize: 12, padding: '6px 12px' }}
                onClick={(e) => { e.stopPropagation(); setSorteando(p) }}
              >
                Sortear
              </button>
            )}

            {p.estado === 'no_ar' && p.participantes === 0 && (
              <button
                className="btn-vazio"
                style={{ flexShrink: 0, fontSize: 12, padding: '5px 10px' }}
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!confirm(`Encerrar "${p.titulo}"? Ninguém se inscreveu.`)) return
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
                style={{ flexShrink: 0, fontSize: 12, padding: '5px 8px', color: 'var(--texto-3)' }}
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

      {sorteando && (
        <ConfirmarSorteio
          promocao={sorteando}
          aoFechar={() => setSorteando(null)}
          aoSortear={(quem) => {
            setVencedor({ promocao: sorteando, quem })
            setSorteando(null)
            void carregar()
          }}
        />
      )}

      {vencedor && (
        <Contemplado
          promocao={vencedor.promocao}
          quem={vencedor.quem}
          aoFechar={() => setVencedor(null)}
        />
      )}

      {editando && (
        <EditorPromocao
          promocao={editando === 'nova' ? null : editando}
          jaNoAr={editando === 'nova' ? promocoes.find((p) => p.estado === 'no_ar') ?? null : null}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => { setEditando(null); await carregar() }}
        />
      )}
      </main>
    </CascaStudio>
  )
}

/**
 * A confirmação do sorteio.
 *
 * Um passo a mais de propósito. Sortear é irreversível — o nome sai e não se sorteia de
 * novo —, e vai acontecer com o microfone aberto e a mão com pressa. A janela diz em
 * voz alta o que vai acontecer: quantos concorrem, que as inscrições fecham agora, e
 * que não dá para repetir.
 */
function ConfirmarSorteio({
  promocao,
  aoFechar,
  aoSortear,
}: {
  promocao: Promocao
  aoFechar: () => void
  aoSortear: (quem: Vencedor) => void
}) {
  const [sorteando, setSorteando] = useState(false)
  const [erro, setErro] = useState('')

  return (
    <Janela aoFechar={aoFechar} largura={430}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--accent)' }}>
        <Trophy size={14} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>SORTEAR</span>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -.3, margin: '10px 0 0' }}>
        {promocao.titulo}
      </h2>
      <p style={{ color: 'var(--texto-2)', fontSize: 13.5, lineHeight: 1.55, margin: '10px 0 0' }}>
        <strong className="numerico">{promocao.participantes}</strong>{' '}
        {promocao.participantes === 1 ? 'pessoa está concorrendo' : 'pessoas estão concorrendo'}.
        As inscrições fecham agora e o nome é escolhido na hora — <strong>não dá para
        sortear de novo</strong>.
      </p>

      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 12 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={sorteando}
          style={{ fontSize: 14, padding: '10px 16px', opacity: sorteando ? .5 : 1 }}
          onClick={async () => {
            setSorteando(true); setErro('')
            try {
              const r = await chamar<{ vencedor: Vencedor }>(
                `/studio/promocoes/${promocao.id}/sortear`, { method: 'POST' })
              aoSortear(r.vencedor)
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para sortear agora.')
              setSorteando(false)
            }
          }}>
          {sorteando ? 'Sorteando…' : 'Sortear agora'}
        </button>
        <button className="btn-vazio" onClick={aoFechar} disabled={sorteando}
          style={{ fontSize: 13.5, padding: '9px 14px' }}>Cancelar</button>
      </div>
    </Janela>
  )
}

/**
 * O contemplado, para o locutor ler no ar.
 *
 * Nome grande porque vai ser lido em voz alta, telefone logo abaixo porque a produção
 * liga em seguida. É a única tela do produto que mostra telefone de ouvinte — e por
 * isso ela é do Studio, e o aplicativo mostra só "Eduardo E.".
 */
function Contemplado({
  promocao,
  quem,
  aoFechar,
}: {
  promocao: Promocao
  quem: Vencedor
  aoFechar: () => void
}) {
  return (
    <Janela aoFechar={aoFechar} largura={430}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--accent)' }}>
        <Trophy size={14} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>CONTEMPLADO</span>
      </div>
      <p style={{ color: 'var(--texto-3)', fontSize: 12.5, margin: '9px 0 0' }}>{promocao.titulo}</p>

      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -.7, margin: '14px 0 0', lineHeight: 1.1 }}>
        {quem.nome}
      </div>
      {quem.telefone && (
        <div className="numerico" style={{ fontSize: 17, color: 'var(--texto-2)', marginTop: 7 }}>
          {quem.telefone}
        </div>
      )}

      <p style={{ color: 'var(--texto-3)', fontSize: 12, lineHeight: 1.5, marginTop: 16 }}>
        O aplicativo já mostra o resultado para quem participou. No ar, o nome inteiro;
        na tela, só o primeiro nome e a inicial.
      </p>

      <button className="btn" onClick={aoFechar}
        style={{ fontSize: 14, padding: '10px 16px', marginTop: 18 }}>Pronto</button>
    </Janela>
  )
}

/** A janela sobreposta, que já era a mesma em três lugares desta tela. */
function Janela({
  children,
  aoFechar,
  largura = 540,
}: {
  children: React.ReactNode
  aoFechar: () => void
  largura?: number
}) {
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
        style={{ width: '100%', maxWidth: largura, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        {children}
      </div>
    </div>
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
  const [erroArte, setErroArte] = useState({ arte: '', selo: '' })
  const [patrocinio, setPatrocinio] = useState<string | null>(promocao?.campanhaPatrocinadoraId ?? null)
  const [sorteio, setSorteio] = useState(() =>
    promocao?.sorteioEm ? paraCampo(new Date(promocao.sorteioEm)) : sugestaoDeSorteio())
  const [publicar, setPublicar] = useState(promocao ? promocao.publicada : true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const valido = titulo.trim().length > 0 && sorteio.length > 0

  /**
   * Envia a arte e **conta quando dá errado**.
   *
   * A primeira versão era `try { ... } finally { ... }`, sem `catch`: a falha subia
   * como rejeição não tratada, o rótulo voltava para "foto do topo" e a tela não dizia
   * nada. Foi assim que o envio ficou quebrado por CORS sem ninguém saber — o produtor
   * escolhia o arquivo, esperava, e nada acontecia.
   *
   * Envio de arquivo falha por motivos que a pessoa resolve sozinha se souber quais:
   * arquivo grande demais, formato que não entra. Engolir isso é o pior erro possível.
   */
  async function enviarArte(
    f: File,
    qual: 'arte' | 'selo',
    guardar: (url: string) => void,
  ) {
    setEnviando(qual)
    setErroArte((e) => ({ ...e, [qual]: '' }))
    try {
      guardar(await enviarImagem(f))
    } catch (e) {
      setErroArte((antes) => ({
        ...antes,
        [qual]: e instanceof Error ? e.message : 'Não deu para enviar esta imagem.',
      }))
    } finally {
      setEnviando(null)
    }
  }

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
          publicada: publicar,
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
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 900, maxHeight: '90vh',
          display: 'flex', gap: 18, alignItems: 'flex-start',
        }}>
      <div className="cartao"
        style={{ flex: 1, minWidth: 0, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
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
            url={imagemUrl} enviando={enviando === 'arte'} erro={erroArte.arte}
            aoEscolher={(f) => enviarArte(f, 'arte', setImagemUrl)}
            aoLimpar={() => setImagemUrl('')}
          />
          <ArteDaPromocao
            rotulo="Selo" ajuda="marca do quadro"
            url={seloUrl} enviando={enviando === 'selo'} erro={erroArte.selo}
            aoEscolher={(f) => enviarArte(f, 'selo', setSeloUrl)}
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

        {/* Publicar é decisão separada de criar. Desmarcado, a promoção existe no
            Studio e não existe para o ouvinte — que é como se prepara com calma. */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer',
        }}>
          <input type="checkbox" checked={publicar}
            onChange={(e) => setPublicar(e.target.checked)}
            style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
          {publicar ? <Eye size={15} style={{ color: 'var(--accent)' }} />
                    : <EyeOff size={15} style={{ color: 'var(--texto-3)' }} />}
          <span style={{ fontSize: 13.5 }}>
            {publicar ? 'No ar para os ouvintes' : 'Só aqui no Studio, por enquanto'}
          </span>
        </label>

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

      <Previa titulo={titulo} descricao={descricao} imagemUrl={imagemUrl} seloUrl={seloUrl}
        sorteio={sorteio} />
      </div>
    </div>
  )
}

/**
 * A prévia: o cartão como o ouvinte vai ver, enquanto o produtor digita.
 *
 * Sem ela, "conferir antes de publicar" é conferir um formulário — e formulário não
 * mostra que o título quebra em três linhas, que a arte tem o rosto do artista
 * exatamente onde entra o texto, ou que o selo sumiu no fundo. Essas coisas só aparecem
 * na forma final, e descobri-las no ar é caro.
 *
 * É uma cópia do widget do aplicativo, e isso é uma dívida assumida: quando o cartão de
 * lá mudar, este precisa mudar junto. Vale porque a alternativa — o produtor abrir o
 * aplicativo num celular ao lado para conferir — é o que ele faz hoje, e é pior.
 */
function Previa({
  titulo, descricao, imagemUrl, seloUrl, sorteio,
}: {
  titulo: string
  descricao: string
  imagemUrl: string
  seloUrl: string
  sorteio: string
}) {
  return (
    <div style={{ width: 320, flexShrink: 0 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1,
        color: 'var(--texto-3)', marginBottom: 9, textAlign: 'center',
      }}>
        COMO O OUVINTE VÊ
      </div>

      {/* O fundo é o do aplicativo, não o do Studio: a prévia só serve se as cores
          forem as de lá. */}
      <div style={{
        background: '#0A0A0A', borderRadius: 18, padding: 12,
        border: '1px solid var(--borda)',
      }}>
        <div style={{
          background: '#181818', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 10px 24px -10px rgba(0,0,0,.6)',
        }}>
          {imagemUrl && (
            <div style={{ position: 'relative', height: 160 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagemUrl} alt="" style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 45%, rgba(24,24,24,.55) 82%, #181818 100%)',
              }} />
              <span style={{
                position: 'absolute', left: 12, top: 11,
                background: 'rgba(0,0,0,.55)', borderRadius: 999,
                padding: '4px 8px', fontSize: 8.5, fontWeight: 800,
                letterSpacing: 1.1, color: '#fff',
              }}>
                PROMOÇÃO NO AR
              </span>
              {seloUrl && (
                <span style={{
                  position: 'absolute', left: 11, bottom: 8,
                  background: '#000', borderRadius: 7, padding: '3px 6px',
                  display: 'inline-flex',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={seloUrl} alt="" style={{ height: 26, objectFit: 'contain' }} />
                </span>
              )}
            </div>
          )}
          <div style={{ padding: '12px 14px 15px' }}>
            <div style={{
              fontSize: 17, fontWeight: 800, letterSpacing: -.3, lineHeight: 1.18, color: '#fff',
            }}>
              {titulo || 'O prêmio aparece aqui'}
            </div>
            {descricao && (
              <div style={{ fontSize: 11.5, color: '#B3B3B3', lineHeight: 1.4, marginTop: 5 }}>
                {descricao}
              </div>
            )}
            <div style={{
              marginTop: 12, background: '#F6821F', color: '#000',
              borderRadius: 999, padding: '10px 0', textAlign: 'center',
              fontSize: 12.5, fontWeight: 800,
            }}>
              Quero participar
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--texto-3)', marginTop: 9, textAlign: 'center' }}>
        {sorteio ? `Sorteio ${quando(new Date(sorteio).toISOString())}` : 'Escolha a hora do sorteio'}
      </div>
    </div>
  )
}

function ArteDaPromocao({
  rotulo, ajuda, url, enviando, erro, aoEscolher, aoLimpar,
}: {
  rotulo: string
  ajuda: string
  url: string
  enviando: boolean
  /// O que deu errado no último envio. Ver o comentário em `enviarArte`.
  erro: string
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
      {erro && (
        <p style={{ color: '#FF9A95', fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>{erro}</p>
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
