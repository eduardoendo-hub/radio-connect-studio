'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Plus, Trash2, Zap, Clock } from 'lucide-react'
import { SeletorPatrocinador } from '../../patrocinador'

export type Template = {
  id: string
  nome: string
  tipo: string
  titulo: string
  opcoesPadrao: { rotulo: string; emoji?: string }[]
  duracaoSegundos: number
  favorito: boolean
}

export type MomentoParaPublicar = {
  tipo: string
  titulo: string
  texto?: string
  opcoes: { rotulo: string; emoji?: string }[]
  duracaoSegundos: number
  templateId: string
  /// A campanha que assina este Momento, quando há uma. Relação, não texto.
  campanhaPatrocinadoraId?: string
}

/**
 * Editor do Momento, antes de publicar.
 *
 * O template não é o Momento pronto — é o **rascunho preenchido**. "Qual música toca
 * agora?" sem o nome das músicas não serve para nada; quem sabe o que está tocando é o
 * produtor, e é ele quem completa.
 *
 * A meta continua sendo publicar em menos de 20 segundos. Por isso tudo vem preenchido,
 * o foco cai direto no primeiro campo que precisa de atenção, e Enter publica. O editor
 * existe para ajustar, não para preencher do zero.
 */
export function EditorMomento({
  template,
  aoPublicar,
  aoFechar,
  ocupado,
}: {
  template: Template
  aoPublicar: (m: MomentoParaPublicar) => void
  aoFechar: () => void
  ocupado: boolean
}) {
  const precisaOpcoes = template.opcoesPadrao.length > 0

  const [titulo, setTitulo] = useState(template.titulo)
  const [texto, setTexto] = useState('')
  const [opcoes, setOpcoes] = useState(
    template.opcoesPadrao.map((o) => ({ rotulo: o.rotulo, emoji: o.emoji ?? '' })),
  )
  const [duracao, setDuracao] = useState(template.duracaoSegundos)
  const [patrocinio, setPatrocinio] = useState<string | null>(null)

  const primeiroCampo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // O foco cai onde está o trabalho: se há opções para preencher, na primeira delas;
    // senão, no título. Poupa um clique em toda publicação.
    primeiroCampo.current?.focus()
    primeiroCampo.current?.select()
  }, [])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) publicar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  const valido = titulo.trim().length > 0 && (!precisaOpcoes || opcoes.every((o) => o.rotulo.trim()))

  function publicar() {
    if (!valido || ocupado) return
    aoPublicar({
      tipo: template.tipo,
      titulo: titulo.trim(),
      texto: texto.trim() || undefined,
      opcoes: opcoes.filter((o) => o.rotulo.trim()).map((o) => ({
        rotulo: o.rotulo.trim(),
        emoji: o.emoji.trim() || undefined,
      })),
      duracaoSegundos: duracao,
      templateId: template.id,
      campanhaPatrocinadoraId: patrocinio ?? undefined,
    })
  }

  const duracoes = [60, 120, 180, 300, 600]

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
      <div
        onClick={(e) => e.stopPropagation()}
        className="cartao"
        style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
              color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Zap size={13} /> {template.nome}
            </div>
            <div style={{ color: 'var(--texto-3)', fontSize: 12.5, marginTop: 6 }}>
              Confira e ajuste. Ao publicar, chega no celular de quem está ouvindo.
            </div>
          </div>
          <button onClick={aoFechar} aria-label="Fechar"
            style={{ color: 'var(--texto-3)', padding: 4, display: 'flex' }}>
            <X size={19} />
          </button>
        </div>

        <label className="rotulo" htmlFor="ed-titulo">
          {template.tipo === 'AVISO' ? 'Mensagem' : 'Pergunta'}
        </label>
        <input
          id="ed-titulo"
          className="campo"
          value={titulo}
          ref={precisaOpcoes ? undefined : primeiroCampo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          style={{ fontSize: 16 }}
        />

        {precisaOpcoes && (
          <div style={{ marginTop: 20 }}>
            <label className="rotulo">Opções</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {opcoes.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="campo"
                    value={o.emoji}
                    onChange={(e) => {
                      const n = [...opcoes]; n[i] = { ...n[i]!, emoji: e.target.value }; setOpcoes(n)
                    }}
                    placeholder="🎵"
                    maxLength={4}
                    style={{ width: 62, textAlign: 'center', flex: 'none' }}
                    aria-label={`Emoji da opção ${i + 1}`}
                  />
                  <input
                    className="campo"
                    ref={i === 0 ? primeiroCampo : undefined}
                    value={o.rotulo}
                    onChange={(e) => {
                      const n = [...opcoes]; n[i] = { ...n[i]!, rotulo: e.target.value }; setOpcoes(n)
                    }}
                    placeholder={`Opção ${i + 1}`}
                    maxLength={60}
                    aria-label={`Texto da opção ${i + 1}`}
                  />
                  {opcoes.length > 2 && (
                    <button
                      onClick={() => setOpcoes(opcoes.filter((_, j) => j !== i))}
                      aria-label={`Remover opção ${i + 1}`}
                      style={{ color: 'var(--texto-3)', padding: '0 6px', flex: 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Duas ou três opções resolvem quase tudo. Mais que isso aumenta o esforço
                de quem está dirigindo e derruba a participação. */}
            {opcoes.length < 4 && (
              <button
                className="btn-vazio"
                onClick={() => setOpcoes([...opcoes, { rotulo: '', emoji: '' }])}
                style={{ marginTop: 9, padding: '8px 13px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Plus size={14} /> Mais uma opção
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <label className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock size={13} /> Fica no ar por
          </label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {duracoes.map((s) => (
              <button
                key={s}
                onClick={() => setDuracao(s)}
                className="numerico"
                style={{
                  padding: '9px 15px', borderRadius: 999, fontSize: 13.5,
                  border: `1px solid ${duracao === s ? 'var(--accent)' : 'var(--borda-forte)'}`,
                  background: duracao === s ? 'rgba(129,216,208,.13)' : 'transparent',
                  color: duracao === s ? 'var(--accent)' : 'var(--texto-2)',
                }}
              >
                {s < 60 ? `${s}s` : `${s / 60} min`}
              </button>
            ))}
          </div>
          {/* A janela é ampla de propósito: absorve a diferença de atraso entre quem
              ouve no FM e quem ouve pelo streaming. */}
          <div style={{ color: 'var(--texto-3)', fontSize: 12, marginTop: 9 }}>
            Janelas curtas deixam de fora quem ouve pelo FM, que chega alguns segundos atrasado.
          </div>
        </div>

        <SeletorPatrocinador valor={patrocinio} aoMudar={setPatrocinio} />

        <div style={{ display: 'flex', gap: 10, marginTop: 26, alignItems: 'center' }}>
          <button className="btn" onClick={publicar} disabled={!valido || ocupado}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: valido && !ocupado ? 1 : .5 }}>
            <Zap size={16} /> {ocupado ? 'Publicando…' : 'Publicar agora'}
          </button>
          <button className="btn-vazio" onClick={aoFechar} disabled={ocupado}>Cancelar</button>
          <div style={{ flex: 1 }} />
          <span style={{ color: 'var(--texto-3)', fontSize: 11.5 }}>⌘↵ publica</span>
        </div>
      </div>
    </div>
  )
}
