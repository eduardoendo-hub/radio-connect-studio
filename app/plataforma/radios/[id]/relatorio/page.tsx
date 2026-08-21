'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CascaPlataforma } from '../../../casca'
import { chamarPlataforma } from '../../../../../lib/plataforma'

type Marca = {
  anuncianteId: string
  anunciante: string
  servidas: number
  cliques: number
  porPosicao: Record<string, number>
  campanhas: string[]
  porDia: { dia: string; total: number }[]
}

type Relatorio = {
  periodo: { de: string; ate: string }
  total: { servidas: number; vistas: number; cliques: number; concluidas: number }
  porQuemVendeu: { TECHNOW: number; RADIO: number }
  porPosicao: Record<string, number>
  anunciantes: Marca[]
  porDia: { dia: string; total: number }[]
}

/**
 * Os nomes que o comercial usa, e não os do banco.
 *
 * `assinatura_programa` é dado; "Patrocínio de programa" é o que está no contrato. Um
 * relatório que fala a língua do banco obriga quem lê a traduzir — e quem lê é quem
 * assina a fatura.
 */
const POSICAO: Record<string, string> = {
  no_ar_banner: 'Banner',
  chat_inline: 'Chat',
  preroll: 'Pré-roll',
  assinatura_programa: 'Patrocínio de programa',
  assinatura_momento: 'Patrocínio de Momento',
  assinatura_promocao: 'Patrocínio de promoção',
}

export default function RelatorioDaRadio() {
  const { id } = useParams<{ id: string }>()
  const [dados, setDados] = useState<Relatorio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [dias, setDias] = useState(30)

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    const ate = new Date()
    const de = new Date(ate.getTime() - dias * 864e5)
    const p = (n: number) => n.toString().padStart(2, '0')
    const data = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`

    chamarPlataforma<Relatorio>(`/emissoras/${id}/relatorio?de=${data(de)}&ate=${data(ate)}`)
      .then((r) => { if (vivo) { setDados(r); setErro('') } })
      .catch((e) => { if (vivo) setErro(e instanceof Error ? e.message : 'Não deu para carregar.') })
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [id, dias])

  return (
    <CascaPlataforma titulo="Entrega" voltarPara={`/plataforma/radios/${id}`}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: 'var(--texto-3)', fontSize: 13, margin: 0 }}>
          O que foi entregue no período, e quanto disso é da TechNow.
        </p>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} className={d === dias ? 'btn' : 'btn-vazio'}
              style={{ fontSize: 12, padding: '5px 11px' }}
              onClick={() => setDias(d)}>
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}
      {erro && <p style={{ color: '#FF9A95', fontSize: 13 }}>{erro}</p>}

      {dados && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <Cartao valor={dados.total.servidas} rotulo="exposições" destaque />
            <Cartao valor={dados.total.cliques} rotulo="cliques" />
            <Cartao valor={dados.porQuemVendeu.TECHNOW} rotulo="vendidas pela TechNow" />
            <Cartao valor={dados.porQuemVendeu.RADIO} rotulo="vendidas pela rádio" />
          </div>

          {/* Por tipo, no total. É a resposta para "onde a marca aparece" — e é a
              primeira coisa que o anunciante pergunta. */}
          {Object.keys(dados.porPosicao).length > 0 && (
            <div style={{ marginTop: 26 }}>
              <Titulo>ONDE APARECEU</Titulo>
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(dados.porPosicao)
                  .sort((a, b) => b[1] - a[1])
                  .map(([pos, n]) => (
                    <Barra key={pos} rotulo={POSICAO[pos] ?? pos} valor={n}
                      maximo={Math.max(...Object.values(dados.porPosicao))} />
                  ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 30 }}>
            <Titulo>POR ANUNCIANTE</Titulo>
            {dados.anunciantes.length === 0 && (
              <p style={{ color: 'var(--texto-3)', fontSize: 13 }}>
                Nenhuma exposição registrada neste período.
              </p>
            )}
            <div style={{ display: 'grid', gap: 12 }}>
              {dados.anunciantes.map((m) => (
                <div key={m.anuncianteId} className="cartao" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 700 }}>{m.anunciante}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 2 }}>
                        {m.campanhas.join(' · ') || '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="numerico" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                        {m.servidas}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--texto-3)', marginTop: 3 }}>
                        exposições{m.cliques > 0 ? ` · ${m.cliques} cliques` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                    {Object.entries(m.porPosicao).sort((a, b) => b[1] - a[1]).map(([pos, n]) => (
                      <span key={pos} style={{ fontSize: 11.5, color: 'var(--texto-3)' }}>
                        {POSICAO[pos] ?? pos}{' '}
                        <strong className="numerico" style={{ color: 'var(--texto-1)' }}>{n}</strong>
                      </span>
                    ))}
                  </div>

                  <Curva serie={m.porDia} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </CascaPlataforma>
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: 1.1,
      color: 'var(--texto-3)', marginBottom: 11,
    }}>{children}</div>
  )
}

function Cartao({ valor, rotulo, destaque }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className="cartao" style={{ padding: 16 }}>
      <div className="numerico" style={{
        fontSize: destaque ? 26 : 22, fontWeight: 700, lineHeight: 1,
        color: destaque ? 'var(--accent)' : 'var(--texto-1)',
      }}>
        {valor}
      </div>
      <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6 }}>{rotulo}</div>
    </div>
  )
}

function Barra({ rotulo, valor, maximo }: { rotulo: string; valor: number; maximo: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12.5, width: 176, color: 'var(--texto-2)' }}>{rotulo}</span>
      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.05)', borderRadius: 999 }}>
        <div style={{
          width: `${maximo ? (valor / maximo) * 100 : 0}%`, height: '100%',
          background: 'var(--accent)', borderRadius: 999,
        }} />
      </div>
      <span className="numerico" style={{ fontSize: 12.5, width: 52, textAlign: 'right' }}>{valor}</span>
    </div>
  )
}

/**
 * A curva do período.
 *
 * Desenhada com divs e não com biblioteca de gráfico: são trinta barras: uma dependência
 * inteira para isto seria peso sem retorno. E o essencial aqui não é a estética — é o
 * **buraco**: o dia em que a marca não apareceu é o dado mais importante da tela, e é o
 * que o anunciante percebe sem precisar de relatório nenhum.
 */
function Curva({ serie }: { serie: { dia: string; total: number }[] }) {
  if (serie.length === 0) return null
  const maximo = Math.max(...serie.map((d) => d.total), 1)
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
        {serie.map((d) => (
          <div key={d.dia} title={`${new Date(d.dia + 'T12:00:00').toLocaleDateString('pt-BR')}: ${d.total}`}
            style={{
              flex: 1,
              height: `${Math.max((d.total / maximo) * 100, d.total > 0 ? 6 : 2)}%`,
              background: d.total > 0 ? 'var(--accent)' : 'rgba(255,255,255,.07)',
              borderRadius: 2,
              minHeight: 2,
            }} />
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: 'var(--texto-3)', marginTop: 5,
      }}>
        <span>{new Date(serie[0].dia + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
        <span>{new Date(serie[serie.length - 1].dia + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )
}
