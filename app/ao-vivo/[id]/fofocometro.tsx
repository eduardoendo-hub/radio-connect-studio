'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Clock, Eye, EyeOff, Image as Icone, X, Zap } from 'lucide-react'

/**
 * O editor do Fofocômetro.
 *
 * O formato é simples de descrever e fácil de estragar: o produtor lança um gancho, o
 * relógio corre na tela do ouvinte, e na hora marcada a fofoca abre. Se a revelação
 * decepciona, a pessoa aprende a não esperar — e o próximo Fofocômetro já nasce
 * ignorado. O custo de um furo não é daquele Momento, é do formato.
 *
 * Por isso esta tela mostra **o gancho e a revelação lado a lado**, e não em passos
 * separados: o produtor precisa enxergar a promessa e a entrega ao mesmo tempo para
 * julgar se uma cabe na outra. Um assistente de três etapas esconderia exatamente a
 * comparação que importa.
 *
 * A revelação é obrigatória — o servidor recusa sem ela. Aqui o botão já nasce
 * desabilitado, para a recusa não ser uma surpresa depois do trabalho feito.
 */

export type FofocaParaPublicar = {
  tipo: 'FOFOCOMETRO'
  titulo: string
  duracaoSegundos: number
  templateId: string
  fofoca: {
    revelarEm: string
    revelacao: { texto: string; imagemUrl?: string | null }
    fonte?: string | null
  }
}

/** Quanto tempo de espera. Curto o bastante para segurar, longo o bastante para contar. */
const ESPERAS = [
  { rotulo: '2 min', segundos: 120 },
  { rotulo: '5 min', segundos: 300 },
  { rotulo: '10 min', segundos: 600 },
  { rotulo: '15 min', segundos: 900 },
  { rotulo: '30 min', segundos: 1800 },
]

export function EditorFofocometro({
  templateId,
  ganchoSugerido,
  ocupado,
  aoPublicar,
  aoFechar,
}: {
  templateId: string
  ganchoSugerido: string
  ocupado: boolean
  aoPublicar: (m: FofocaParaPublicar) => void
  aoFechar: () => void
}) {
  const [gancho, setGancho] = useState(ganchoSugerido)
  const [revelacao, setRevelacao] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [fonte, setFonte] = useState('')
  const [espera, setEspera] = useState(300)
  const [previa, setPrevia] = useState(false)
  const campoGancho = useRef<HTMLTextAreaElement>(null)

  // O foco começa no gancho: é a frase que decide se alguém vai esperar.
  useEffect(() => {
    campoGancho.current?.focus()
    campoGancho.current?.select()
  }, [])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') publicar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  const pronto = gancho.trim().length > 0 && revelacao.trim().length > 0

  function publicar() {
    if (!pronto || ocupado) return
    aoPublicar({
      tipo: 'FOFOCOMETRO',
      titulo: gancho.trim(),
      duracaoSegundos: espera,
      templateId,
      fofoca: {
        revelarEm: new Date(Date.now() + espera * 1000).toISOString(),
        revelacao: {
          texto: revelacao.trim(),
          imagemUrl: imagemUrl.trim() || null,
        },
        fonte: fonte.trim() || null,
      },
    })
  }

  return (
    <div
      onClick={aoFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.66)', backdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cartao"
        style={{ width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 9, flex: 'none',
            background: 'linear-gradient(135deg, var(--rosa), #8E1D46)',
            display: 'grid', placeItems: 'center',
          }}>
            <Zap size={16} color="#fff" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Fofocômetro</div>
            <div style={{ fontSize: 12.5, color: 'var(--texto-3)' }}>
              O gancho vai ao ar agora. A fofoca abre sozinha na hora marcada.
            </div>
          </div>
          <button className="btn-vazio" style={{ padding: 8 }} onClick={aoFechar}>
            <X size={16} />
          </button>
        </header>

        {/* Gancho e revelação lado a lado: é preciso ver a promessa e a entrega juntas
            para julgar se uma cabe na outra. */}
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 18 }}
             className="fofoca-colunas">
          <div>
            <label className="rotulo">O gancho <span style={{ color: 'var(--texto-3)' }}>· o que aparece agora</span></label>
            <textarea
              ref={campoGancho}
              className="campo"
              rows={3}
              value={gancho}
              onChange={(e) => setGancho(e.target.value)}
              placeholder="Você quer saber com quem o Zé Neto foi visto aos beijos?"
              style={{ resize: 'vertical', lineHeight: 1.4 }}
            />
            <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 7, lineHeight: 1.5 }}>
              Uma pergunta funciona melhor que um anúncio. É esta frase que decide se
              alguém vai esperar.
            </p>
          </div>

          <div>
            <label className="rotulo">
              A revelação <span style={{ color: 'var(--texto-3)' }}>· abre na hora marcada</span>
            </label>
            <textarea
              className="campo"
              rows={3}
              value={revelacao}
              onChange={(e) => setRevelacao(e.target.value)}
              placeholder="Conte a fofoca aqui. Isto fica invisível até a hora."
              style={{ resize: 'vertical', lineHeight: 1.4 }}
            />
            <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 7, lineHeight: 1.5 }}>
              Sem isto o gancho não vai ao ar. Um Fofocômetro que não entrega ensina a
              audiência a não esperar o próximo.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icone size={13} /> Foto <span style={{ color: 'var(--texto-3)' }}>· opcional</span>
          </label>
          <input
            className="campo"
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <label className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock size={13} /> Revelar em
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ESPERAS.map((e) => (
              <button
                key={e.segundos}
                onClick={() => setEspera(e.segundos)}
                style={{
                  padding: '9px 15px', borderRadius: 999, fontSize: 13.5,
                  border: '1px solid',
                  borderColor: espera === e.segundos ? 'var(--accent)' : 'var(--borda-forte)',
                  background: espera === e.segundos ? 'rgba(129,216,208,.14)' : 'transparent',
                  color: espera === e.segundos ? 'var(--accent)' : 'var(--texto-2)',
                }}
              >
                {e.rotulo}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--texto-3)', marginTop: 9 }}>
            Abre às{' '}
            <strong className="numerico" style={{ color: 'var(--texto-2)', fontWeight: 600 }}>
              {new Date(Date.now() + espera * 1000).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </strong>
            . Depois disso fica mais 15 minutos no ar, para quem chegar atrasado ler.
          </p>
        </div>

        {/* Rastro editorial. Não aparece para o ouvinte — existe para a emissora poder
            responder por onde a informação veio, se alguém perguntar. */}
        <div style={{ marginTop: 18 }}>
          <label className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <EyeOff size={13} /> Fonte <span style={{ color: 'var(--texto-3)' }}>· só a rádio vê</span>
          </label>
          <input
            className="campo"
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            placeholder="De onde veio a informação"
          />
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 10,
            padding: '11px 13px', borderRadius: 'var(--raio)',
            background: 'rgba(227,39,30,.07)', border: '1px solid rgba(227,39,30,.22)',
          }}>
            <AlertTriangle size={15} style={{ color: 'var(--ao-vivo)', flex: 'none', marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: 'var(--texto-2)', lineHeight: 1.5 }}>
              Fofoca sobre pessoa real é responsabilidade da emissora. Fica registrado
              quem publicou.
            </span>
          </div>
        </div>

        {/* Ver o que o ouvinte verá, antes de mandar. */}
        {previa && (
          <div style={{
            marginTop: 18, padding: 16, borderRadius: 14,
            background: '#181818', border: '1px solid rgba(255,255,255,.08)',
          }}>
            <div style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em',
              color: '#F6821F', marginBottom: 9,
            }}>
              FOFOCÔMETRO
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {gancho || 'O gancho aparece aqui'}
            </div>
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: '1px dashed rgba(255,255,255,.14)',
              fontSize: 13.5, color: 'rgba(255,255,255,.72)', lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--texto-3)', fontSize: 11.5 }}>
                abre em {ESPERAS.find((e) => e.segundos === espera)?.rotulo} →{' '}
              </span>
              {revelacao || 'A revelação aparece aqui'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, alignItems: 'center' }}>
          <button
            className="btn"
            disabled={!pronto || ocupado}
            onClick={publicar}
            style={{ opacity: !pronto || ocupado ? 0.45 : 1 }}
          >
            {ocupado ? 'Publicando…' : 'Lançar o gancho'}
          </button>
          <button className="btn-vazio" onClick={() => setPrevia((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5 }}>
            <Eye size={15} /> {previa ? 'Esconder prévia' : 'Ver a prévia'}
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--texto-3)' }}>
            {pronto ? '⌘↵ para lançar' : 'Escreva a revelação para liberar'}
          </span>
        </div>
      </div>
    </div>
  )
}
