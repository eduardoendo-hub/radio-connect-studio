'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Gift, Zap, CalendarDays } from 'lucide-react'
import { chamar, hora, lerToken } from '../../lib/api'
import { CascaStudio, CabecalhoTela } from '../casca'
import { Equipe, equipeDaEdicao, type Pessoa } from '../avatar'

type Edicao = {
  id: string
  inicioEm: string
  fimEm: string
  titulo: string | null
  programa: { id: string; nome: string; corDestaque: string | null; equipe?: Pessoa[] }
  locutor: Pessoa | null
  _count: { momentos: number }
}

type Hoje = {
  edicoes: Edicao[]
  aoVivoId: string | null
  resumo: { programas: number; momentosAgendados: number; promocoesAtivas: number }
}

function Indicador({ icone, valor, rotulo }: { icone: React.ReactNode; valor: number; rotulo: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icone}</span>
      <span>
        <strong className="numerico" style={{ fontWeight: 600 }}>{valor}</strong>{' '}
        <span style={{ color: 'var(--texto-2)' }}>{rotulo}</span>
      </span>
    </div>
  )
}

export default function Pagina() {
  const [dados, setDados] = useState<Hoje | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!lerToken()) { location.href = '/'; return }
    chamar<Hoje>('/studio/hoje').then(setDados).catch((e) => setErro(e.message))
  }, [])

  if (erro) {
    return <CascaStudio><main style={{ padding: '22px 26px' }}><div className="erro">{erro}</div></main></CascaStudio>
  }
  if (!dados) {
    return <CascaStudio><main style={{ padding: '22px 26px', color: 'var(--texto-3)' }}>Carregando…</main></CascaStudio>
  }

  const aoVivo = dados.edicoes.find((e) => e.id === dados.aoVivoId) ?? null

  return (
    <CascaStudio ritmo={dados.aoVivoId ? 'no-ar' : 'fora-do-ar'}>
    <main style={{ padding: '22px 26px 40px', maxWidth: 1080 }}>
      <CabecalhoTela
        titulo="Hoje"
        apoio={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      />

      {/* O dia abre com o TRABALHO, não com saudação nem gráfico. O produtor chega
          para operar — os números do dia são a primeira coisa que ele precisa ver. */}
      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', fontSize: 14.5 }}>
        <Indicador icone={<CalendarDays size={17} />} valor={dados.resumo.programas} rotulo="programas hoje" />
        {dados.resumo.momentosAgendados > 0 && (
          <Indicador icone={<Zap size={17} />} valor={dados.resumo.momentosAgendados} rotulo="Momentos agendados" />
        )}
        {dados.resumo.promocoesAtivas > 0 && (
          <Indicador icone={<Gift size={17} />} valor={dados.resumo.promocoesAtivas} rotulo="promoção ativa" />
        )}
      </div>

      {aoVivo && (
        <a href={`/ao-vivo/${aoVivo.id}`} className="cartao" style={{
          display: 'block', marginTop: 28,
          borderColor: 'rgba(227,39,30,.4)',
          background: 'linear-gradient(135deg, rgba(227,39,30,.09), rgba(15,32,32,.75) 55%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span className="etiqueta-ao-vivo"><span className="pulso" />NO AR</span>
              <div className="display" style={{ fontSize: 25, fontWeight: 600, marginTop: 13 }}>
                {aoVivo.titulo ?? aoVivo.programa.nome}
              </div>
              <div style={{ color: 'var(--texto-2)', marginTop: 9, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                {(() => {
                  const time = equipeDaEdicao(aoVivo.locutor, aoVivo.programa.equipe)
                  return time.length > 0 && (
                    <>
                      <Equipe pessoas={time} tamanho={26} />
                      <span>{time.map((p) => p.nome).join(', ')} ·</span>
                    </>
                  )
                })()}
                <span className="numerico">{hora(aoVivo.inicioEm)} às {hora(aoVivo.fimEm)}</span>
              </div>
            </div>
            <span className="btn" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              Entrar na operação <ChevronRight size={17} />
            </span>
          </div>
        </a>
      )}

      <h2 style={{ fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--texto-2)', margin: '36px 0 14px', fontWeight: 500 }}>
        Programação de hoje
      </h2>

      <div style={{ display: 'grid', gap: 8 }}>
        {dados.edicoes.map((e) => {
          const noAr = e.id === dados.aoVivoId
          return (
            <a key={e.id} href={`/ao-vivo/${e.id}`} className="linha" style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
              borderColor: noAr ? 'rgba(227,39,30,.32)' : undefined,
            }}>
              {/* Uma cor só para todos: a barra marca o ritmo da grade, não identifica
                  o programa. Cores diferentes por programa viravam ruído numa lista que
                  o produtor lê dezenas de vezes por dia. O vermelho fica reservado para
                  o que está no ar. */}
              <div style={{
                width: 3, height: 36, borderRadius: 2,
                background: noAr ? 'var(--ao-vivo)' : 'var(--accent)',
                opacity: noAr ? 1 : .5,
              }} />
              <div className="numerico" style={{ width: 52, color: 'var(--texto-2)', fontSize: 14 }}>
                {hora(e.inicioEm)}
              </div>
              {/* O rosto antes do nome: com quinze programas no dia, o produtor varre
                  a grade pela cor de quem está no ar muito mais rápido do que lendo
                  nome por nome. */}
              {(() => {
                const time = equipeDaEdicao(e.locutor, e.programa.equipe)
                return time.length > 0 ? <Equipe pessoas={time} tamanho={26} /> : null
              })()}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 15.5 }}>{e.titulo ?? e.programa.nome}</div>
                {e.locutor && (
                  <div style={{
                    color: 'var(--texto-3)', fontSize: 13, marginTop: 3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {equipeDaEdicao(e.locutor, e.programa.equipe).map((p) => p.nome).join(', ')}
                  </div>
                )}
              </div>
              {e._count.momentos > 0 && (
                <span style={{ color: 'var(--texto-2)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} /> <span className="numerico">{e._count.momentos}</span>
                </span>
              )}
              {noAr && <span className="pulso" />}
              <ChevronRight size={16} style={{ color: 'var(--texto-3)' }} />
            </a>
          )
        })}
      </div>
    </main>
    </CascaStudio>
  )
}
