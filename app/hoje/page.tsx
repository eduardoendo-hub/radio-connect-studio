'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, LogOut, Mic2, Gift, Zap, CalendarDays } from 'lucide-react'
import { chamar, hora, lerOperador, lerToken, sair, type Operador } from '../../lib/api'
import { LogoStudio, LogoRadio, Rodape } from '../marca'

type Edicao = {
  id: string
  inicioEm: string
  fimEm: string
  titulo: string | null
  programa: { id: string; nome: string; corDestaque: string | null }
  locutor: { id: string; nome: string } | null
  _count: { momentos: number }
}

type Hoje = {
  edicoes: Edicao[]
  aoVivoId: string | null
  resumo: { programas: number; momentosAgendados: number; promocoesAtivas: number }
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
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
  const [operador, setOperador] = useState<Operador | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!lerToken()) { location.href = '/'; return }
    setOperador(lerOperador())
    chamar<Hoje>('/studio/hoje').then(setDados).catch((e) => setErro(e.message))
  }, [])

  if (erro) return <main className="container" style={{ paddingTop: 40 }}><div className="erro">{erro}</div></main>
  if (!dados) return <main className="container" style={{ paddingTop: 40, color: 'var(--texto-3)' }}>Carregando…</main>

  const aoVivo = dados.edicoes.find((e) => e.id === dados.aoVivoId) ?? null

  return (
    <main className="container" style={{ paddingTop: 22, paddingBottom: 40 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 38 }}>
        <LogoStudio tamanho={26} />
        <span className="display" style={{ fontWeight: 600 }}>
          Radio Connect <span style={{ color: 'var(--texto-3)', fontWeight: 500 }}>Studio</span>
        </span>
        <LogoRadio nome="Band FM" />
        <div style={{ flex: 1 }} />
        <span style={{ color: 'var(--texto-2)', fontSize: 13.5 }}>{operador?.nome}</span>
        <button className="btn-vazio" style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={sair}>
          <LogOut size={15} /> Sair
        </button>
      </header>

      {/* O dia abre com o TRABALHO, não com gráficos. Analisar vem depois de operar. */}
      <h1 style={{ fontSize: 34, fontWeight: 600 }}>
        {saudacao()}, {operador?.nome?.split(' ')[0]}.
      </h1>

      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 14, fontSize: 14.5 }}>
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
              <div style={{ color: 'var(--texto-2)', marginTop: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                {aoVivo.locutor && <><Mic2 size={14} /> {aoVivo.locutor.nome} ·</>}
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
              <div style={{ width: 3, height: 36, borderRadius: 2, background: e.programa.corDestaque ?? 'var(--borda-forte)' }} />
              <div className="numerico" style={{ width: 52, color: 'var(--texto-2)', fontSize: 14 }}>
                {hora(e.inicioEm)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15.5 }}>{e.titulo ?? e.programa.nome}</div>
                {e.locutor && (
                  <div style={{ color: 'var(--texto-3)', fontSize: 13, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mic2 size={12} /> {e.locutor.nome}
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

      <Rodape />
    </main>
  )
}
